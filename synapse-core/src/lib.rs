pub mod cortex;
pub mod state;
pub mod nucleus;
pub mod axon;
pub mod network;

use rkyv::{Archive, Deserialize, Portable, Serialize};

// The fundamental unit of our Flight Recorder.
#[derive(Archive, Deserialize, Serialize, Debug, PartialEq, Clone)]
pub struct AgentState {
    pub transaction_id: u64,
    pub timestamp: i64,
    pub status: AgentStatus, 

    // We will map this to Loro's CRDTs later to track var
    pub memory_offset: u32  
}

// The current execution state of the agent in the swarm.
#[derive(Archive, Deserialize, Serialize, Debug, PartialEq, Clone)]
pub enum AgentStatus {
    Idle, 
    Reasoning, // Waiting on LLM token generation
    ToolExecution, // Executing an external API or tool
    Halted,     // Interdicted by the Aegis security layer   
}

// Every thought and action is an Op.
#[derive(Archive, Deserialize, Serialize, Debug, PartialEq, Clone)]
pub struct OpLog {

    pub agent_id: [u8; 16],
    pub state: AgentState,

    pub delta:  Vec<u8>, 
    // The DAG Links: 32-bytes Blake3 hashes
    pub previous_hash: [u8; 32],
    pub current_hash: [u8; 32],
}

