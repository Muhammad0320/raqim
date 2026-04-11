use crate::SystemEvent;
use ed25519_dalek::{Signature, Verifier, VerifyingKey};
use notify::{EventKind, RecursiveMode, Watcher};
use serde::Deserialize;
use std::sync::mpsc::channel;
use std::{
    collections::{HashMap, HashSet},
    fs,
    sync::{Arc, RwLock},
};
use tokio::sync::broadcast::Sender;

#[derive(Deserialize, Debug, Clone)]
pub struct AegisPolicy {
    pub public_key_hex: String,
    pub allowed_namespaces: Vec<String>,
    pub blocked_namespaces: Vec<String>,
}

#[derive(Deserialize, Debug)]
pub struct AegisManifest {
    pub policies: HashMap<String, AegisPolicy>,
}

pub struct AegisGateKeeper {
    // AEGIS ENGINE: Maps an Agent's Hex ID to their specific security policy.
    policies: RwLock<HashMap<String, AegisPolicy>>,

    // QUARANTINE: Agents in this list are completely paralysed at the network level
    pub quarantine_blocklist: RwLock<HashSet<String>>,
    tx: Sender<SystemEvent>,
}

impl AegisGateKeeper {
    pub fn new(config_path: &str, tx: Sender<SystemEvent>) -> Arc<Self> {
        let initial_config = Self::parse_toml(&config_path);

        let gatekeeper = Arc::new(Self {
            policies: RwLock::new(initial_config),
            quarantine_blocklist: RwLock::new(HashSet::new()),
            tx,
        });

        // Spawn a dedicated bg thread for the C-level fs watcher
        let path_string = config_path.to_string();
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
                            let new_policies = Self::parse_toml(&path_string);

                            //  FAIL-SAFE: Only apply if the new file actually parsed correctly
                            if !new_policies.is_empty() {
                                // Obtain write lock, swap the mappig, instantly release the lock
                                let mut write_lock = gk_clone.policies.write().unwrap();
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

    /// Reads and deserialize the TOML file from the physical disk
    fn parse_toml(path: &str) -> HashMap<String, AegisPolicy> {
        match fs::read_to_string(&path) {
            Ok(content) => match toml::from_str::<AegisManifest>(&content) {
                Ok(manifest) => manifest.policies,
                Err(e) => {
                    eprintln!(
                        "[AEGIS FATAL] Failed to parse aegis.toml: {}. Defaulting to lockdown. ",
                        e
                    );
                    HashMap::new() // 
                }
            },
            Err(_) => {
                eprintln!("[AEGIS WARNING] aegis.toml not found system is open to attack.");
                HashMap::new()
            }
        }
    }

    /// The Semantic Interdiction Switch. Returns TRUE if allowed, FALSE if malicious.
    pub fn enforce_aegis_policy(&self, agent_hex: &str, intent_path: &str) -> bool {
        // Check quarantine first (0(1) instant rejection )
        if self
            .quarantine_blocklist
            .read()
            .unwrap()
            .contains(agent_hex)
        {
            eprintln!(
                "[AEGIS] PARALYSED AGENT {} ATTEMPTED ACTION. DROPPED. ",
                agent_hex
            );
            return false;
        }

        // 2. Evaluate Semantic Namespace policy.
        let policies = self.policies.read().unwrap();
        if let Some(policy) = policies.get(agent_hex) {
            // Check explicit Blocks (e.g., "rqm_finance/*")
            for blocked in &policy.blocked_namespaces {
                if intent_path.starts_with(blocked) {
                    self.trigger_quarantine(
                        agent_hex,
                        intent_path,
                        "AEGIS Blocked Namespace Violation",
                    );
                    return false;
                }
            }

            // Check explicit allows
            for allowed in &policy.allowed_namespaces {
                if intent_path.starts_with(allowed) {
                    return true;
                }
            }

            // Default Deny if not explicitly allowed
            self.trigger_quarantine(
                agent_hex,
                intent_path,
                "AEGIS Unauthorized Capability Access",
            );
            return false;
        }

        //  In strict mode, default is false. For dev it's true
        true
    }

    /// Locks down the agent globally across the OS
    pub fn trigger_quarantine(&self, agent_hex: &str, target: &str, reason: &str) {
        eprintln!(
            "\n[AEGIS RED ALERT] Unauthorized access attempts by {} on path: {} ",
            agent_hex, target
        );

        let _ = self.tx.send(SystemEvent::AegisInterdiction {
            agent_id: agent_hex.to_string(),
            attempted_path: target.to_string(),
            rule_broken: "".to_string(),
            payload: reason.to_string(),
        });

        self.quarantine_blocklist
            .write()
            .unwrap()
            .insert(agent_hex.to_string());
    }

    /// Evaluates if an agent is authorized to communicate with a specific service capability
    pub fn enforce_a2a_policy(&self, sender_hex: &str, target_capability: &str) -> bool {
        if self
            .quarantine_blocklist
            .read()
            .unwrap()
            .contains(sender_hex)
        {
            return false;
        }

        let policies = self.policies.read().unwrap();

        if let Some(policy) = policies.get(sender_hex) {
            // 1. Checks Explicit Blocks first
            for blocked in &policy.blocked_namespaces {
                if target_capability.starts_with(blocked) {
                    self.trigger_quarantine(
                        sender_hex,
                        target_capability,
                        "A2A Blocked Namespace Violation",
                    );
                    return false;
                }
            }

            // Checks if the agents allowed namespace covers the target capability
            for allowed in &policy.allowed_namespaces {
                if target_capability.starts_with(allowed) {
                    return true;
                }
            }
        }

        // Zero-Trust Default Deny
        self.trigger_quarantine(
            sender_hex,
            target_capability,
            "A2A Unauthorized Capability Access",
        );
        false
    }

    /// Unfreezes an agent.
    pub fn lift_quarantine(&self, agent_hex: &str) {
        let mut blocklist = self.quarantine_blocklist.write().unwrap();
        if blocklist.remove(agent_hex) {
            println!(
                "[AEGIS ADMIN] Quarantine lifted for agent {}. Ready for resurrection. ",
                agent_hex
            );
        }
    }

    /// Fetches the live qurantine list for the Admin Dashboard
    pub fn fetch_quaratined_agents(&self) -> Vec<String> {
        self.quarantine_blocklist
            .read()
            .unwrap()
            .iter()
            .map(|s| s.to_string())
            .collect()
    }

    /// True Cryptographici Verification
    pub fn verify_agent_signature(
        &self,
        agent_hex: &str,
        payload: &[u8],
        signature_bytes: &[u8; 64],
    ) -> bool {
        let policies = self.policies.read().unwrap();

        if let Some(policy) = policies.get(agent_hex) {
            // Decode the expected public_key from the TOML
            let pub_key_bytes = hex::decode(&policy.public_key_hex).unwrap_or_default();

            if let Ok(public_key) =
                VerifyingKey::from_bytes(pub_key_bytes.as_slice().try_into().unwrap_or(&[0; 32]))
            {
                if let signature =
                    Signature::from_bytes(signature_bytes.try_into().unwrap_or(&[0; 64]))
                {
                    // Mathematically prove that sender owns this privage key

                    if public_key.verify(payload, &signature).is_ok() {
                        return true;
                    }
                }
            }
        }

        // If the key is missing, invalid, or signature is spoofed quarantine them.
        self.trigger_quarantine(agent_hex, "Global", "Cryptographic Spoofing detected");
        false
    }
}
