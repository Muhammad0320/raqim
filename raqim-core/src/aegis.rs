use crate::SystemEvent;
use crate::api::UiEvent;
use dashmap::DashMap;
use ed25519_dalek::{Signature, Verifier, VerifyingKey};
use notify::{EventKind, RecursiveMode, Watcher};
use rkyv::Archive;
use serde::{Deserialize, Serialize};
use std::eprintln;
use std::sync::mpsc::channel;
use std::time::{SystemTime, UNIX_EPOCH};
use std::{
    collections::HashMap,
    sync::{Arc, RwLock},
};
use tokio::sync::broadcast::Sender;

/// The Internal Token packed inside every agent's SDK bundle
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CapabilityCertificate {
    pub agent_hex: String,
    pub group_name: String,
    pub expiration_timestamp: u64,
    pub master_signature: Vec<u8>, // Signed by Swarm Master Key
}

#[derive(Deserialize, Debug, Clone)]
pub struct AegisGroupPolicy {
    pub allowed_namespaces: Vec<String>,
    pub blocked_namespaces: Vec<String>,
}

#[derive(Deserialize, Debug)]
pub struct AegisGroupManifest {
    pub groups: HashMap<String, AegisGroupPolicy>,
}

#[derive(Clone, Debug, Serialize, Deserialize, rkyv::Archive, rkyv::Serialize)]
pub struct QuarantineRecord {
    pub agent_hex: String,
    pub violation_type: String,
    pub attemped_path: String,
    pub payload_preview: String,
    pub timestamp: u64,
}

pub struct AegisGateKeeper {
    pub group_policies: RwLock<HashMap<String, AegisGroupPolicy>>,
    pub quarantine_blocklist: DashMap<String, QuarantineRecord>,
    master_public_key: VerifyingKey,
    tx: Sender<SystemEvent>,
    ui_tx: Sender<UiEvent>,
}

impl AegisGateKeeper {
    pub fn new(
        aegis_path: &str,
        master_pub_hex: &str,
        tx: Sender<SystemEvent>,
        ui_tx: Sender<UiEvent>,
    ) -> Arc<Self> {
        let group_config = Self::parse_group_toml(aegis_path);

        let pub_bytes = hex::decode(master_pub_hex).expect("Invalid Master Public Key Hex");
        let master_public_key = VerifyingKey::from_bytes(&pub_bytes.try_into().unwrap())
            .expect("FATAL: Failed to parse master public key");

        let gatekeeper = Arc::new(AegisGateKeeper {
            group_policies: RwLock::new(group_config),
            quarantine_blocklist: DashMap::new(),
            master_public_key,
            tx,
            ui_tx,
        });

        // Spawn a dedicated bg thread for the C-level fs watcher
        let path_string = aegis_path.to_string();
        let gk_clone = gatekeeper.clone();

        // 3. The Async Tokio task that actually swaps the memory.
        std::thread::spawn(move || {
            let (tx, rx) = channel();
            let mut watcher =
                notify::recommended_watcher(tx).expect("Failed to bind os file to watcher");
            watcher
                .watch(
                    std::path::Path::new(&path_string),
                    RecursiveMode::NonRecursive,
                )
                .unwrap();

            // This thread blocks efficiently until the OS sends a file modifiication event.
            for res in rx {
                match res {
                    Ok(event) => {
                        // We only care if the file content were actually modified
                        if let EventKind::Modify(_) = event.kind {
                            println!("[AEGIS] Modification detected. Hot reloadidng ACL...");

                            // Parse the updated file
                            let new_policies = Self::parse_group_toml(&path_string);

                            //  FAIL-SAFE: Only apply if the new file actually parsed correctly
                            if !new_policies.is_empty() {
                                // Obtain write lock, swap the mappig, instantly release the lock
                                let mut write_lock = gk_clone.group_policies.write().unwrap();
                                *write_lock = new_policies;
                                println!("[AEGIS] ACL Hot-Reloaded Successfully.")
                            }
                        }
                    }

                    Err(e) => eprintln!("[AEGIS] Watcher Error: {:?}", e),
                }
            }
        });

        gatekeeper
    }

