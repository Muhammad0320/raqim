use crate::OpLog;
use blake3::Hasher;
use dashmap::DashMap;
use rkyv::Archived;

/// The active Governance GateKeeper.
pub struct AxonGateKeeper {
    // True conncurrency, The Markle DAG is now sharded per namespace
    last_known_hash: DashMap<String, [u8; 32]>,
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
