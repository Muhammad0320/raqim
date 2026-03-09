use std::sync::Arc;

use crate::OpLog;
use crate::axon::AxonGateKeeper;
use crate::state::SwarmState;
use rkyv::{Archive, to_bytes};
use zenoh::config::Config;
use zenoh::Session;



pub struct GlobalNetworkBridge {

    session: Arc<Session>,
    workspace_prefix: String

}

impl GlobalNetworkBridge {

    /// Bootstraps the modern Zenoh P2P Node 
    pub async fn new (swarm_name: &str) -> Self {

        println!("Bismillah. Initialializing Zenoh Global Network Bridge...");
        
        // Config::default() automatically discovers other nodes on LAN/WAN
        let config = Config::default();
        let session = zenoh::open(config).await.expect("Failed to start zenoh");

        Self {

            session: Arc::new(session),
            workspace_prefix: format!("synapse/swarm/{}", swarm_name)

        }

    }

    /// Takes a locally verfied Oplog and broadcasts it to the global swarm
    pub async fn broadcast_to_world(&self, log: &OpLog) {

        let key_expr = format!("{}/thoughts", self.workspace_prefix);

        let bytes = to_bytes::<rkyv::rancor::Error>(log).expect("Zero-copy serialization failed");

        self.session.put(key_expr, bytes.to_vec()).await.expect("Failed to broadcast thought")

    }

    /// Listens for foreign thoughts from the global network
    pub async fn listen_for_foreign_thoughts(&self, brain: Arc<SwarmState>, axon: Arc<AxonGateKeeper>) {

        let key_expr = format!("{}/thoughts", self.workspace_prefix);

        // Clone the Arc to safely pass the session into the background thread
        let session_clone = self.session.clone();

        println!("Listening for global swarm synchronization on: {} ...", key_expr);
        tokio::spawn(async move {

            let subscriber = session_clone.declare_subscriber(key_expr).await.unwrap();

            while let Ok(sample) = subscriber.recv_async().await {

                // Payload extraction 
                let payload_bytes = sample.payload().to_bytes();

                // Zero-Copy Deserialize
                let archived_log = unsafe {
                    rkyv::access_unchecked::<<OpLog as Archive>::Archived>(&payload_bytes)
                };
                let log: OpLog = rkyv::deserialize::<OpLog, rkyv::rancor::Error>(archived_log).expect("Network Deserialization Failed");


                // Cryptographic verification (The Circuit Breaker)
                if axon.verify_foreign_thoughts(&log) {
                    brain.assimilate_foreign_thought(&log.delta);
                    println!("Assimilated foreign thought from Agent: {:?} ", log.agent_id)
                } else {
                    eprintln!("SECURITY BREACH: Forged thought detected on network. Dropping.")
                }

            }

        });

    }

}