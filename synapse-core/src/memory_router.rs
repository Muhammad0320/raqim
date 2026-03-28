use futures::StreamExt;
use lancedb::query::ExecutableQuery;
use lancedb::query::QueryBase;
use memmap2::MmapOptions;
use rkyv::{Archive, Archived};
use std::io::{Read, Seek, SeekFrom};
use std::{fs::File, sync::Arc, u64};
use tokio::sync::broadcast;

pub enum RebuildMode {
    Resurrection,
    TimeTravel(u64), //
}

use crate::{
    OpLog, SystemEvent, config::RaqimConfig, lancedb_store::LanceEngine, nucleus::WalEngine,
    state::SwarmState,
};

pub struct MemoryRouter {
    wal_path: String,
    lance_engine: Arc<LanceEngine>,
    config: RaqimConfig,
}

impl MemoryRouter {
    pub fn new(wal_path: &str, lance_engine: Arc<LanceEngine>, config: RaqimConfig) -> Self {
        Self {
            wal_path: wal_path.to_string(),
            lance_engine,
            config,
        }
    }

    /// PRIVATE DRY HELPER: Scans the WAL and executes a closure on the Zero-Copy Archived data
    fn scal_wal_zero_copy<F>(&self, mut callback: F)
    where
        F: FnMut(&Archived<OpLog>),
    {
        if let Ok(file) = File::open(&self.wal_path) {
            if let Ok(mmap) = unsafe { MmapOptions::new().map(&file) } {
                let mut offset = 0;
                while offset < mmap.len() {
                    if offset + 4 > mmap.len() {
                        break;
                    }

                    let mut len_bytes = [0u8; 4];
                    len_bytes.copy_from_slice(&mmap[offset..offset + 4]);
                    let entry_len = u32::from_le_bytes(len_bytes) as usize;
                    offset += 4;
                    let entry_slice = &mmap[offset..offset + entry_len];

                    //  TRUE ZERO-COPY: We cast a pointer. No mem allocation. No deserialization
                    let archived_log = unsafe {
                        rkyv::access_unchecked::<<OpLog as Archive>::Archived>(entry_slice)
                    };

                    callback(archived_log);

                    offset += entry_len;
                }
            }
        }
    }

    /// FORENSIC TIME MACHINE
    pub async fn fetch_by_txid(&self, target_tx_id: u64) -> Result<String, anyhow::Error> {
        let mut result = None;

        // 1. Hot Memory ( Zero-copy WAL scan )
        self.scal_wal_zero_copy(|archievd| {
            // We read directly from the archeived bytes!
            if archievd.state.transaction_id == target_tx_id {
                result = Some(format!(
                    "[HOT MEMORY] TxID: {} | Text: {} ",
                    archievd.state.transaction_id,
                    archievd.state.text.as_str()
                ))
            }
        });

        if let Some(res) = result {
            return Ok(res);
        }

        // 2. Cold Memory ( REAL LanceDB SQL Filter )
        let table = self
            .lance_engine
            .db
            .open_table(&self.config.table_name)
            .execute()
            .await?;

        // LanceDB allows SQL-style filtering directly on the Arrow columns
        let mut stream = table
            .query()
            .only_if(format!("tx_id = {}", target_tx_id))
            .limit(1)
            .execute()
            .await?;

        if let Some(batch_result) = stream.next().await {
            let batch = batch_result?;
            let text_col = batch
                .column_by_name("text")
                .unwrap()
                .as_any()
                .downcast_ref::<arrow_array::StringArray>()
                .unwrap();

            if text_col.len() > 0 {
                return Ok(format!(
                    "[COLD STORAGE] TxID: {} | Text: {} ",
                    target_tx_id,
                    text_col.value(0)
                ));
            }
        }

        Err(anyhow::anyhow!(
            "TxID {} not found in WAL or LanceDB.",
            target_tx_id
        ))
    }

