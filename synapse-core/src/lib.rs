pub mod axon;
pub mod compactor;
pub mod cortex;
pub mod lancedb_store;
pub mod network;
pub mod nucleus;
pub mod sandbox;
pub mod state;

use rkyv::{Archive, Deserialize, Serialize};

// The fundamental unit of our Flight Recorder.
#[derive(Archive, Deserialize, Serialize, Debug, PartialEq, Clone)]
pub struct AgentState {
    pub agent_id: Option<[u8; 16]>,
    pub transaction_id: u64,

    pub timestamp: i64,
    pub status: AgentStatus,

    // We will map this to Loro's CRDTs later to track var
    pub memory_offset: u32,
}

// The current execution state of the agent in the swarm.
#[derive(Archive, Deserialize, Serialize, Debug, PartialEq, Clone)]
pub enum AgentStatus {
    Idle,
    Reasoning,     // Waiting on LLM token generation
    ToolExecution, // Executing an external API or tool
    Halted,        // Interdicted by the Aegis security layer
}

// Every thought and action is an Op.
#[derive(Archive, Deserialize, Serialize, Debug, PartialEq, Clone)]
pub struct OpLog {
    pub agent_id: [u8; 16],
    pub state: AgentState,

    pub delta: Vec<u8>,

    pub previous_hash: [u8; 32],
    pub current_hash: [u8; 32],
}
