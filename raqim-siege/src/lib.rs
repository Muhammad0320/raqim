use rkyv::{Archive, Deserialize, Serialize};

#[derive(Archive, Deserialize, Serialize, Debug, Clone)]
pub struct IngressEnvelope {
    pub intent_path: String,  // "raqim_finance/ledger" ( Checked by Aegis )
    pub public_key: [u8; 32], // The Ed25519 public key of the sender
    pub signature: [u8; 64],  // The mathematical signauture proving authenticity
    pub state_bytes: Vec<u8>, // The actual thought
}

#[derive(Archive, Deserialize, Serialize, Debug, PartialEq, Clone)]
pub struct AgentState {
    pub agent_id: Option<[u8; 16]>,
    pub transaction_id: u64,

    pub timestamp: i64,
    pub status: AgentStatus,

    pub text: String,
    pub namespace: String,
}

#[derive(Archive, Deserialize, Serialize, Debug, PartialEq, Clone)]
pub enum AgentStatus {
    Idle,
    Reasoning,     // Waiting on LLM token generation
    ToolExecution, // Executing an external API or tool
    Halted,        // Interdicted by the Aegis security layer
}