    fn parse_group_toml(path: &str) -> HashMap<String, AegisGroupPolicy> {
        match std::fs::read_to_string(path) {
            Ok(content) => match toml::from_str::<AegisGroupManifest>(&content) {
                Ok(manifest) => manifest.groups,
                Err(e) => {
                    eprintln!(
                        "[AEGIS FATAL] Group Configuration parsing error: {}. Defaulting to lockdown. ",
                        e
                    );
                    HashMap::new()
                }
            },

            Err(_) => {
                eprintln!("[AEGIS WARNING] Group policy definition not found. Access denied.");

                HashMap::new()
            }
        }
    }

    #[inline(always)]
    pub fn is_quarantined(&self, agent_hex: &str) -> bool {
        self.quarantine_blocklist.contains_key(agent_hex)
    }

    /// Locks down the agent globally across the OS
    pub fn trigger_quarantine(&self, agent_hex: &str, target: &str, v_type: &str, reason: &str) {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        let record = QuarantineRecord {
            agent_hex: agent_hex.to_string(),
            violation_type: v_type.to_string(),
            attemped_path: target.to_string(),
            payload_preview: reason.to_string(),
            timestamp,
        };

        // Lock the agent down at network layer instantly.
        self.quarantine_blocklist
            .insert(agent_hex.to_string(), record.clone());

        // Shout into the event bus
        let _ = self.tx.send(SystemEvent::GlobalQuarantineSync {
            record: record.clone(),
        });

        // Fire the durable WAL log
        let _ = self.tx.send(SystemEvent::AegisInterdiction {
            agent_id: agent_hex.to_string(),
            attempted_path: target.to_string(),
            rule_broken: v_type.to_string(),
            payload: reason.to_string(),
        });

        // Fire the SSE alert directly to the React Terminal
        let _ = self.ui_tx.send(UiEvent::AegisAlert {
            record: record.clone(),
        });

        let _ = eprintln!(
            "\n[AEGIS RED ALERT] Unauthorized access attempts by {} on path: {}, Violation Type: {}, Reason: {} ",
            agent_hex, target, v_type, reason
        );
    }

    /// Remote Ingestion: Triggered when a foreign node broadcasts a quarantine over Zenoh
    pub fn assimilate_remote_quarantine(&self, record: QuarantineRecord) {
        // prevent redundant processing if already blocklisted
        if self.quarantine_blocklist.contains_key(&record.agent_hex) {
            return;
        }

        //  Mutate local firewall blocklist instantly.
        self.quarantine_blocklist
            .insert(record.agent_hex.clone(), record.clone());

        // Trigger local security breach alerts
        let _ = self.tx.send(SystemEvent::SecurityBreach {
            agent_id: record.agent_hex.clone(),
            reason: format!(
                "Global Network Quarantine: {}",
                record.violation_type.clone()
            ),
            culprit_text: record.payload_preview.clone(),
        });

        let _ = self.ui_tx.send(UiEvent::AegisAlert {
            record: record.clone(),
        });

        eprintln!(
            "[AEGIS MESH INTERDICTION] Remote quarantine assimilated from network for agent {}. Reason: {} ",
            record.agent_hex, record.violation_type
        );
    }

