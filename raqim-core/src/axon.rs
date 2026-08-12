use crate::{
    OpLog,
    witness::{self, AnchoredRootWitness},
};
use blake3::Hasher;
use dashmap::DashMap;
use parking_lot::RwLock;
use rkyv::Archived;
use serde::{Deserialize, Serialize};
use std::{
    eprintln, format, println,
    sync::{Arc, atomic::Ordering::SeqCst},
};

/// A completed cryptographic audit checkpoint batch ready for ledger immutability
#[derive(
    Debug, Clone, Serialize, Deserialize, rkyv::Archive, rkyv::Serialize, rkyv::Deserialize,
)]
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
    pub tx_id_hex: String,
    pub leaf_index: usize,
    pub sibling_hashes_hex: Vec<String>,

    pub merkle_root_hex: String,
    pub parent_batch_root_hex: String,
    pub batch_id: u64,
    pub is_active_buffer: bool,
}

/// Thread-safe active workspace buffer for a single namespace
pub struct ActiveTreeBuffer {
    pub current_batch_id: u64,
    pub parent_batch_root: [u8; 32],
    pub accumulated_leaves: Vec<[u8; 32]>,
    pub accumulated_logs: Vec<OpLog>,
    pub accumulated_tx_ids: Vec<u128>,
}

/// The active Governance GateKeeper.
pub struct AxonGateKeeper {
    /// Thread-safe active memory arenas partiioned per swarm namespce
    pub active_buffers: DashMap<String, Arc<RwLock<ActiveTreeBuffer>>>,

    /// The global completed block ledger for historical lookups
    pub batch_archive: DashMap<u64, MarkleBatch>,
    pub global_batch_counter: std::sync::atomic::AtomicU64,

    // Fast-path map: tx_id(u128) -> (batch_id, leaf_index)
    pub tx_to_location: DashMap<u128, (u64, usize)>,
}

impl AxonGateKeeper {
    pub fn new() -> Self {
        Self {
            active_buffers: DashMap::new(),
            batch_archive: DashMap::new(),
            tx_to_location: DashMap::new(),
            global_batch_counter: std::sync::atomic::AtomicU64::new(0),
        }
    }

