use crate::{AgentState, AgentStatus};
use loro::{ImportStatus, LoroDoc, LoroMap, Subscription};
use std::{borrow::Cow, sync::Arc};

// ARC (Atomic Reference counting) becaue multiple (threads) agents will hold pointers to this document in memory
pub struct SwarmState {
    pub doc: Arc<LoroDoc>,
    state_map: LoroMap,
    _subscriber: Subscription,
}

impl SwarmState {
    /// Initialize the CRDT brain for a specific swarm domain.
    pub fn new(swarm_namespace: &str) -> Self {
        let doc = Arc::new(LoroDoc::new());

        // LoroDocs acts likes a filesystem. We create a root dir (Map) for our swarm.
        let state_map = doc.get_map(swarm_namespace);

        // --- THE CRDT EVENT LISTENER ---
        // We attach a deep listener to the Loro Doc. Whenever the math resolves a conflict, this closure fires syncronously
        let subscriber = doc.subscribe_root(Arc::new(move |event: loro::event::DiffEvent| {
            // event.events contains the precise diffs (what was added, deleted, updated)
            for diff in &event.events {
                let target_path = diff
                    .path
                    .iter()
                    .map(|p| format!("{:?}", p))
                    .collect::<Vec<String>>()
                    .join("/");

                println!(
                    "[CRDT RESOLUTION] Memory alignment complete at path: {} ",
                    target_path
                );
            }
        }));

        Self {
            doc,
            state_map,
            _subscriber: subscriber,
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

    /// Merges another agent's thought (action) into this agent's brain.
    /// Conflict resolution happens here automatically.
    pub fn assimilate_foreign_thought(
        &self,
        delta: &[u8],
    ) -> Result<ImportStatus, loro::LoroError> {
        // parses the binary data and merges it into out local graph.
        self.doc.import(delta)
    }
}
