pub mod cortex;
pub mod state;

use rkyv::{Archive, Deserialize, Serialize};
use tokio::sync::{mpsc, oneshot};
use tokio::fs::OpenOptions;
use tokio::io::AsyncWriteExt;

use rkyv::to_bytes;

// The fundamental unit of our Flight Recorder.
#[derive(Archive, Deserialize, Serialize, Debug, PartialEq)]
pub struct AgentState {
    pub transaction_id: u64,
    pub timestamp: i64,
    pub status: AgentStatus, 

    // We will map this to Loro's CRDTs later to track var
    pub memory_offset: u32  
}

// The current execution state of the agent in the swarm.
#[derive(Archive, Deserialize, Serialize, Debug, PartialEq)]
pub enum AgentStatus {
    Idle, 
    Reasoning, // Waiting on LLM token generation
    ToolExecution, // Executing an external API or tool
    Halted,     // Interdicted by the Aegis security layer   
}

// Every thought and action is an Op.
#[derive(Archive, Deserialize, Serialize, Debug, PartialEq)]
pub struct OpLog {

    pub agent_id: [u8; 16],
    pub state: AgentState,

    // This payload will hold the actual memory delta (the thought or action)
    pub payload_size:  u32, 

}
