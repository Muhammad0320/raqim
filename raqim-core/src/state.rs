use crate::{AgentState, AgentStatus};
use dashmap::DashMap;
use loro::{ImportStatus, LoroDoc, LoroList, LoroMap};
use parking_lot::RwLock;
use std::{borrow::Cow, sync::Arc};

// An Isolated Swarm Domain Document protected by an independent, low-overhead read/write lock which is namespace scoped
pub struct SwarmState {
    // This lock ONLY protects this specific namespace
    doc: RwLock<LoroDoc>,
    root_timeline_map: LoroMap,
}

impl SwarmState {
    /// Initialize the CRDT brain for a specific swarm domain.
    pub fn new(swarm_namespace: &str) -> Self {
        let doc = LoroDoc::new();

        // LoroDocs acts likes a filesystem. We create a root dir (Map) for our swarm.
        // Every swarm namespace recieves an isolated, independent root memory dictionary.
        let root_timeline_map = doc.get_map(swarm_namespace);

        // --- THE CRDT EVENT LISTENER ---
        // We attach a deep listener to the Loro Doc. Whenever the math resolves a conflict, this closure fires syncronously
        let subscriber = doc.subscribe_root(Arc::new(move |event: loro::event::DiffEvent| {
            // event.events contains the precise diffs (what was added, deleted, updated)
            for diff in &event.events {
                println!(
                    "[CRDT BRAIN] Syncronized event state delta at path: {:?}",
                    diff.path
                );
            }
        }));

        Self {
            doc: RwLock::new(doc),
            root_timeline_map,
        }
    }

    /// Appends a new thought securely to an agent's timeline array without risk of deletion or amnesia
    pub fn append_agent_thought(
        &self,
        agent_id_hex: &str,
        state: &AgentState,
    ) -> Result<Vec<u8>, anyhow::Error> {
        // Acquire an exclusive write lock ONLY for this specific swarm document
        let dock_lock = self.doc.write();

        let previous_vv = dock_lock.oplog_vv();

        // Checks if a timeline array already exists for this agent_id token
        let agent_timeline = match self.root_timeline_map.get(agent_id_hex) {
            Some(loro::ValueOrContainer::Container(container)) => container.into_list().unwrap(),

            _ => {
                // If this is the agent's first block, initialize a clean timeline list container
                self.root_timeline_map
                    .insert_container(agent_id_hex, LoroList::new())
                    .map_err(|_| {
                        anyhow::anyhow!(
                            "CRDT Allocation Error: Filed to generate agent timeine leaf "
                        )
                    })?
            }
        };

        // Construst a fresh, isolated state record snapshot map
        let record_entry = LoroMap::new();

        // Populate the historical frame leaf fields safely
        let _ = record_entry.insert("tx_id", state.transaction_id as i64);
        let _ = record_entry.insert("ts", state.timestamp);
        let _ = record_entry.insert("payload", state.text.clone());

        let status_str = match state.status {
            AgentStatus::Idle => "IDLE",
            AgentStatus::Reasoning => "REASONING",
            AgentStatus::Halted => "HALTED",
            AgentStatus::ToolExecution => "TOOL_EXEC",
        };
        let _ = record_entry.insert("status", status_str);

        // Push the completed leaf node to the end of the agent's historical timeline array
        agent_timeline.insert_container(agent_timeline.len(), record_entry)?;

        // Force an absolute commit block
        dock_lock.commit();

        // Export only the fresh structure mutatitons generated during gthis specific Operation
        let delta_bytes = dock_lock.export(loro::ExportMode::Updates {
            from: Cow::Borrowed(&previous_vv),
        })?;

        Ok(delta_bytes)
    }

    /// Merges another agent's thought (action) into this agent's brain. Conflict resolution happens here automatically.
    pub fn assimilate_foreign_thought(
        &self,
        delta: &[u8],
    ) -> Result<ImportStatus, loro::LoroError> {
        // parses the binary data and merges it into out local graph.
        self.doc.read().import(delta)
    }
}

// The Global Enterprise Registry.
pub struct SwarmStateRegistry {
    // Threads looking up different namespaces will hit different bucket with zero locking interference.
    shards: DashMap<String, Arc<SwarmState>>,
}

impl SwarmStateRegistry {
    pub fn new() -> Self {
        Self {
            shards: DashMap::new(),
        }
    }

    pub fn get_or_create_brain(&self, namespace: &str) -> Arc<SwarmState> {
        if let Some(state) = self.shards.get(namespace) {
            return state.value().clone();
        }

        self.shards
            .entry(namespace.to_string())
            .or_insert_with(|| Arc::new(SwarmState::new(namespace)))
            .clone()
    }
}