    // RAG CONTEXT: Prioritize the hot WAL, fills the rest with semantic lanceDB
    pub async fn semantic_search_with_context(
        &self,
        query: &str,
        limit: usize,
    ) -> Result<Vec<String>, anyhow::Error> {
        let mut final_context = Vec::new();

        // 1. The WAL is the absolute truth of present. We take ALL recent active thoughts.
        self.scal_wal_zero_copy(|archived| {
            final_context.push(format!("[Recent] {} ", archived.state.text.as_str()));
        });

        // 2. Supplement with Deep Semantic search
        let mut deep_memories = self.lance_engine.search_memory(query, limit).await?;
        final_context.append(&mut deep_memories);

        Ok(final_context)
    }

    /// THE RESURRECTION ENGINE
    /// Rebuild the LORO CRDT Hive Mind from Cold storage and Hot Memory.
    pub async fn rebuild_swarm_brain(
        &self,
        mode: RebuildMode,
    ) -> Result<Arc<SwarmState>, anyhow::Error> {
        println!("[SYSTEM] Bismillah. Initializing Swarm State Rebuild Sequence...");

        let target_tx_id = match mode {
            RebuildMode::Resurrection => u64::MAX,
            RebuildMode::TimeTravel(tx) => tx,
        };

        // Initilaize a blank CRDT Brain
        // TODO: In production pass the actual sender!
        let (tx, _rx) = broadcast::channel::<SystemEvent>(1000);
        let rebuilt_brain = Arc::new(SwarmState::new("rqm_global", tx));

        // We stream the OpLogs from the WAL up to the Target tx_id
        let mut applied_count = 0;

        self.scal_wal_zero_copy(|log| {
            if log.state.transaction_id <= target_tx_id {
                // Re-assimilate the histocal thought into the new brain
                if let Err(e) = rebuilt_brain.assimilate_foreign_thought(&log.delta.as_slice()) {
                    eprintln!("Failed to assimilate historical delta during build: {}", e);
                }

                applied_count += 1;
            }
        });

        println!(
            "[SYSTEM] BRAIN REBUILD COMPLETE. Assimilated {} historical deltas.",
            applied_count
        );
        Ok(rebuilt_brain)
    }

    pub async fn rebuild_agent_timeline(
        &self,
        agent_hex: &str,
        target_tx_id: u64,
        wal_engine: Arc<WalEngine>,
    ) -> Result<(Vec<u8>, Vec<OpLog>), anyhow::Error> {
        // 1. O(1) COLD MEMORY JUMP (LanceDB)
        let (snapshot_txid, memory_blob) = self
            .lance_engine
            .fetch_closest_snapshot(agent_hex, target_tx_id as i64)
            .await
            .unwrap_or((0, Vec::new()));

        println!(
            "[TIME MACHINE] Loaded Base Snapshot at TxID: {} ",
            snapshot_txid
        );

        let mut historical_oplogs = Vec::new();

        // 2. O(1) WAL INDEX SEEK
        // We calculate the very next TxID we need to read
        let next_txid = (snapshot_txid as u64) + 1;

        if next_txid <= target_tx_id {
            // Ask the mutex protected BTreeMap for the exact byte offset on the SSD
            let start_byte = {
                let idx = wal_engine.index.read().unwrap();
                idx.get(&next_txid).cloned().unwrap_or(0)
            };

            // 3. Physical disk seek
            if let Ok(mut file) = std::fs::File::open(&self.config.wal_path) {
                // The Kernel jumps the read-head directly to the exact byte. Zero scanning!
                file.seek(SeekFrom::Start(start_byte))
                    .expect("Failed to seek WAL file");

                let mut buffer = Vec::new();
                file.read_to_end(&mut buffer).unwrap(); // Read the remainder of the file

                let mut offset = 0;
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

                    let current_tx = archived_log.state.transaction_id;

                    if current_tx > target_tx_id {
                        break;
                    } // We reached the future. Stop reading.

                    // Only collect logs belonging to this specific agent!
                    if hex::encode(archived_log.agent_id.as_slice()) == agent_hex {
                        // Deserialize here only because we're handling this to the WASM to execute.
                        if let Ok(log) =
                            rkyv::deserialize::<OpLog, rkyv::rancor::Error>(archived_log)
                        {
                            historical_oplogs.push(log);
                        }
                    }

                    offset += entry_len;
                }
            }
        }
        Ok((memory_blob, historical_oplogs))
    }
}
