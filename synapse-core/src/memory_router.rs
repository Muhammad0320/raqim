use std::sync::Arc;

use crate::lancedb_store::LanceEngine;

pub struct MemoryRouter {
    wal_path: String,
    lance_engine: Arc<LanceEngine>,
}
