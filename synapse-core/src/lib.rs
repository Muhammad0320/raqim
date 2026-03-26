pub mod aegis;
pub mod axon;
pub mod compactor;
pub mod config;
pub mod cortex;
pub mod lancedb_store;
pub mod memory_router;
pub mod network;
pub mod nucleus;
pub mod sandbox;
pub mod state;
pub mod utils;

use rkyv::{Archive, Deserialize, Serialize};
use serde::{Deserialize as SerdeDeserialize, Serialize as SerdeSerialize};
use std::sync::Arc;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::sync::broadcast::Sender;
use uuid::Uuid;

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

    pub text: String,
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

    // The deterministic flight recorder
    pub entropy_seeds: Vec<u64>,
    pub network_responses: Vec<String>,
}

pub async fn execute_synapse_cascade(
    archive_state: &rkyv::Archived<AgentState>, // True Zero Copy
    brain: Arc<SwarmState>,
    axon: Arc<AxonGateKeeper>,
    wal: Arc<WalEngine>,
    cortex_tx: tokio::sync::mpsc::UnboundedSender<Vec<u8>>,
    global_net: Arc<GlobalNetworkBridge>,
    global_tx_counter: Arc<AtomicU64>,
    tx: Sender<SystemEvent>,
    seeds: Vec<u64>,
    responses: Vec<String>,
) {
    // Security: Validate or generate agent_id
    let empty_id = [0u8; 16];

    // Safely extract from ArrchiveOption using .as_ref()
    let final_agent_id = match archive_state.agent_id.as_ref() {
        Some(id) if id.as_slice() != empty_id => id.as_slice().try_into().unwrap(),
        _ => Uuid::new_v4().into_bytes(),
    };

    let agent_hex = hex::encode(final_agent_id);

    let enriched_state = AgentState {
        agent_id: Some(final_agent_id),
        transaction_id: global_tx_counter.fetch_add(1, Ordering::SeqCst),

        timestamp: SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64,
        status: match archive_state.status {
            rkyv::Archived::<AgentStatus>::Idle => AgentStatus::Idle,
            rkyv::Archived::<AgentStatus>::Halted => AgentStatus::Halted,
            rkyv::Archived::<AgentStatus>::ToolExecution => AgentStatus::ToolExecution,
            rkyv::Archived::<AgentStatus>::Reasoning => AgentStatus::Reasoning,
        },
        text: archive_state.text.as_str().to_string(), // Extract text from pointer
    };

    //
    let delta = brain.update_agent_state(&agent_hex, &enriched_state);

    // Contruct the raw log
    let raw_log = OpLog {
        agent_id: final_agent_id,
        state: enriched_state.clone(),
        delta,
        previous_hash: [0; 32],
        current_hash: [0; 32],

        entropy_seeds: seeds,
        network_responses: responses,
    };

    // 3. Cryptographically Seal (Markle DAG)
    let sealed_log = axon.seal_thought(raw_log);

    // 4. Fire to wal (Durability)
    wal.append(sealed_log.clone()).await;

    // 5. Fire to Local Cortex (Zero-Copy IPC )
    let serialized_log = rkyv::to_bytes::<rkyv::rancor::Error>(&sealed_log).unwrap();
    let _ = cortex_tx.send(serialized_log.into_vec());

    // 6. Fire to global swarm
    global_net.broadcast_to_world(&sealed_log).await;

    let _ = tx.send(SystemEvent::ThoughtCommited {
        agent_id: agent_hex.clone(),
        tx_id: enriched_state.transaction_id,
    });
}

#[derive(Clone, Debug, Archive, Serialize, Deserialize, SerdeSerialize, SerdeDeserialize)]
pub enum SystemEvent {
    ThoughtCommited {
        agent_id: String,
        tx_id: u64,
    },
    SecurityBreach {
        agent_id: String,
        reason: String,
        culprit_text: String,
    },
    CompactionTriggered {
        archived_count: usize,
    },
    PluginLoaded {
        plugin_name: String,
    },

    AegisInterdiction {
        agent_id: String,
        attempted_path: String,
        rule_broken: String,
        payload: String,
    },

    SystemBoot {
        message: String,
    },
}
