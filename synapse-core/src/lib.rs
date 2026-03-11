pub mod axon;
pub mod compactor;
pub mod cortex;
pub mod lancedb_store;
pub mod network;
pub mod nucleus;
pub mod sandbox;
pub mod state;

use std::sync::{Arc, mpsc};

use rkyv::{Archive, Deserialize, Serialize};

use crate::{
    axon::AxonGateKeeper, network::GlobalNetworkBridge, nucleus::WalEngine, state::SwarmState,
};

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

pub async fn execute_synapse_cascade(
    incoming_state: AgentState,
    brain: Arc<SwarmState>,
    axon: Arc<AxonGateKeeper>,
    wal: Arc<WalEngine>,
    cortex_tx: mpsc::Sender<Vec<u8>>,
    global_net: Arc<GlobalNetworkBridge>,
) {
    let agent_hex = hex::encode(incoming_state.agent_id.unwrap_or([0; 16]));

    brain.update_agent_state(&agent_hex, &incoming_state);
    let delta = brain.export_delta();

    // Contruct the raw log
    let raw_log = OpLog {
        agent_id: incoming_state.agent_id.unwrap_or([0; 16]),
        state: incoming_state,
        delta,
        previous_hash: [0; 32],
        current_hash: [0; 32],
    };

    // 3. Cryptographically Seal (Markle DAG)
    let sealed_log = axon.seal_thought(raw_log);

    // 4. Fire to wal (Durability)
    wal.append(sealed_log.clone());

    // 5. Fire to Local Cortex (Zero-Copy)
    let serialized_log = rkyv::to_bytes::<rkyv::rancor::Error>(&sealed_log).unwrap();
    let _ = cortex_tx.send(serialized_log.into_vec());

    // 6. Fire to global swarm
    global_net.broadcast_to_world(&sealed_log).await;
}
