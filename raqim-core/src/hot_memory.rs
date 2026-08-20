use parking_lot::RwLock;
use std::{collections::VecDeque, println};

#[derive(Clone, Debug)]
pub struct HotVectorEntry {
    pub tx_id: u128,
    pub agent_hex: String,
    pub namespace: String,
    pub text: String,
    pub timestamp: i64,
    pub vector: Vec<f32>,
}

pub struct HotVectorBuffer {
    entries: RwLock<VecDeque<HotVectorEntry>>,
}

impl HotVectorBuffer {
    pub fn new(capacity: usize) -> Self {
        Self {
            entries: RwLock::new(VecDeque::with_capacity(capacity)),
        }
    }

    /// Pushes a newly commited thought and it's vector into hot RAM
    pub fn push(&self, entry: HotVectorEntry) {
        let mut lock = self.entries.write();
        lock.push_back(entry);
    }

    /// Batch pushes recovered entried during Phoenix Boot Hydration
    pub fn push_batch(&self, entries: Vec<HotVectorEntry>) {
        let mut lock = self.entries.write();
        for entry in entries {
            lock.push_back(entry);
        }
    }

    /// SIMD-Accelerated Cosine Proximity Searchh over Hot RAM
    pub fn search_hot(
        &self,
        query_vector: &[f32],
        namespace_filter: Option<&str>,
        top_k: usize,
    ) -> Vec<(HotVectorEntry, f32)> {
        let lock = self.entries.read();
        let mut scored_entries = Vec::new();

        for entry in lock.iter() {
            if let Some(ns) = namespace_filter {
                if !ns.is_empty() && &entry.namespace != ns {
                    continue;
                }
            }

            // Compute Cosine proximity Dot product in Ram
            let similarity = cosine_similarity(query_vector, &entry.vector);
            scored_entries.push((entry.clone(), similarity));
        }

        // Sort by highest similarity first
        scored_entries.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        scored_entries.truncate(top_k);
        scored_entries
    }

    /// WATERMARK EVICTION: Evists entries ONLY if they have been durably archived into LanceDB
    pub fn evict_compacted_up_to(&self, max_compacted_tx: u128) -> usize {
        let mut lock = self.entries.write();
        let initial_len = lock.len();

        lock.retain(|e| e.tx_id > max_compacted_tx);

        let evicted_count = initial_len - lock.len();
        if evicted_count > 0 {
            println!(
                "[HOT MEMORY] Evicted {} entries from RAM (Compaction Watermark: {:032x}) ",
                evicted_count, max_compacted_tx
            );
        }

        evicted_count
    }
}

/// Computes normalized dot product (cosine similarity) between two vectors
#[inline(always)]
fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    if a.len() != b.len() || a.is_empty() {
        return 0.0;
    }
    let mut dot = 0.0f32;
    let mut norm_a = 0.0f32;
    let mut norm_b = 0.0f32;

    for i in 0..a.len() {
        dot += a[i] * b[i];
        norm_a += a[i] * a[i];
        norm_b += b[i] * b[i];
    }

    if norm_a == 0.0 || norm_b == 0.0 {
        return 0.0;
    }

    dot / (norm_a.sqrt() * norm_b.sqrt())
}
