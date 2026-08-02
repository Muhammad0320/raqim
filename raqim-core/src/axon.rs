use crate::OpLog;
use blake3::Hasher;
use dashmap::DashMap;
use parking_lot::RwLock;
use rkyv::Archived;
use serde::{Deserialize, Serialize};

/// A completed cryptographic audit checkpoint batch ready for ledger immutability
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarkleBatch {
    pub batch_id: u64,
    pub namespace: String,
    pub markle_root: [u8; 32],
    pub parent_batch_root: [u8; 32],
    pub leaves: Vec<[u8; 32]>,
}

/// A verifiable inclusion path mapping a specific transaction leaf to the root
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InclusionProof {
    pub leaf_index: usize,
    pub sibling_hashes: Vec<[u8; 32]>,
    pub markle_root: [u8; 32],
}

/// Thread-safe active workspace buffer for a single namespace
pub struct ActiveTreeBuffer {
    pub current_batch_id: u64,
    pub parent_batch_root: [u8; 32],
    pub accumulated_leaves: Vec<[u8; 32]>,
    pub accumulated_logs: Vec<OpLog>,
}

/// The active Governance GateKeeper.
pub struct AxonGateKeeper {
    /// Thread-safe active memory arenas partiioned per swarm namespce
    pub active_bufferes: DashMap<String, Arc<RwLock<ActiveTreeBuffer>>>,

    /// The global completed block ledger for historical lookups
    pub batch_arrive: DashMap<u64, MarkleBatch>,
    pub global_batch_counter: std::sync::atomic::AtomicU64,
}

impl AxonGateKeeper {
    pub fn new() -> Self {
        Self {
            last_known_hash: DashMap::new(),
        }
    }

    /// Intercepts the raw thought, cryptographically seals it into a specific namespace DAG, and returns the mutated Oplog ready or the WAL and Cortex.
    pub fn seal_thought(&self, mut log: OpLog) -> OpLog {
        let mut hasher = Hasher::new();
        let namespace = log.state.namespace.clone();

        // Acquire a localized, sharded reference to the namespace hash; If it doesn't exist we default to genesis zero hash
        let mut shard_hash_ref = self.last_known_hash.entry(namespace).or_insert([0u8; 32]);

        // 2. Mutate the log to include the prev link in the chain
        log.previous_hash = *shard_hash_ref;

        // 3. Hash the payloadsize, agent_id and previous hash
        hasher.update(&log.delta);
        hasher.update(&log.agent_id);
        hasher.update(&log.previous_hash);

        // 4. Finalize the current hash and mutate the log
        let current_hash: [u8; 32] = hasher.finalize().into();
        log.current_hash = current_hash;

        // 5. Update the gatekeepers memory for this specific namespace.
        *shard_hash_ref = current_hash;

        log
    }

    /// Agent B uses this to verify the thoughts it received from iceoryx2
    pub fn verify_foreign_thoughts(&self, log: &Archived<OpLog>) -> bool {
        let mut hasher = Hasher::new();

        hasher.update(log.delta.as_slice());
        hasher.update(log.agent_id.as_slice());
        hasher.update(log.previous_hash.as_slice());

        let expected_hash: [u8; 32] = hasher.finalize().into();

        expected_hash == *log.current_hash.as_slice()
    }
}
