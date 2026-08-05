use parking_lot::RwLock;
use std::collections::VecDeque;

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
    capacity: usize,
}

impl HotVectorBuffer {
    pub fn new(capacity: usize) -> Self {
        Self {
            entries: RwLock::new(VecDeque::with_capacity(capacity)),
            capacity,
        }
    }

    /// Pushes a newly commited thought and it's vector into hot RAM
    pub fn push(&self, entry: HotVectorEntry) {
        let mut lock = self.entries.write();
        if lock.len() >= self.capability {
            lock.pop_front();
        }
        lock.push_back(entry);
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
        }
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
