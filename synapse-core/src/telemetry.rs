use std::sync::{
    Arc,
    atomic::{AtomicU64, Ordering},
};

use tokio::io::AsyncWriteExt;

// The lock free memory counter. Zero impact on the hot path.
pub struct TelemetryEngine {
    pub tenant_id: String,
    pub licence_key: String,
    pub crdt_merges: AtomicU64,
    pub a2a_bytes_routed: AtomicU64,
    pub time_travel_queries: AtomicU64,
}

impl TelemetryEngine {
    pub fn new(tenant_id: &str, licence_key: &str) -> Arc<Self> {
        Arc::new(Self {
            tenant_id: tenant_id.to_string(),
            licence_key: licence_key.to_string(),
            crdt_merges: AtomicU64::new(0),
            a2a_bytes_routed: AtomicU64::new(0),
            time_travel_queries: AtomicU64::new(0),
        })
    }

    /// 0(1) Lock-free increments called directly by the OS subsystems.
    pub fn record_crdt_merge(&self) {
        self.crdt_merges.fetch_add(1, Ordering::Relaxed);
    }
    pub fn record_a2a_bytes(&self, bytes: u64) {
        self.a2a_bytes_routed.fetch_add(bytes, Ordering::Relaxed);
    }
    pub fn record_time_travel(&self) {
        self.time_travel_queries.fetch_add(1, Ordering::Relaxed);
    }
}
