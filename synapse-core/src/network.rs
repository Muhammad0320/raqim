use std::sync::Arc;

use crate::axon::AxonGateKeeper;
use crate::state::SwarmState;
use crate::{OpLog, SystemEvent};
use rkyv::{Archive, Archived, to_bytes};
use tokio::sync::broadcast::Sender;
use zenoh::Session;
use zenoh::config::Config;

pub struct GlobalNetworkBridge {
    session: Arc<Session>,
    workspace_prefix: String,
}

impl GlobalNetworkBridge {
    /// Bootstraps the modern Zenoh P2P Node
    pub async fn new(swarm_name: &str) -> Self {
        println!("Bismillah. Initialializing Zenoh Global Network Bridge...");

        // Config::default() automatically discovers other nodes on LAN/WAN
        let config = Config::default();
        let session = zenoh::open(config).await.expect("Failed to start zenoh");

        Self {
            session: Arc::new(session),
            workspace_prefix: format!("synapse/swarm/{}", swarm_name),
        }
    }

    /// Takes a locally verfied Oplog and broadcasts it to the global swarm
    pub async fn broadcast_to_world(&self, log: &OpLog) {
        let key_expr = format!("{}/thoughts", self.workspace_prefix);

        let bytes = to_bytes::<rkyv::rancor::Error>(log).expect("Zero-copy serialization failed");

        self.session
            .put(key_expr, bytes.to_vec())
            .await
            .expect("Failed to broadcast thought")
    }

    /// Listens for foreign thoughts from the global network
    pub async fn listen_for_foreign_thoughts(
        &self,
        brain: Arc<SwarmState>,
        axon: Arc<AxonGateKeeper>,
        tx: Sender<SystemEvent>,
    ) {
        let key_expr = format!("{}/thoughts", self.workspace_prefix);

        // Clone the Arc to safely pass the session into the background thread
        let session_clone = self.session.clone();

        println!(
            "Listening for global swarm synchronization on: {} ...",
            key_expr
        );
        tokio::spawn(async move {
            let subscriber = session_clone.declare_subscriber(key_expr).await.unwrap();

            while let Ok(sample) = subscriber.recv_async().await {
                // 1. Zenoh payload can be fragmented in memory (chunked) .contiguous() forces Zenoh to yield a single flat memory slice &[u8].
                // IF it's already flat (most cases). this const zero CPU cycles.
                let payload_bytes = sample.payload().contiguous();

                // 2. We cast pointer directly over ZENOH network buffer!
                let archived_log = unsafe {
                    rkyv::access_unchecked::<<OpLog as Archive>::Archived>(&payload_bytes)
                };

                // Cryptographic verification on Raw pounter
                if axon.verify_foreign_thoughts(archived_log) {
                    if let Err(e) = brain.assimilate_foreign_thought(archived_log.delta.as_slice())
                    {
                        eprintln!("CRDT Assimilation Failed: {} ", e);
                    } else {
                        println!(
                            "Assimlated foreign thoughts from Agent: {}",
                            hex::encode(archived_log.agent_id.as_slice())
                        )
                    }
                } else {
                    eprintln!("SECURITY BREACH: Forged thought detected on network. Dropping.");
                    let _ = tx.send(SystemEvent::SecurityBreach {
                        agent_id: hex::encode(&log.agent_id),
                        reason: "Forged thought detected on global network - Markle Hash Mismatch "
                            .to_string(),
                        culprit_text: log.state.text,
                    });
                }
            }
        });
    }
}