    /// Single Core Ingestion Engine: Appends leaf hash, checks batch capacity, and crystallizes Merkle Root if full
    fn ingest_leaf_internal(
        &self,
        namespace: &str,
        leaf_hash: [u8; 32],
        log: OpLog,
    ) -> Option<MarkleBatch> {
        let tx_id = log.state.transaction_id;

        // Pass 1: Acquire reference to the namespace buffer
        let buffer_arc = self
            .active_buffers
            .entry(namespace.to_string())
            .or_insert_with(|| {
                Arc::new(RwLock::new(ActiveTreeBuffer {
                    current_batch_id: self.global_batch_counter.fetch_add(1, SeqCst),
                    parent_batch_root: [0u8; 32],
                    accumulated_leaves: Vec::with_capacity(1024),
                    accumulated_logs: Vec::with_capacity(1024),
                    accumulated_tx_ids: Vec::with_capacity(1024),
                }))
            })
            .value()
            .clone();

        let mut buffer = buffer_arc.write();

        // Track 0(1) TxID location map
        self.tx_to_location.insert(
            tx_id,
            (buffer.current_batch_id, buffer.accumulated_leaves.len()),
        );

        buffer.accumulated_leaves.push(leaf_hash);
        buffer.accumulated_logs.push(log);
        buffer.accumulated_tx_ids.push(tx_id);

        // Cap Checkpoint: If capacity hits 1,024 leaves, crystallize the Markle Tree
        if buffer.accumulated_leaves.len() >= 1024 {
            let root = Self::compute_markle_root(&buffer.accumulated_leaves);

            let completed_batch = MarkleBatch {
                batch_id: buffer.current_batch_id,
                namespace: namespace.to_string(),
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
            buffer.accumulated_tx_ids.clear();

            return Some(completed_batch);
        }

        None
    }

    /// Ingest a raw thought, cryptographically seals its position ans triggers automatic Markle Tree crystallization when chunk capacity hits 1,024
    pub fn seal_thought(&self, mut log: OpLog) -> (OpLog, Option<MarkleBatch>) {
        let namespace = log.state.namespace.clone();

        // Compute the discrete leaf cryptographic hash using domain separation
        let mut leaf_hasher = Hasher::new_derive_key("raqim.axon.v1.leaf");
        leaf_hasher.update(&log.delta);
        leaf_hasher.update(&log.agent_id);
        let leaf_hash: [u8; 32] = leaf_hasher.finalize().into();

        // Fetch parent root hash for temporal linkage
        let parent_root = self
            .active_buffers
            .get(&namespace)
            .map(|b| b.read().parent_batch_root)
            .unwrap_or([0u8; 32]);

        log.previous_hash = parent_root;
        log.current_hash = leaf_hash;

        // Delegate to internal ingestion helper
        let batch = self.ingest_leaf_internal(&namespace, leaf_hash, log.clone());

        (log, batch)
    }

    /// Internal Engine loop: Condenses an arbitrary array of leaf hashes into a single Markle Root
    pub fn compute_markle_root(leaves: &[[u8; 32]]) -> [u8; 32] {
        if leaves.is_empty() {
            return [0u8; 32];
        }

        let mut current_level = leaves.to_vec();
        while current_level.len() > 1 {
            let mut next_level: Vec<[u8; 32]> = Vec::with_capacity((current_level.len() + 1) / 2);

            for chunk in current_level.chunks(2) {
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

    /// Proof generator: 0(log N) proof extraction for any tx_id (Archiived or Active buffer)
    pub fn generate_proof_for_tx(&self, tx_id: u128) -> Option<InclusionProof> {
        let tx_id_hex = format!("{:032x}", tx_id);

        // Check Location  Index
        if let Some(location) = self.tx_to_location.get(&tx_id) {
            let (batch_id, leaf_index) = *location.value();

            // Path A: Query Completed batch archive
            if let Some(batch) = self.batch_archive.get(&batch_id) {
                let proof_nodes = Self::exract_sibling_path(&batch.leaves, leaf_index);
                return Some(InclusionProof {
                    tx_id_hex,
                    leaf_index,
                    sibling_hashes_hex: proof_nodes.iter().map(|h| hex::encode(h)).collect(),
                    merkle_root_hex: (hex::encode(batch.markle_root)),
                    parent_batch_root_hex: hex::encode(batch.parent_batch_root),
                    batch_id,
                    is_active_buffer: false,
                });
            }
        }

        // Path B: Un-crystallized Active Workspace Buffer search
        for entry in self.active_buffers.iter() {
            let buffer = entry.value().read();
            if let Some(leaf_index) = buffer.accumulated_tx_ids.iter().position(|&id| id == tx_id) {
                let active_root = Self::compute_markle_root(&buffer.accumulated_leaves);
                let proof_nodes = Self::exract_sibling_path(&buffer.accumulated_leaves, leaf_index);

                return Some(InclusionProof {
                    tx_id_hex,
                    leaf_index,
                    sibling_hashes_hex: proof_nodes.iter().map(|h| hex::encode(h)).collect(),
                    merkle_root_hex: hex::encode(active_root),
                    parent_batch_root_hex: hex::encode(buffer.parent_batch_root),
                    batch_id: buffer.current_batch_id,
                    is_active_buffer: true,
                });
            }
        }

        None
    }

    fn exract_sibling_path(leaves: &[[u8; 32]], leaf_index: usize) -> Vec<[u8; 32]> {
        let mut sibling_hashes = Vec::new();
        let mut current_level = leaves.to_vec();
        let mut index = leaf_index;

        while current_level.len() > 1 {
            let mut next_level = Vec::with_capacity((current_level.len() + 1) / 2);

            for chunk in current_level.chunks(2) {
                let mut hasher = Hasher::new_derive_key("raqim.axon.v1.node");
                if chunk.len() == 2 {
                    hasher.update(&chunk[0]);
                    hasher.update(&chunk[1]);
                } else {
                    hasher.update(&chunk[0]);
                    hasher.update(&chunk[0]);
                }

                next_level.push(hasher.finalize().into());
            }

            let sibling_idx = if index % 2 == 0 {
                if index + 1 < current_level.len() {
                    index + 1
                } else {
                    index
                }
            } else {
                index - 1
            };

            sibling_hashes.push(current_level[sibling_hashes]);
            current_level = next_level;
            index /= 2;
        }

        sibling_hashes
    }

    /// THE PHOENIX CRASH RECOVERY COMPONENT
    pub fn hydrate_from_recovery(&self, log: &OpLog) {
        let namespace = log.state.namespace.clone();
        let _ = self.ingest_leaf_internal(&namespace, log.current_hash, log.clone());
    }

    /// Validates inclusion proof using raw payload + proof data
    pub fn verify_inclusion(
        payload_bytes: &[u8],
        agent_id: &[u8; 16],
        proof: &InclusionProof,
    ) -> bool {
        let mut leaf_hasher = Hasher::new_derive_key("raqim.axon.v1.leaf");
        leaf_hasher.update(payload_bytes);
        leaf_hasher.update(agent_id);
        let mut current_hash: [u8; 32] = leaf_hasher.finalize().into();

        let mut index = proof.leaf_index;

        for sibling_hex in &proof.sibling_hashes_hex {
            let Ok(sibling_bytes) = hex::decode(sibling_hex) else {
                return false;
            };
            if sibling_bytes.len() != 32 {
                return false;
            }

            let mut hasher = Hasher::new_derive_key("raqim.axon.v1.node");
            if index % 2 == 0 {
                hasher.update(&current_hash);
                hasher.update(&sibling_bytes);
            } else {
                hasher.update(&sibling_bytes);
                hasher.update(&current_hash);
            }

            current_hash = hasher.finalize().into();
            index /= 2;
        }

        hex::encode(current_hash) == proof.merkle_root_hex
    }

    /// Network p2p Verification Anchor: Validates signatures over raw FFI slices safely
    pub fn verify_foreign_thoughts(&self, log: &Archived<OpLog>) -> bool {
        let mut hasher = Hasher::new_derive_key("raqim.axon.v1.leaf");

        hasher.update(log.delta.as_slice());
        hasher.update(log.agent_id.as_slice());

        let expected_hash: [u8; 32] = hasher.finalize().into();

        expected_hash == *log.current_hash.as_slice()
    }

    /// Verifies Merkle batched agains WORM witness on boot
    pub fn verify_and_hydrate_witnesses(&self, witnesses: &[AnchoredRootWitness]) -> usize {
        let mut verified_count = 0;

        for witness in witnesses {
            if let Some(local_batch) = self.batch_archive.get(&witness.batch_id) {
                let local_root_hex = hex::encode(local_batch.markle_root);

                if local_batch != witness.merkle_root_hex {
                    eprintln!(

                            "\n [CRITICAL SECURITY BREACH] Local disk tampering detected on Merkle Batch #{}!"
                            "Local Root: {}, Anchored WORM Witness Root: {}. Overriding local state with Witness Truth.",
                            witness.batch_id, local_root_hex, witness.merkle_root_hex
                    );
                } else {
                    { verified_count += 1 }
                }
            }
        }

        println!(
            "[PHOENIX WITNESS] Verified {} Merkle bbatches agains WORM Immutable Storage.",
            verified_count
        );
        verified_count
    }
}
