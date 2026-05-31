use crate::SystemEvent;
use crate::api::UiEvent;
use dashmap::DashMap;
use datafusion::parquet::data_type::AsBytes;
use ed25519_dalek::{Signature, Verifier, VerifyingKey};
use serde::{Deserialize, Serialize};
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
    pub allowed_namespaces: Vec<String>,
    pub blocked_namespaces: Vec<String>,
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

#[derive(Serialize, Clone, Debug)]
pub struct QuarantineRecord {
    pub agent_hex: String,
    pub violation_type: String,
    pub attemped_path: String,
    pub payload_preview: String,
    pub timestamp: u64,
}

pub struct AegisGateKeeper {
    group_policies: RwLock<HashMap<String, AegisGroupPolicy>>,
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

        Arc::new(AegisGateKeeper {
            group_policies: RwLock::new(group_config),
            quarantine_blocklist: DashMap::new(),
            master_public_key,
            tx,
            ui_tx,
        })
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

        // Fire the durable WAL log
        let _ = self.tx.send(SystemEvent::AegisInterdiction {
            agent_id: agent_hex.to_string(),
            attempted_path: target.to_string(),
            rule_broken: v_type.to_string(),
            payload: reason.to_string(),
        });

        // Fire the SSE alert directly to the React Terminal
        let _ = self.ui_tx.send(UiEvent::AegisAlert { record });

        eprintln!(
            "\n[AEGIS RED ALERT] Unauthorized access attempts by {} on path: {}, Violation Type: {}, Reason: {} ",
            agent_hex, target, v_type, reason
        );
    }

    /// Validates the cryptographic token structure and executes signature audit at the gateway.
    pub fn verify_and_authorize_ingress(
        &self,
        cert_bytes: &[u8],
        agent_pub_bytes: &[u8; 32],
        payload: &[u8],
        packet_sig_bytes: &[u8; 64],
        intent_path: &str,
    ) -> Result<String, anyhow::Error> {
        // 1. Unpack the certificate token using postcard
        let cert: CapabilityCertificate = postcard::from_bytes(cert_bytes)
            .map_err(|_| anyhow::anyhow!("Malformed Cryptographic Certificate Token"))?;

        // 2. Short-circuit check if the agent is actively quarantined
        if self.quarantine_blocklist.contains_key(&cert.agent_hex) {
            return Err(anyhow::anyhow!(
                " Agent is expicitely locked down by firewall "
            ));
        }

        // 3. Audit token lifetime bounds.
        let current_ts = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        if current_ts > cert.expiration_timestamp {
            return Err(anyhow::anyhow!(" Capability Certificate has expired "));
        }

        // 4. LINEAGE VERIFICATION: Verify token validity agains the Master Swarm Key
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
                intent_path,
                "CRYPTO_SPOOF",
                "Forged Swarm Lineage Token",
            );
            return Err(anyhow::anyhow!(
                "Lineage Audit Failure: Forged Master Signature"
            ));
        }

        // 5. AUTHENTICITY VERIFICATION: Verify payload integrity against individual Agent Key.
        let agent_verifying_key = VerifyingKey::from_bytes(agent_pub_bytes)?;
        let packet_sig = Signature::from_bytes(packet_sig_bytes);
        if agent_verifying_key.verify(payload, &packet_sig).is_err() {
            self.trigger_quarantine(
                &cert.agent_hex,
                &intent_path,
                "CRYPTO_SPOOF",
                "Invalid Agent Frame Signature",
            );
            return Err(anyhow::anyhow!(
                "Integrity Audit Failure: Mismatched Agent Handshake "
            ));
        }

        // 6. POLICY ENFORCEMENT: Evaluate the dynamically accepted namespace claims
        for blocked in &cert.blocked_namespaces {
            let match_found = if blocked.ends_with("*") {
                intent_path.starts_with(&blocked[..blocked.len() + 1])
            } else {
                intent_path == blocked
            };

            if match_found {
                self.trigger_quarantine(
                    &cert.agent_hex,
                    intent_path,
                    "NAMESPACE_BREACH",
                    "Atempted interaction inside expicitely blocked domain",
                );
                return Err(anyhow::anyhow!(
                    "Access Denied: Namespace explicitely blocked"
                ));
            }
        }

        for allowed in &cert.allowed_namespaces {
            let match_found = if allowed.ends_with("*") {
                intent_path.starts_with(&allowed[..allowed.len() - 1])
            } else {
                allowed == intent_path
            };

            if match_found {
                return Ok(cert.agent_hex);
            }
        }

        // Default Deny Fallback
        self.trigger_quarantine(
            &cert.agent_hex,
            intent_path,
            "NAMESPACE_BREACH",
            "No explicit allowance match withing token permissions",
        );
        Err(anyhow::anyhow!(
            "Access Denied: Default Deny Policy Tripped"
        ))
    }
}
