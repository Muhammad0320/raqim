use clap::Parser;
use synapse_core::{AgentState, OpLog};
use synapse_core::axon::AxonGateKeeper;
use synapse_core::cortex::{AgentThought, CortexDataPlane};
use synapse_core::network::GlobalNetworkBridge;
use synapse_core::nucleus::WalEngine;
use synapse_core::state::SwarmState;
use tokio::net::TcpListener;
use tokio::io::AsyncReadExt;
use tokio::sync::mpsc;
use uuid::Uuid; 
use std::sync::{Arc};

/// Synapse Daemon: The Agentic Control Plane
#[derive(Parser, Debug, Clone)]
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

    // The Local cortex actor
    let cortex = CortexDataPlane::new(&config.topic);
    cortex.listen_for_local_thoughts(brain.clone(), axon.clone());

    
    // Channel to talk to the publisher safely accross threads
    let (cortex_tx, mut cortex_rx) = mpsc::channel::<Vec<u8>>(1000);
    
    let topic_clone = config.topic.clone(); 

    // Dedicated physical thread !Send publisher. 
    std::thread::spawn(move || {
        // Initialize publisher inside the thread
        let cortex = CortexDataPlane::new(&topic_clone);
        let local_publisher = Arc::new(cortex.create_publisher().expect("Failed to map publisher"));

        // blocking_rev() halts the thread until data arrives, no yield_now() needed
        while let Some(bytes) = cortex_rx.blocking_recv() {
            // Loan exactly the numbe rof bytes we need
            if let Ok(sample) = local_publisher.loan_slice_uninit(bytes.len()) {
                let _ = sample.write_from_slice(&bytes).send();
                
            } 
        }
    });


    // 2 Background Listeners (Zenoh Global network)
    let global_net = Arc::new(GlobalNetworkBridge::new(&topic_clone).await);
    let global_net_clone = global_net.clone();
    let global_axon = axon.clone();
    let global_brain = brain.clone();
    tokio::spawn(async move {

        global_net_clone.listen_for_foreign_thoughts(global_brain, global_axon).await;
    });


    // 3. The Production TCP ingress. 
    let listener = TcpListener::bind(format!("127.0.0.1:{}", config.port)).await.unwrap();
    println!("Organism live. Awaiting LLM Agent TCP Connections...");
    
    loop {

        let (mut socket, addr) = listener.accept().await.unwrap();
        println!("External Agent connected from: {}", addr);

        let task_brain = brain.clone();
        let task_axon = axon.clone();
        let task_cortex_tx = cortex_tx.clone();
        let task_wal = wal.clone();
        let task_publisher =   local_publisher.clone();
        let global_publisher = global_net.clone();


        tokio::spawn(async move {

            //  THE FRAMING PROTOCOL: Read 4-byte length prefix first
            let mut len_buf = [0u8; 4];
            if socket.read_exact(&mut len_buf).await.is_err() {return;}
            let payload_len = u32::from_le_bytes(len_buf) as usize;

            // Prevent malicious massive memory allocation attacks ( Max 1mb per thought )
            if payload_len > 1024 * 1024 {return;}

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
            let agent_uuid_bytes = Uuid::new_v4().into_bytes();
            let agent_hex = hex::encode( agent_uuid_bytes );
            task_brain.update_agent_state(&agent_hex, &incoming_state);
            let delta = task_brain.export_delta();
            let delta_len = delta.len() as u32;

            // Contruct the raw log 
            let raw_log = OpLog {
                agent_id: agent_uuid_bytes,
                state: incoming_state,
                delta,
                previous_hash: [0; 32],
                current_hash: [0; 32]
            };
            
            // 3. Cryptographically Seal (Markle DAG)
            let sealed_log = task_axon.seal_thought(raw_log);

            // 4. Fire to wal (Durability) 
            task_wal.append(sealed_log.clone());

            // 5. Fire to Local Cortex (Zero-Copy)
            let serialized_log = rkyv::to_bytes::<rkyv::rancor::Error>(&sealed_log).expect("Failed to serialize opLog for cortex");
            let _ = task_cortex_tx.send(serialized_log.into_vec()).await;

            // 6. Fire to global swarm
            global_publisher.broadcast_to_world(&sealed_log).await; 

            println!("Thought processed, sealed, and broadcast in sub-milliseconds.");
        });

    }

}