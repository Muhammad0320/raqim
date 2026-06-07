use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::axon::AxonGateKeeper;
use crate::state::SwarmStateRegistry;
use crate::telemetry::TelemetryEngine;
use crate::{A2AEnvelope, OpLog, SystemEvent};
use rkyv::{Archive, to_bytes};
use tokio::sync::broadcast::Sender;
use tokio::sync::mpsc;
use zenoh::Session;

use crate::aegis::AegisGateKeeper;
use tokio::time::{Duration, timeout};

pub struct GlobalNetworkBridge {
    session: Arc<Session>,
    workspace_prefix: String,
    aegis: Arc<AegisGateKeeper>,
    os_node_id: String,
    egress_tx: mpsc::Sender<Vec<u8>>, // The high-speed funnel
}

impl GlobalNetworkBridge {
    /// Bootstraps the modern Zenoh P2P Node
    pub async fn new(
        tenant_id: &str,
        swarm_name: &str,
        aegis: Arc<AegisGateKeeper>,
        allow_wan: bool,
        os_node_id: String,
    ) -> Self {
        println!("Bismillah. Initialializing Zenoh Global Network Bridge...");

        // Config::default() automatically discovers other nodes on LAN/WAN
        let mut config = zenoh::Config::default();

        if !allow_wan {
            // THE PHYSICAL BARRICADE
            // 1. Disable connecting to external zenoh router.
            config.insert_json5("connect/endpoints", r#"[]"#).unwrap();

            // Listen on all local IP addresses (e.g., 192.168.1.5)
            config
                .insert_json5("listen/endpoints", r#"["tcp/0.0.0.0:7447"]"#)
                .unwrap();

            // Multicast: Shouts "Are there any other Raqim nodes here?" across the wifi
            config
                .insert_json5("scouting/multicast/enabled", "true")
                .unwrap();

            println!("[NETWORK] Zenoh locked to Localhost/LAN. Egress blocked!");
        } else {
            // Connect to Raqim cloud global routers.
            config
                .insert_json5("connect/endpoints", r#"["tcp/router.raqim.cloud:7447"]"#)
                .unwrap();
        }

        let session = zenoh::open(config).await.expect("Failed to start zenoh");
        let workspace_prefix = format!("raqim/{}/{}", tenant_id, swarm_name);

        // Bounded Egress funnel
        let (egress_tx, mut egress_rx) = mpsc::channel::<Vec<u8>>(100_000);

        // Spawn the dedicated single-thread publisher task
        let session_clone = session.clone();
        let topic_clone = format!("{}/thoughts/{}", workspace_prefix.clone(), os_node_id);

        tokio::spawn(async move {
            println!(
                "[NETWORK CORE] Zenoh Egress Funnel active on topic: {} ",
                &topic_clone
            );
            while let Some(bytes) = egress_rx.recv().await {
                if let Err(e) = session_clone.put(&topic_clone, bytes).await {
                    eprintln!("[NETWORK WARN] Zenoh Egress Dropped a packet: {}", e);
                }
            }
        });

        Self {
            session: Arc::new(session),
            workspace_prefix,
            aegis,
            os_node_id,
            egress_tx,
        }
    }

    /// Takes a locally verfied Oplog and broadcasts it to the global swarm
    pub async fn broadcast_to_world(&self, log: &OpLog) {
        let bytes = to_bytes::<rkyv::rancor::Error>(log)
            .expect("Zero-copy serialization failed")
            .into_vec();

        // Applies healthy async backprpessure if WAN is slow, without spawning tokio task.
        let _ = self.egress_tx.send(bytes).await;
    }

    /// Listens for foreign thoughts from the global network using a wildcard, dropping echoes from outselves
    pub async fn listen_for_foreign_thoughts(
        &self,
        brain_registry: Arc<SwarmStateRegistry>,
        axon: Arc<AxonGateKeeper>,
        tx: Sender<SystemEvent>,
    ) {
        // We subscribe to a wildcard to catch thoughts from ALL other nodes on the planet
        let key_expr = format!("{}/thoughts/*", self.workspace_prefix);
        let session_clone = self.session.clone();
        let my_node_id = self.os_node_id.clone();

        println!(
            " [NETWORK CORE] Listening for global swarm synchronization on: {} ...",
            key_expr
        );
        tokio::spawn(async move {
            let subscriber = session_clone.declare_subscriber(key_expr).await.unwrap();

            while let Ok(sample) = subscriber.recv_async().await {
                // Extract the sender node id from the topic path
                let topic_str = sample.key_expr().as_str();
                let sender_node_id = topic_str.split("/").last().unwrap_or("");

                // The Echo filter: If this packet came from our own code, drop it instantly.
                if sender_node_id == my_node_id {
                    continue;
                }

                let payload_bytes = sample.payload().to_bytes();

                // 2. We cast pointer directly over ZENOH network buffer!
                let archived_log =
                    match rkyv::access::<<OpLog as rkyv::Archive>::Archived, rkyv::rancor::Error>(
                        &payload_bytes,
                    ) {
                        Ok(valid_archive) => valid_archive,
                        Err(e) => {
                            eprintln!(
                                "[AEGIS] Packet Dropped. Malformed memory layout (OpLog): {}",
                                e
                            );
                            continue;
                        }
                    };

                // Cryptographic verification on Raw pounter
                if axon.verify_foreign_thoughts(archived_log) {
                    let target_namespace = archived_log.state.namespace.as_str();

                    // Retreive or spin up highly isolated, independent, Loro document shard.
                    let target_brain = brain_registry.get_or_create_brain(target_namespace);

                    if let Err(e) =
                        target_brain.assimilate_foreign_thought(archived_log.delta.as_slice())
                    {
                        eprintln!(
                            "[CRDT SHARD ERROR]: Shard '{}' assimilation failed: {} ",
                            target_namespace, e
                        );
                    }
                } else {
                    eprintln!("SECURITY BREACH: Forged thought detected on network. Dropping.");
                    let _ = tx.send(SystemEvent::SecurityBreach {
                        agent_id: hex::encode(&archived_log.agent_id.as_slice()),
                        reason: "Forged thought detected on global network - Markle Hash Mismatch "
                            .to_string(),
                        culprit_text: archived_log.state.text.as_str().to_string(),
                    });
                }
            }
        });
    }

    /// Binds an agent to a Semantic capability. It will listen for incoming A2A questions.
    pub async fn register_agent_capability(
        &self,
        capability_path: &str,
        mut response_handler: impl FnMut(&[u8]) -> Vec<u8> + Send + 'static,
    ) {
        let key_expr = format!("{}/a2a/{}", self.workspace_prefix, capability_path);
        let session = self.session.clone();
        let aegis = self.aegis.clone();
        tokio::spawn(async move {
            // A Queryable tells the global network: "I can answer questions for this topic"
            let queryable = session.declare_queryable(&key_expr).await.unwrap();

            println!("[A2A] Capability Registered: Listening on {} ", key_expr);

            while let Ok(query) = queryable.recv_async().await {
                let payload_bytes = match query.payload() {
                    Some(p) => p.to_bytes().to_vec(),
                    None => continue,
                };

                let archievd_envelope = unsafe {
                    rkyv::access_unchecked::<<A2AEnvelope as Archive>::Archived>(&payload_bytes)
                };

                // Extract the raw question bytes
                let question_payload = archievd_envelope.payload.as_slice();

                let mut packet_signature = [0u8; 64];
                packet_signature.copy_from_slice(archievd_envelope.signature.as_slice());

                let mut agent_public_key = [0u8; 32];
                agent_public_key.copy_from_slice(archievd_envelope.sender_public_key.as_slice());

                // UNIFIED PERIMETER AUDIT: Validates lineage token, proved the signature authenticity and checks path
                match aegis.verify_and_authorize_ingress(
                    archievd_envelope.sender_capability_cert.as_slice(),
                    &agent_public_key,
                    question_payload,
                    &packet_signature,
                    &archievd_envelope.target_capability.as_str(),
                ) {
                    Ok(_) => {
                        // Execution approved. Invoke the inner WASM guest application runtime logic.
                        let answer_bytes = response_handler(question_payload);

                        // Deliver the result frame back down the query link
                        if let Err(e) = query.reply(query.key_expr(), answer_bytes).await {
                            eprintln!(
                                "[A2A Network Warning] Failed to deliver RPC answer frame: {}",
                                e
                            );
                        }
                    }

                    Err(interdiction_reason) => {
                        eprintln!(
                            "[AEGIS NETWORK INTERDICTION] Dropped Malicious A2A RPC query line. Reason: {}",
                            interdiction_reason
                        );

                        continue;
                    }
                }

                // Executes the agent's internal logic  to generate answer
                let answer_bytes = response_handler(question_payload);

                // Send the answer directly ack to the asking agent
                query.reply(query.key_expr(), answer_bytes).await.unwrap();
            }
        });
    }

    /// Asks a a question to the swarm. Returns the answer
    pub async fn execute_a2a_rpc(
        &self,
        envelope: A2AEnvelope,
        aegis: Arc<AegisGateKeeper>,
        telemetry: Arc<TelemetryEngine>,
    ) -> Result<(Vec<u8>, String), anyhow::Error> {
        let sender_hex = hex::encode(envelope.sender_id.clone());

        // 1. AEGIS INTERCEPTION: Does this agent have clearance this question?
        let mut packet_sig = [0u8; 64];
        packet_sig.copy_from_slice(envelope.signature.as_slice());

        let sender_pub_bytes: [u8; 32] = [0; 32];

        if let Err(e) = aegis.verify_and_authorize_ingress(
            envelope.sender_capability_cert.as_slice(),
            &sender_pub_bytes,
            &envelope.payload,
            &packet_sig,
            &envelope.target_capability,
        ) {
            return Err(anyhow::anyhow!(
                "[AEGIS INTERDICTION]: A2A Transmission Violation: {} ",
                e
            ));
        }

        // 2. Zero-Copy Serializarion of envelope
        let bytes = rkyv::to_bytes::<rkyv::rancor::Error>(&envelope)
            .unwrap()
            .into_vec();
        let key_expr = format!(
            "{}/a2a/{}",
            self.workspace_prefix, envelope.target_capability
        );

        // Billing: Record the outbound request size
        telemetry.record_a2a_bytes(bytes.len() as u64);

        // 3. Zenoh GET request (The RPC )
        // We broadcast the question and wait for the authoritative answer to reply.
        let replies = self.session.get(&key_expr).payload(bytes).await.unwrap();

        let reply_future = replies.recv_async();

        // 4. Await the response from the target agent
        if let Ok(Ok(reply)) = timeout(Duration::from_secs(15), reply_future).await {
            if let Ok(sample) = reply.result() {
                // Return the answer bytes back to the caller
                let res_bytes = sample.payload().to_bytes().to_vec();
                telemetry.record_a2a_bytes(res_bytes.len() as u64);

                // Attempt to parse the pythons SDK's envelope to extract the true responder and answer
                if let Ok(json_val) = serde_json::from_slice::<serde_json::Value>(&res_bytes) {
                    let actual_responder = json_val["responder_hex"]
                        .as_str()
                        .unwrap_or(&sender_hex)
                        .to_string();

                    // Reselialize the answer bytes to send back to the original caller
                    let clean_answer = json_val["answer"]
                        .as_str()
                        .unwrap_or("")
                        .as_bytes()
                        .to_vec();

                    return Ok((clean_answer, actual_responder));
                }

                // Fallback if the payload was shitly formatted
                return Ok((res_bytes, sender_hex.clone()));
            }
        }

        Err(anyhow::anyhow!(
            "A2A Timeout: No agent responded to capability {}",
            envelope.target_capability
        ))
    }

    /// Dispatches a highly privileged system command directly to an agent's Python SDK
    pub async fn dispatch_control_override(&self, target_agent_hex: &str, system_prompt: &str) {
        let control_topic = format!("{}control/{}", self.workspace_prefix, target_agent_hex);

        // We use json here because the python sdk cintrol listeners needs to parse it easily
        let payload = serde_json::json!({
            "command": "FORCE_CONTEXT_EVICTION",
            "new_system_prompt": system_prompt,
            "timestamp": SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs()
        });

        // Fire the command across the Zenoh mesh
        if let Err(e) = self.session.put(&control_topic, payload.to_string()).await {
            eprintln!(
                "[ZENOH FATAL] Failed to dispath control overide to: {}: {}",
                target_agent_hex.to_string(),
                e
            )
        }
    }

    /// Broadcast session termination to the peer
    pub async fn shutdown(&self) {
        println!("[ZENOH] Broadcasting session termination to the global mesh...");
        // Close the session. This sends a 'Decl' (Declaration) to peer routers.
        let _ = self.session.close().await;
        println!("[ZENOH] Swarm servered cleanly. ");
    }
}
