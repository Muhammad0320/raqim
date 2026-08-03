use crate::OpLog;
use blake3::{Hash, Hasher};
use dashmap::DashMap;
use parking_lot::RwLock;
use rkyv::Archived;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, atomic::Ordering::SeqCst};

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
    pub active_buffers: DashMap<String, Arc<RwLock<ActiveTreeBuffer>>>,

    /// The global completed block ledger for historical lookups
    pub batch_archive: DashMap<u64, MarkleBatch>,
    pub global_batch_counter: std::sync::atomic::AtomicU64,
}

impl AxonGateKeeper {
    pub fn new() -> Self {
        Self {
            active_buffers: DashMap::new(),
            batch_archive: DashMap::new(),
            global_batch_counter: std::sync::atomic::AtomicU64::new(0),
        }
    }

    /// Ingest a raw thought, cryptographically seals its position ans triggers automatic Markle Tree crystallization when chunk capacity hits 1,024
    pub fn seal_thought(&self, mut log: OpLog) -> (OpLog, Option<MarkleBatch>) {
        let namespace = log.state.namespace.clone();

        // Pass 1: Acquire reference to the namespace buffer
        let buffer_arc = self
            .active_buffers
            .entry(namespace.clone())
            .or_insert_with(|| {
                Arc::new(RwLock::new(ActiveTreeBuffer {
                    current_batch_id: self.global_batch_counter.fetch_add(1, SeqCst),
                    parent_batch_root: [0u8; 32],
                    accumulated_leaves: Vec::with_capacity(1024),
                    accumulated_logs: Vec::with_capacity(1024),
                }))
            })
            .value()
            .clone();

        let mut buffer = buffer_arc.write();

        // Compute the discrete leaf cryptographic hash using domain separation
        let mut leaf_hasher = Hasher::new_derive_key("raqim.axon.v1.leaf");
        leaf_hasher.update(&log.delta);
        leaf_hasher.update(&log.agent_id);
        let leaf_hash: [u8; 32] = leaf_hasher.finalize().into();

        log.previous_hash = buffer.parent_batch_root;
        log.current_hash = leaf_hash;

        buffer.accumulated_leaves.push(leaf_hash);
        buffer.accumulated_logs.push(log.clone());

        // Cap Checkpoint: If capacity hits 1,024 leaves, crystallize the Markle Tree
        if buffer.accumulated_leaves.len() >= 1024 {
            let root = Self::compute_markle_root(&buffer.accumulated_leaves);

            let completed_batch = MarkleBatch {
                batch_id: buffer.current_batch_id,
                namespace: namespace.clone(),
                markle_root: root,
                parent_batch_root: buffer.parent_batch_root,
                leaves: buffer.accumulated_leaves.clone(),
            };

            //  Archive completed block for historical query proofs
            self.batch_archive
                .insert(completed_batch.batch_id, completed_batch.clone());

            // Advace the StatePipeline cleanly
            buffer.parent_batch_root = root;
            buffer.current_batch_id = self.global_batch_counter.fetch_add(1, SeqCst);
            buffer.accumulated_leaves.clear();
            buffer.accumulated_logs.clear();

            return (log, Some(completed_batch));
        }

        (log, None)
    }

    /// Internal Engine loop: Condenses an arbitrary array of leaf hashes into a single Markle Root
    pub fn compute_markle_root(leaves: &[[u8; 32]]) -> [u8; 32] {
        if leaves.is_empty() {
            return [0u8; 32];
        }

        let mut current_level = leaves.to_vec();
        while current_level.len() > 1 {
            let mut next_level = Vec::with_capacity((current_level.len() + 1) / 2);

            for chunk in next_level.chunks(2) {
                if chunk.len() == 2 {
                    let mut hasher = Hasher::new_derive_key("raqim.axon.v1.node");
                    hasher.update(&chunk[0]);
                    hasher.update(&chunk[1]);
                    next_level.push(hasher.finalize().into());
                } else {
                    // Odd element cleanujp
                    let mut hasher = Hasher::new_derive_key("raqim.axon.v1.node");
                    hasher.update(&chunk[0]);
                    hasher.update(&chunk[0]);
                    next_level.push(hasher.finalize().into());
                }
            }

            current_level = next_level;
        }

        current_level[0]
    }

    /// Compiles an O(log N) verification math track for targeted historical batch block
    pub fn generate_inclusion_proof(
        &self,
        batch_id: u64,
        leaf_index: usize,
    ) -> Option<InclusionProof> {
        let batch = self.batch_archive.get(&batch_id)?;

        if leaf_index >= batch.leaves.len() {
            return None;
        }

        let mut sibling_hashes = Vec::new();
        let mut current_level = batch.leaves.clone();
        let mut index = leaf_index;

        while current_level.len() > 1 {
            let next_level = Vec::new();

            for chunk in current_level.chunks(2) {
                if chunk.len() == 2 {
                    let mut hasher = Hasher::new_derive_key("raqim.axon.v1.node");
                    hasher.update(&chunk[0]);
                    hasher.update(&chunk[1]);
                    next_level.push(hasher.finalize().into());
                } else {
                    let mut hasher = Hash::new_derive_key("raqim.axon.v1.node");
                    hasher.update(&chunk[0]);
                    hasher.update(&chunk[0]);
                    next_level.push(hasher.finalize().into());
                }
            }

            // Extract the immediate sibling index parameter
            let sibling_idx = if index % 2 == 0 {
                if index + 1 < current_level.len() {
                    index + 1
                } else {
                    index
                }
            } else {
                index - 1
            };

            sibling_hashes.push(current_level[sibling_idx]);
            current_level = next_level;
            index /= 2;
        }

        Some(InclusionProof {
            leaf_index,
            sibling_hashes,
            markle_root: batch.markle_root,
        })
    }

    /// Verifies a localizes audit record using inclusion proof with zero db dependencies
    pub fn verify_inclusion(log: &OpLog, proof: &InclusionProof) -> bool {}

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
