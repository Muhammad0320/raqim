use clap::Parser;
use synapse_core::axon::AxonGateKeeper;
use synapse_core::cortex::CortexDataPlane;
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
    #[arg(short, long, env = "SYNAPSE_WAL_PATH", default_value = "production.wal")]
    wal_path: String,

    /// Port for local python agent to connect to
    #[arg(short, long, default_value_t = 8080)]
    port: u16,

}




#[tokio::main]
async  fn main() {

    let config = DameonConfig::parse();
    println!("Bismillah. Booting Synapse Daemon on port {}...", config.port);

    // 1. BOOT SEQUENCE: INIITIALIZE ALL LAYERS
    let brain = SwarmState::new(&config.topic);
    let axon = Arc::new(AxonGateKeeper::new());
    let wal = WalEngine::start(&config.wal_path).await;

    let cortex = CortexDataPlane::new(&config.topic);
    let local_publisher = cortex.create_publisher().expect("Failed to map publisher");
    
    let global_net = GlobalNetworkBridge::new(&config.topic).await;

    // 2. THE Real ingress layer.
    let listener = TcpListener::bind(format!("127.0.0.1:{}", config.port)).await.unwrap();
    println!("Organism unified. Listening for Python Agent Connections...");

    // We start the global zenog listener in the background
    tokio::spawn(async move {
        global_net.listen_for_foreign_thoughts().await;
    }); 

    // 3. The TCP Accept loop

    loop {

        let (mut socket, addr) = listener.accept().await.unwrap();
        println!("Agent connected from: {}", addr);

        tokio::spawn(async move {

            let mut buffer = [0; 4096]; // Buffer for incoming agent thought

            // Wait for the python agent to send a payload. 
            if let Ok(bytes_read) = socket.read(&mut buffer).await {

                if bytes_read == 0 {return;}

                

            }

        });

    }


}