    /// Validates the cryptographic token structure and executes signature audit at the gateway.
    // The ultra-fast packet audit (Called once per packet)
    pub fn authorize_packet_fast(
        &self,
        agent_hex: &str,
        group_name: &str,
        agent_pub_bytes: &[u8; 32],
        payload: &[u8],
        packet_sig_bytes: &[u8; 64],
        intent_path: &str,
        packet_timestamp: i64,
    ) -> Result<(), anyhow::Error> {
        // Freshness Window Check
        let current_ts = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;

        if (current_ts - packet_timestamp).abs() > 30 {
            self.trigger_quarantine(
                agent_hex,
                intent_path,
                "REPLAY_ATTACK",
                "Packet timestamp expired (drift > 30s)",
            );

            return Err(anyhow::anyhow!(
                "Security Violation: State packet rejected (Anti-replay)"
            ));
        };

        //  AUTHENTICITY VERIFICATION: Verify payload integrity against individual Agent Key.
        let agent_verifying_key = VerifyingKey::from_bytes(agent_pub_bytes)?;
        let packet_sig = Signature::from_bytes(packet_sig_bytes);
        if agent_verifying_key.verify(payload, &packet_sig).is_err() {
            self.trigger_quarantine(
                agent_hex,
                &intent_path,
                "CRYPTO_SPOOF",
                "Invalid Agent Frame Signature",
            );
            return Err(anyhow::anyhow!(
                "Integrity Audit Failure: Mismatched Agent Handshake "
            ));
        }

        // 6. POLICY ENFORCEMENT: Evaluate namespace against LIVE policy rule
        let policies_guard = self.group_policies.read().unwrap();
        let live_policy = policies_guard.get(group_name).ok_or_else(|| {
            anyhow::anyhow!(
                "Group Policy mapping '{}' not defined inside active aegis.toml ",
                group_name
            )
        })?;

        for blocked in &live_policy.blocked_namespaces {
            let match_found = if blocked.ends_with("*") {
                intent_path.starts_with(&blocked[..blocked.len() + 1])
            } else {
                intent_path == blocked
            };

            if match_found {
                self.trigger_quarantine(
                    agent_hex,
                    intent_path,
                    "NAMESPACE_BREACH",
                    "Atempted interaction inside expicitely blocked domain",
                );
                return Err(anyhow::anyhow!(
                    "Access Denied: Namespace explicitely blocked"
                ));
            }
        }

        for allowed in &live_policy.allowed_namespaces {
            let match_found = if allowed.ends_with("*") {
                intent_path.starts_with(&allowed[..allowed.len() - 1])
            } else {
                allowed == intent_path
            };

            if match_found {
                return Ok(());
            }
        }

        // Default Deny Fallback
        self.trigger_quarantine(
            agent_hex,
            intent_path,
            "NAMESPACE_BREACH",
            "No explicit allowance match withing token permissions",
        );
        Err(anyhow::anyhow!(
            "Access Denied: Default Deny Policy Tripped"
        ))
    }

    /// The heavy handshake: Validates Master Certificate AND binds it to the packet's public key
    pub fn verify_session_lineage(
        &self,
        cert_bytes: &[u8],
        agent_pub_bytes: &[u8; 32],
    ) -> Result<(String, String), anyhow::Error> {
        // Unpack the certificate token
        let cert: CapabilityCertificate = postcard::from_bytes(cert_bytes)
            .map_err(|_| anyhow::anyhow!("Malformed Cryptographic Certificate Token"))?;

        // Cryptographic binding: derive blake3 agent_hex directly from the incoming packet's pub key
        let mut hasher = blake3::Hasher::new_derive_key("raqim.agent.v1.identity");
        hasher.update(agent_pub_bytes);
        let mut derived_bytes = [0u8; 16];
        hasher.finalize_xof().fill(&mut derived_bytes);
        let derived_agent_hex = hex::encode(derived_bytes);

        // Assert that the Certificate ID matches the key that actually signed the packet
        if cert.agent_hex != derived_agent_hex {
            self.trigger_quarantine(
                &derived_agent_hex,
                "Handshake",
                "CONFUSED_DEPUTY_SPOOF",
                "Public key does not match CapabilityCertificate identity",
            );

            return Err(anyhow::anyhow!(
                "Security Violation: Certificate identity mismatch with signing key "
            ));
        }

        // 2. Short-circuit check if the agent is actively quarantined
        if self.quarantine_blocklist.contains_key(&cert.agent_hex) {
            return Err(anyhow::anyhow!(
                " Agent is expicitely locked down by firewall "
            ));
        }

        // 3. Audit Certifiicate Expiration
        let current_ts = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        if current_ts > cert.expiration_timestamp {
            return Err(anyhow::anyhow!(" Capability Certificate has expired "));
        }

        // 4. LINEAGE VERIFICATION: Prove token validity against the Master Swarm Key
        let mut cert_unsigned_payload = cert.clone();
        cert_unsigned_payload.master_signature = Vec::new();
        let serialized_raw = postcard::to_allocvec(&cert_unsigned_payload)?;

        let master_sig_array: &[u8; 64] = cert
            .master_signature
            .as_slice()
            .try_into()
            .map_err(|_| anyhow::anyhow!("Invalid Master Signature block lengnth"))?;

        let master_sig = Signature::from_bytes(master_sig_array);
        if self
            .master_public_key
            .verify(&serialized_raw, &master_sig)
            .is_err()
        {
            self.trigger_quarantine(
                &cert.agent_hex,
                "Handshake",
                "CRYPTO_SPOOF",
                "Forged Swarm Lineage Token",
            );
            return Err(anyhow::anyhow!(
                "Lineage Audit Failure: Forged Master Signature"
            ));
        }

        Ok((cert.agent_hex, cert.group_name))
    }
}
