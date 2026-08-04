use crate::{
    AgentStatus, OpLog,
    api::{TimelineNode, VaultSearchResult},
};
use aho_corasick::AhoCorasick;
use memmap2::MmapOptions;
use rkyv::to_bytes;
use std::os::unix::fs::OpenOptionsExt;
use std::{
    collections::BTreeMap,
    eprintln,
    fs::File,
    io::Read,
    sync::Arc,
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use tokio::io::AsyncWriteExt;
use tokio::{
    sync::{RwLock, mpsc, oneshot},
    time::interval,
};

pub struct WalEngine {
    sender: mpsc::Sender<OpLog>,
    pub cmd_sender: mpsc::Sender<WalCommand>,
    // The O(1) INDEX: Maps TxID -> Physical byte offset in the WAL.
    pub index: Arc<RwLock<BTreeMap<u128, u64>>>,
}

pub enum WalCommand {
    Rotate(oneshot::Sender<String>),
}

impl WalEngine {
    /// Bootstraps the enterprise WAL with automatic env detection
    pub async fn start(file_path: String) -> (Arc<Self>, tokio::task::JoinHandle<()>) {
        println!("Bismillah. Booting Portable Nucleus WAL Engine...");

        // Bounded channel to prevent OOM crashes
        let (tx, mut rx) = mpsc::channel::<OpLog>(100_000);
        let (cmd_tx, mut cmd_rx) = mpsc::channel::<WalCommand>(10);

        let index = Arc::new(RwLock::new(BTreeMap::new()));
        let index_clone = index.clone();
        let fp_clone = file_path.clone();

        // Spawn Tokio Worker task
        let handle = tokio::spawn(async move {
            let mut active_file = tokio::fs::OpenOptions::new()
                .create(true)
                .read(true)
                .write(true)
                .open(&file_path)
                .await
                .expect("Failed to open io_uring WAL file");

            // Query initial file offset asychronously
            let metadata = active_file
                .metadata()
                .await
                .expect("Failed to stat WAL file");
            let mut current_offset = metadata.len();
            let mut batch: Vec<OpLog> = Vec::with_capacity(6_000);

            // Group commit timer (flushes the disk cache every 2ms if data is pending)
            let mut flush_interval = interval(Duration::from_millis(2));

            loop {
                tokio::select! {
                    // Path A: Incoming log item
                    msg = rx.recv() => {
                        match msg  {
                            Some(log) => {
                              batch.push(log);

                            // Drain the channel of any other pending thoughts for batching
                            while batch.len() < 6_000 {
                                    if let Ok(pending_log) = rx.try_recv() {
                                        batch.push(pending_log);
                                    } else {
                                        break;
                                    }
                            }

                            if !batch.is_empty() {
                                Self::write_batch_to_disk(&mut active_file, &mut current_offset, &batch, &index_clone).await;

                                batch.clear();
                            }

                    }
                            None => break

                        }

                    }

                    // Path B: Group Commit Flush (Forces fsync every 2ms)
                    _ = flush_interval.tick() => {
                        let _ = active_file.sync_data().await;
                    }

                    // Path C: Segment Rotation Command
                    cmd = cmd_rx.recv() => {
                        match cmd {
                        Some(WalCommand::Rotate(reply_tx)) => {

                            println!("[WAL_ENGINE] Halting I/O. Rotating WAL segment...");

                            // 1. Force final hardware flush
                            let _ = active_file.sync_data().await;

                            // Generate archived filename based on unix timestamp
                            let timestamp = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
                            let archived_name = format!("{fp_clone}_{timestamp}.wal");

                            // Async File rename (non-blocking)
                            if let Err(e) = tokio::fs::rename(&fp_clone, &archived_name).await {

                                eprintln!("[WAL_ENGINE ERROR] Rotation rename failed: {} ", e);
                                continue;

                            }

                            // Open a fresh active file & reset offset
                            active_file = tokio::fs::OpenOptions::new().create(true).read(true).write(true).open(&fp_clone).await.unwrap();
                            current_offset = 0;

                            // Clear memory index for fresh segment
                            {
                                let mut idx = index_clone.write().await;
                                idx.clear();
                            }

                            // Tell the compactor the achived file is ready
                            let _ = reply_tx.send(archived_name);
                            println!("[WAL_ENGINE] Rotation complete. I/O resumed.");

                    }

                            None => break,
                        }

                    }

                }
            }
        });

        (
            Arc::new(Self {
                sender: tx,
                cmd_sender: cmd_tx,
                index,
            }),
            handle,
        )
    }

    pub async fn start_dummy() -> Arc<Self> {
        let (tx, _) = mpsc::channel::<OpLog>(100);
        let (cmd_tx, _) = mpsc::channel::<WalCommand>(10);

        let index = Arc::new(RwLock::new(BTreeMap::new()));

        Arc::new(Self {
            sender: tx,
            cmd_sender: cmd_tx,
            index,
        })
    }

    /// Internal Helper: Zero-copy serialization and non-blocking write.
    async fn write_batch_to_disk(
        file: &mut tokio::fs::File,
        current_offset: &mut u64,
        batch: &[OpLog],
        index: &Arc<RwLock<BTreeMap<u128, u64>>>,
    ) {
        let first_txid = batch[0].state.transaction_id;

        // zero-copy serialize the entire batch
        let bytes = to_bytes::<rkyv::rancor::Error>(batch)
            .expect("Failed to serialize batch")
            .into_vec();

        let len_prefix = (bytes.len() as u32).to_le_bytes();

        // Update in-memory index using async RWLock
        {
            let mut idx = index.write().await;
            idx.insert(first_txid, *current_offset);
        }

        // Sequential write using tokio async I/O
        if let Err(e) = file.write_all(&len_prefix).await {
            eprintln!("[WAL_ENGINE FATAL] Length prefix write failed: {}", e);
            return;
        }

        if let Err(e) = file.write_all(&bytes).await {
            eprintln!(" [WAL_ENGINE FATAL] Payload write failed: {}", e);
            return;
        }

        *current_offset += 4 + bytes.len() as u64;
    }

    /// Fire and forget. The TCP/Agent networking layer NEVER blocks here.
    pub async fn append(&self, log: OpLog) {
        let _ = self.sender.send(log).await;
    }

    /// Extremely fast binary scan of the active WAL for a specific substring
    pub fn lexical_scan(
        &self,
        query: &str,
        namespace_filter: Option<&str>,
        limit: usize,
        wal_path: &str,
    ) -> Result<Vec<VaultSearchResult>, anyhow::Error> {
        let file = File::open(wal_path)?;

        // Page the WAL directly into virtual memory. Zero read() syscall overhead
        let mmap = unsafe { MmapOptions::new().map(&file)? };

        // Compile the search automaton (case-insensitive)
        let ac = AhoCorasick::builder()
            .ascii_case_insensitive(true)
            .build(vec![query])
            .map_err(|e| anyhow::anyhow!("Failed to build automaton: {}", e))?;

        let mut results = Vec::new();
        let mut cursor = 0;

        while cursor < mmap.len() && results.len() < limit {
            if cursor + 4 > mmap.len() {
                break;
            }
            let len = u32::from_le_bytes(mmap[cursor..cursor + 4].try_into().unwrap()) as usize;
            cursor += 4;

            let payload = &mmap[cursor..cursor + len];
            cursor += len;

            // Zero-copy rkyv extraction
            let archived_log =
                unsafe { rkyv::access_unchecked::<<OpLog as rkyv::Archive>::Archived>(payload) };
            let text = archived_log.state.text.as_str();
            let ns = archived_log.state.namespace.as_str();

            if let Some(filter) = namespace_filter {
                if !filter.is_empty() && filter != ns {
                    continue;
                }
            }

            //  SIMD-accelerated search over the exact text slice
            if ac.is_match(text) {
                results.push(VaultSearchResult {
                    agent_hex: hex::encode(archived_log.state.agent_id.unwrap()),
                    tx_id: archived_log.state.transaction_id.into(),
                    namespace: archived_log.state.namespace.to_string(),
                    payload: text.to_string(),
                    timestamp: archived_log.state.timestamp.to_string(),
                    source: "HOT_WAL".to_string(),
                    similarity_score: 1.0,
                });
            }
        }
        results.reverse();
        Ok(results)
    }

    /// Returns the exact number of uncompacted thoughts currently in the Hot WAL. O(1) operation utilizing the BTreeMap index
    pub fn get_pending_count(&self) -> usize {
        self.index.read().unwrap().len()
    }

    /// Scans the raw WAL file to find the highest TxID it contains.
    /// Executes syncronously during the OS Bootstrap phase.
    pub fn get_highest_tx_id(&self, file_path: &str) -> u128 {
        let mut file = match std::fs::File::open(file_path) {
            Ok(f) => f,
            Err(_) => {
                println!(
                    "[WAL] No existing WAL found at {}. Starting fresh. ",
                    file_path
                );
                return 0;
            }
        };

        let mut highest_tx: u128 = 0;
        let mut len_buf = [0u8; 4];

        // PHYSICS: Iterate throught the append-only binary log.
        while file.read_exact(&mut len_buf).is_ok() {
            let payload_len = u32::from_le_bytes(len_buf) as usize;
            let mut payload = vec![0u8; payload_len];

            if file.read_exact(&mut payload).is_err() {
                eprintln!("[WAL WARNING] Corrupted trailing bytes detected. Truncation required. ");
                break;
            }

            // Bounds-checked zero-copy pointer access
            if let Ok(archived_log) =
                rkyv::access::<<OpLog as rkyv::Archive>::Archived, rkyv::rancor::Error>(&payload)
            {
                let tx_id = archived_log.state.transaction_id.to_native();

                if tx_id > highest_tx {
                    highest_tx = tx_id;
                }
            }
        }

        highest_tx
    }

    pub fn fetch_hot_timeline(
        &self,
        agent_hex: &str,
        wal_path: &str,
    ) -> Result<Vec<TimelineNode>, anyhow::Error> {
        let mut nodes = Vec::new();

        let file = match File::open(wal_path) {
            Ok(f) => f,
            Err(_) => return Ok(nodes),
        };

        // Page WAL into memory
        let mmap = unsafe { MmapOptions::new().map(&file)? };
        let mut cursor = 0;
        let target_bytes = hex::decode(agent_hex).unwrap_or(vec![0; 16]);

        while cursor < mmap.len() {
            if cursor + 4 > mmap.len() {
                break;
            }

            let len = u32::from_le_bytes(mmap[cursor..cursor + 4].try_into().unwrap()) as usize;
            cursor += 4;

            let payload = &mmap[cursor..cursor + len];
            cursor += len;

            let archived_bytes =
                unsafe { rkyv::access_unchecked::<<OpLog as rkyv::Archive>::Archived>(payload) };

            let current_bytes = archived_bytes.agent_id;

            if current_bytes.as_slice() == target_bytes.as_slice() {
                let native_status = rkyv::deserialize::<AgentStatus, rkyv::rancor::Error>(
                    &archived_bytes.state.status,
                )
                .unwrap();

                nodes.push(TimelineNode {
                    tx_id: archived_bytes.state.transaction_id.into(),
                    timestamp: archived_bytes.state.timestamp.to_string(),
                    agent_status: format!("{:?}", native_status),
                    payload_preview: archived_bytes.state.text.to_string(),
                });
            }
        }

        Ok(nodes)
    }
}
