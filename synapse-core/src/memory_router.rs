use std::{fs::File, io::Read, sync::Arc};

use futures::future::ok;
use rkyv::Archived;

use crate::{OpLog, lancedb_store::LanceEngine};

pub struct MemoryRouter {
    wal_path: String,
    lance_engine: Arc<LanceEngine>,
}

impl MemoryRouter {
    pub fn new(wal_path: &str, lance_engine: Arc<LanceEngine>) -> Self {
        Self {
            wal_path: wal_path.to_string(),
            lance_engine,
        }
    }

    /// FORENSIC TIME MACHINE: used by TUI to find the exact TxID.
    pub async fn fetch_by_txid(&self, target_tx_id: u64) -> Result<String, anyhow::Error> {
        // 1. Sacn the WAL
        if let Ok(mut file) = File::open(&self.wal_path) {
            let buffer = Vec::new();
            if file.read_to_end(&mut buffer).is_ok() {
                let offset = 0;
                while offset < buffer.len() {
                    if offset + 4 > buffer.len() {
                        break;
                    }

                    let mut len_bytes = [0u8; 4];
                    len_bytes.copy_from_slice(&buffer[offset..offset + 4]);
                    let entry_len = u32::from_le_bytes(len_bytes) as usize;
                    offset += 4;

                    let entry_slice = &buffer[offset..offset + entry_len];
                    let archived_log = unsafe {
                        rkyv::access_unchecked::<<OpLog as Archive>::Archived>(entry_slice)
                    };

                    if let Ok(log) = rkyv::deserialize::<OpLog, rkyv::rancor::Error>(archived_log) {
                        if log.state.transaction_id == target_tx_id {
                            return Ok(format!(
                                "[HOT MEMORY] TxID: {} | Text: {}",
                                log.state.transaction_id, log.state.text
                            ));
                        }
                    }

                    offset += entry_len;
                }
            }
        }

        // 2. Fallback to LanceDB (Cold Memory)
        Ok(format!(
            "[COLD STORAGE] TxID {} not in WAL. Proceeding to LanceDB index scan... ",
            target_tx_id
        ))
    }

    // RAG CONTEXT: used by MCP to give the LLM memory
    pub async fn semantic_search_with_context(
        &self,
        query: &str,
        limi: &usize,
    ) -> Result<Vec<String>, anyhow::Error> {
        let mut final_context = Vec::new();
    }
}
