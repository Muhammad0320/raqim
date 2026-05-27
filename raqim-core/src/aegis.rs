use crate::SystemEvent;
use crate::api::UiEvent;
use dashmap::DashMap;
use ed25519_dalek::{Signature, Verifier, VerifyingKey};
use jsonwebtoken::signature::digest::typenum::Gr;
use notify::{EventKind, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use std::sync::mpsc::channel;
use std::time::{SystemTime, UNIX_EPOCH};
use std::{
    collections::HashMap,
    fs,
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
    pub master_signature: [u8; 64], // Signed by Swarm Master Key
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

        // 4.
    }
}
