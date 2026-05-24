use crate::{AgentState, AgentStatus};
use loro::{LoroList, LoroMap};
use parking_lot::Mutex;
use std::{borrow::Cow, sync::Arc};

// ARC, becaue multiple (threads) agents will hold pointers to this document in memory
pub struct SwarmState {
    inner_doc: Arc<Mutex<LoroDoc>>,
    root_timeline: LoroMap,
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
            inner_doc: Arc::new(Mutex::new(doc)),
            root_timeline: root_timeline_map,
        }
    }

    /// Updates the state and returns a microscopic DELTA [u8] byte array
    pub fn update_agent_state(&self, agent_id_hex: &str, state: &AgentState) -> Vec<u8> {
        // 1. Capture the vector version of the CRDT *before* we changes.
        // A mathematical vector clock ( e.g Node A is at tick 5, Node B is at tick 2. )

        let previous_vv = self.doc.oplog_vv();

        // 2. Locate or create a specific mmap for this agent id. let
        let agent_memory = self
            .state_map
            .insert_container(agent_id_hex, LoroMap::new())
            .expect("Loro allocation error: Failed to create agent memory map");

        // Mutate the state. Loro tracks these changes in its internal OpLog.
        agent_memory
            .insert("transaction_id", state.transaction_id as i64)
            .unwrap();
        agent_memory.insert("timestamp", state.timestamp).unwrap();
        agent_memory.insert("text", state.text.clone()).unwrap();

        let status_str = match state.status {
            AgentStatus::Idle => "IDLE",
            AgentStatus::Reasoning => "REASONING",
            AgentStatus::Halted => "HALTED",
            AgentStatus::ToolExecution => "TOOL_EXEC",
        };
        agent_memory.insert("status", status_str).unwrap();

        // 4. Commit the txn to the local CRDT
        self.doc.commit();

        // 5. TRUE DELTA EXPORT: We tell loro to export ONLY the bytes that changed since the `previous_frontier`.
        // Ultimately creating a tiny [u8] payload
        self.doc
            .export(loro::ExportMode::Updates {
                from: Cow::Borrowed(&previous_vv),
            })
            .expect("Failed to export CRDT delta")
    }

    /// Appends a new thought securely to an agent's timeline array without risk of deletion or amnesia
    pub fn append_agent_thought(
        &self,
        agent_id_hex: &str,
        state: &AgentState,
    ) -> Result<Vec<u8>, anyhow::Error> {
        // Acquire an absolute exclusive lock over a document transaction scope.
        // This physically stop parallel threads from colliding on insert boundaries
        let dock_lock = self.inner_doc.lock();

        let previous_vv = dock_lock.oplog_vv();

        // Checks if a timeline array already exists for this agent_id token
        let agent_timeline = match self.root_timeline.get(agent_id_hex) {
            Some(loro::ValueOrContainer::Container(container)) => container.into_list().unwrap(),

            _ => {
                // If this is the agent's first block, initialize a clean timeline list container
                self.root_timeline
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
        self.doc.import(delta)
    }
}

/// The global manager that maps incoming thought packets to their respective Swarm Brain Shards
pub struct SwarmBrainRegistry {
    // Maps Swarm Namespace -> Dedicated SwarmBrain Shard
    shards: Mutex<HashMap<String, Arc<SwarmBrain>>>,
}

impl SwarmRegistry {
    pub fn new() -> Self {
        Self {
            shards: Mutex::new(HashMap::new()),
        }
    }

    pub fn get_or_create_bain(&self, namespace: &str) -> Arc<SwarmState> {
        let mut lock = self.shards.lock();
        lock.entry(namespace.to_string())
            .or_insert_with(|| Arc::new(SwarmState::new(namespace)))
            .clone()
    }
}
