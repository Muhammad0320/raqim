use blake3::Hasher;
use std::sync::Mutex;
use crate::OpLog;

/// The active Governance GateKeeper.
pub struct AxonGateKeeper {

    // We use a mutex here because the last know hash must be updated strictly sequentially
    last_known_hash: Mutex<[u8; 32]>

}

impl AxonGateKeeper {

    pub fn new() -> Self {

        Self { last_known_hash: Mutex::new([0; 32]) }

    }

    /// Intercepts the raw thought, cryptographically seals it into the DAG, and returns the mutated Oplog ready or the WAL and Cortex. 
    pub fn seal_thought(&self, mut log: OpLog) -> OpLog {

        let mut hasher = Hasher::new();

        // 1. Lock the DAG chain briefly to get the prev hash
        let mut chain_lock = self.last_known_hash.lock().unwrap();

        // 2. Mutate the log to include the prev link in the chain
        log.previous_hash = *chain_lock;

        // 3. Hash the payloadsize, agent_id and previous hash
        hasher.update(&log.delta);
        hasher.update(&log.agent_id);
        hasher.update(&log.previous_hash);

        // 4. Finalize the current hash and mutate the log
        let current_hash: [u8; 32] = hasher.finalize().into();
        log.current_hash = current_hash;

        // 5. Update the gatekeepers memory. 
        *chain_lock = current_hash;

        log 
    } 
    
    /// Agent B uses this to verify the thoughts it received from iceoryx2
    pub fn verify_foreign_thoughts(&self, log: &OpLog) -> bool {

        let mut hasher = Hasher::new();

        hasher.update(&log.delta);
        hasher.update(&log.agent_id);
        hasher.update(&log.previous_hash);

        let expected_hash: [u8; 32] = hasher.finalize().into();

        expected_hash == log.current_hash
    }

}
