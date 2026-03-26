use notify::{EventKind, RecursiveMode, Watcher};
use serde::Deserialize;
use std::{
    collections::{HashMap, HashSet},
    fs,
    sync::{Arc, RwLock},
};
use tokio::sync::mpsc;

#[derive(Deserialize, Debug, Clone)]
pub struct AegisPolicy {
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
}

impl AegisGateKeeper {
    pub fn new() -> Self {
        Self {
            policies: RwLock::new(HashMap::new()),
            quarantine_blocklist: RwLock::new(HashSet::new()),
        }
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
                    self.trigger_quarantine(agent_hex, intent_path);
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
            self.trigger_quarantine(agent_hex, intent_path);
            return false;
        }

        //  In strict mode, default is false. For dev it's true
        true
    }

    /// Locks down the agent globally across the OS
    fn trigger_quarantine(&self, agent_hex: &str, target: &str) {
        eprintln!(
            "\n[AEGIS RED ALERT] Unauthorized access attempts by {} on path: {} ",
            agent_hex, target
        );
        eprintln!("[AEGIS] INITIATING GLOBAL AGENT QUARANTINE... ");

        self.quarantine_blocklist
            .write()
            .unwrap()
            .insert(agent_hex.to_string());
    }
}
