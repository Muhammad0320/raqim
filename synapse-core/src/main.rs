use clap::Parser;
use synapse_core::{AgentState, OpLog};
use synapse_core::axon::AxonGateKeeper;
use synapse_core::cortex::{AgentThought, CortexDataPlane};
use synapse_core::network::GlobalNetworkBridge;
use synapse_core::nucleus::WalEngine;
use synapse_core::state::SwarmState;
use tokio::net::TcpListener;
use tokio::io::AsyncReadExt; 
use std::sync::Arc;

/// Synapse Daemon: The Agentic Control Plane
#[derive(Parser, Debug)]
#[command(author, version, about)]
struct DameonConfig {

    /// The namespace for this specific agent swarm 
    #[arg(short, long, env = "SYNAPSE_SWARM_TOPIC")]
    topic: String,

    /// Path to append-only wal file.
    #[arg(short, long, env = "SYNAPSE_WAL_PATH")]
    wal_path: String,

    /// Port for local python agent to connect to
    #[arg(short, long, default_value_t = 8080)]
    port: u16,

}


#[tokio::main]
async  fn main() {

    let config = DameonConfig::parse();
    println!("Bismillah. Booting Synapse Daemon on port {}...", config.port);

    // 1. BOOT SEQUENCE: INIITIALIZE ALL LAYERS (Wrapped in Arc for fearless concurrency)
    let brain = Arc::new(SwarmState::new(&config.topic));
    let axon = Arc::new(AxonGateKeeper::new());
    let wal = Arc::new(WalEngine::start(&config.wal_path).await);

    let cortex = CortexDataPlane::new(&config.topic);
    let local_publisher = Arc::new(cortex.create_publisher().expect("Failed to map publisher"));
    
    let global_net = Arc::new(GlobalNetworkBridge::new(&config.topic).await);

    // 2 Background Listeners (Zenoh Global network)
    let global_net_clone = global_net.clone();

    tokio::spawn(async move {

        global_net_clone.listen_for_foreign_thoughts().await();
    });

    // 3. The Production TCP ingress. 
    let listener = TcpListener::bind(format!("127.0.0.1:{}", config.port)).await.unwrap();
    println!("Organism live. Awaiting LLM Agent TCP Connections...");


    loop {

        let (mut socket, addr) = listener.accept().await.unwrap();
        println!("External Agent connected from: {}", addr);

        let task_brain = brain.clone();
        let task_axon = axon.clone();
        let task_wal = wal.clone();
        let task_publisher = local_publisher.clone();
        let global_publisher = global_net.clone();



        tokio::spawn(async move {

            //  THE FRAMING PROTOCOL: Read 4-byte length prefix first
            let mut len_buf = [0u8; 4];
            if socket.read_exact(&mut len_buf).await.is_err() {return};
            let payload_len = u32::from_le_bytes(len_buf) as usize;

            // Prevent malicious massive memory allocation attacks ( Max 1mb per thought )
            if payload_len > 1024 * 1024 {return};

            // Read the exact payload bytes
            let mut payload_buf = vec![0u8; payload_len];
            if socket.read_exact(&mut payload_buf).await.is_err() {return;}

            // TRUE Zero-copy deserialization of incoming data
            let archived_state = unsafe {
                rkyv::access_unchecked::<<AgentState as rkyv::Archive>::Archived>(&payload_buf)
            };
            let incoming_state: AgentState = rkyv::deserialize::<AgentState, rkyv::rancor::Error>(archived_state).expect("Failed to deserialize agent state");

            // --- The Synaptic Cascade ---
            
            // 1. Mutate the brain
            let agent_hex = hex::encode(incoming_state.agent_id.unwrap_or([0;16]));
            task_brain.update_agent_state(&agent_hex, &incoming_state);
            let delta = task_brain.export_delta();

            // Contruct the raw log 
            let raw_log = OpLog {
                agent_id: incoming_state.agent_id.unwrap_or([0;16]),
                state: incoming_state,
                delta,
                previous_hash: [0; 32],
                current_hash: [0; 32]
            };

            // 3. Cryptographically Seal (Markle DAG)
            let sealed_log = task_axon.seal_thought(raw_log);

            // 4. Fire to wal (Durability) 
            task_wal.append(sealed_log.clone());

            // 5. Fire to Local Cortex ( Zero-Copy Notification )
            if let Ok(sample) = task_publisher.loan_uninit() {
                let notification = AgentThought {
                    agent_id: sealed_log.agent_id,
                    thought_id: sealed_log.state.transaction_id,
                    payload_size: delta.len() as u32,
                };

                let _ = sample.write_payload(notification).send();
            }


            // 6. Fire to global swarm
            global_publisher.broadcast_to_world(&sealed_log).await; 


            println!("Thought processed, sealed, and broadcast in sub-milliseconds.");
        });

    }


}