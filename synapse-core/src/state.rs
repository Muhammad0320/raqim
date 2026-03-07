use loro::{ExportMode, LoroDoc, LoroMap};
use std::sync::Arc; 
use crate::{AgentState, AgentStatus};


// ARC (Atomic Reference counting) becaue multiple (threads) agents will hold pointers to this document in memory
pub  struct SwarmState {
    pub doc: Arc<LoroDoc>,
    state_map: LoroMap
}

impl SwarmState {

    /// Initialize the CRDT brain for a specific swarm domain.
    pub fn new(swarm_namespace: &str) -> Self {
        
        let doc = Arc::new(LoroDoc::new());
        
        // creates a root dir in the CRDT for this specific swarm 
        let state_map = doc.get_map(swarm_namespace);

        Self { doc, state_map }

    }

    /// Agent updates a specific key in the shared state
    pub fn update_agent_state(&self, agent_id_hex: &str, state: &AgentState ) {

        //  Create or get the specific mmap
        let agent_memory = self.state_map.insert_container(agent_id_hex, LoroMap::new()).expect("Failed to create agent memory map");
        
        // Maps the rust struct fields directly into CDRT
        agent_memory.insert("transaction_id",  state.transaction_id as i64).unwrap();
        agent_memory.insert("timestamp", state.timestamp).unwrap();

        let status_str = match state.status {

            AgentStatus::Idle => "IDLE",
            AgentStatus::Reasoning => "REASONING",
            AgentStatus::Halted => "HALTED",
            AgentStatus::ToolExecution => "TOOL_EXEC",

        };

        agent_memory.insert("status", status_str).unwrap();

        // commit the transaction. This generates a "Version Vector"; 
        self.doc.commit();

    }

    /// Extract the delta since the last sync. To be used as the Oplog Payload in iceoryx2
    pub fn export_delta(&self) -> Vec<u8> {
        self.doc.export(ExportMode::Snapshot).unwrap()
    }

    /// Merges another agent's thought (action) into this agent's brain.
    /// Conflict resolution happens here automatically.
    pub fn assimilate_foreign_thought(&self, delta: &[u8]) {
        self.doc.import(delta).expect("CRDT merge failed");
    }

}