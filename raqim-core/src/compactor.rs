use crate::{OpLog, SystemEvent, lancedb_store::LanceEngine, nucleus::WalCommand};
use rkyv::Archive;
use std::{
    eprintln, format,
    fs::{self, File},
    io::Read,
    path::Path,
    println,
    sync::Arc,
};
use tokio::{
    sync::{broadcast::Sender, mpsc, oneshot},
    time::{Duration, Instant, interval_at},
};

// The 2pc state machine defining the boundary btw Hot WAL and cold lance db
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
pub enum CompactionState {
    Pending,
    Committed,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CompactionManifest {
    pub target_file: String,
    pub state: CompactionState,
}

pub struct WalCompactor {
    wal_path: String,
    manifest_path: String,
    lance_engine: Arc<LanceEngine>,
    tx: Sender<SystemEvent>,
    cmd_tx: mpsc::Sender<WalCommand>,
}

impl WalCompactor {
    pub fn new(
        wal_path: &str,
        manifest_path: &str,
        lance_engine: Arc<LanceEngine>,
        tx: Sender<SystemEvent>,
        cmd_tx: mpsc::Sender<WalCommand>,
    ) -> Self {
        Self {
            wal_path: wal_path.to_string(),
            manifest_path: manifest_path.to_string(),
            lance_engine,
            tx,
            cmd_tx,
        }
    }

    /// Recover and finalizes any compaction that failed mid-flight
    pub async fn resume_pending_compactions(&self) {
        if let Some(manifest) = Self::read_manifest(&self.manifest_path) {
            match manifest.state {
                CompactionState::Pending => {
                    println!(
                        "[COMPACTOR RECOVERY] Interrupted PENDING compaction detected for '{}'. Resuming LanceDB ingestion...",
                        manifest.target_file
                    );

                    if Path::new(&manifest.target_file).exists() {
                        self.execute_compaction(&manifest.target_file).await;
                    } else {
                        Self::clear_manifest(&self.manifest_path);
                    }
                }

                CompactionState::Committed => {
                    println!(
                        "[COMPACTOR RECOVERY] Interrupted COMMITTED compaction detected for '{}'. Purging ghost WAL segment...",
                        manifest.target_file
                    );

                    if Path::new(&manifest.target_file).exists() {
                        let _ = fs::remove_file(&manifest.target_file);
                    }

                    Self::clear_manifest(&self.manifest_path);
                }
            }
        }
    }

    /// Guarantees the manifest write is immune to torn page corruption
    fn write_manifest_atomically(path: &str, manifest: &CompactionManifest) {
        let temp_path = format!("{}.tmp", path);
        let json_data = serde_json::to_string_pretty(manifest).unwrap();
        if fs::write(&temp_path, json_data).is_ok() {
            let _ = fs::rename(&temp_path, path);
        }
    }

    /// Read an existing manifest safely on boot
    pub fn read_manifest(manifest_path: &str) -> Option<CompactionManifest> {
        if Path::new(manifest_path).exists() {
            if let Ok(content) = fs::read_to_string(manifest_path) {
                if let Ok(manifest) = serde_json::from_str::<CompactionManifest>(&content) {
                    return Some(manifest);
                }
            }
        }

        None
    }

    pub fn clear_manifest(manifest_path: &str) {
        if Path::new(manifest_path).exists() {
            let _ = fs::remove_file(manifest_path);
        }
    }

    /// Starts the background compactor daemon with 2PC crash recovery on boot
    pub fn start_daemon(self: Arc<Self>) {
        tokio::spawn(async move {
            println!("[COMPACTOR] Booting Autonomous 2PC WAL Compactor Daemon... ");

            // CRASH RECOVERY: Resume any compaction interrupted by prior OS crashes
            self.resume_pending_compactions().await;

            let one_gb: u64 = 1024 * 1024 * 1024;
            let mut check_interval = interval_at(
                Instant::now() + Duration::from_secs(60),
                Duration::from_secs(60),
            );
            let mut daily_interval = interval_at(
                Instant::now() + Duration::from_secs(24 * 60 * 60),
                Duration::from_secs(24 * 60 * 60),
            );

            loop {
                tokio::select! {

                    _ = check_interval.tick() => {

                            if let Ok(metadata) = fs::metadata(&self.wal_path) {
                                if metadata.len() >= one_gb {
                                    println!("[COMPACTOR] WAL size threshold (1GB) breached! Triggering compaction... ");
                                    let _ = self.trigger_safe_compaction().await;
                                }
                            }

                        },

                        _ = daily_interval.tick() => {

                            println!("[COMPACTOR] 24-hour maintenance cycle reached. Triggering routine compaction...");
                            let _ = self.trigger_safe_compaction().await;
                        },

                }
            }
        });
    }

    /// Executes on-demand or automated safe WAL rotatiton and LanceDB assimilation
    async fn trigger_safe_compaction(&self) -> Result<usize, anyhow::Error> {
        // Ask the WAL engine to rotate the file and give us the archived filename
        let (reply_tx, reply_rx) = oneshot::channel::<String>();

        // Dispatch rotation barrier to the WAL engine
        self.cmd_tx
            .send(WalCommand::Rotate(reply_tx))
            .await
            .map_err(|e| anyhow::anyhow!("Failed to send Rotate Command to WalEngine: {}", e))?;

        // Wait for the WAL worker to seal, rename and release the active file
        let archived_filename = reply_rx
            .await
            .map_err(|_| anyhow::anyhow!("WalEngine dropped the rotation reply channel "))?;

        println!(
            "[COMPACTOR] WAL rotated to '{}'. Executing 2PC LanceDB assimilation... ",
            archived_filename.clone()
        );

        // Ingest the rotates segment into lanceDB
        let count = self.execute_compaction(&archived_filename).await;

        println!(
            "[COMPACTOR] Segment '{}' successfully assimilated ({} thoughts archived) ",
            archived_filename, count
        );

        Ok(count)
    }

    /// The 2PC Ingestion Engine: Decode batches, embed text, archives to LanceDB, and clean up
    async fn execute_compaction(&self, processing_path: &str) -> usize {
        // 2PC State 1: write PENDING manifest
        let pending_manifest = CompactionManifest {
            target_file: processing_path.to_string(),
            state: CompactionState::Pending,
        };

        // Atomic write via tmp file rename
        Self::write_manifest_atomically(&self.manifest_path, &pending_manifest);

        //  Read the framed bytes from the processing file
        let mut file = match File::open(&processing_path) {
            Ok(f) => f,
            Err(e) => {
                eprintln!(
                    "[COMPACTOR ERROR] Could not open segmnt '{}': {}",
                    processing_path, e
                );
                return 0;
            }
        };

        let mut buffer = Vec::new();
        if let Err(e) = file.read_to_end(&mut buffer) {
            eprintln!("[COMPACTOR ERROR] Failed to read segment buffer: {} ", e);
            return 0;
        }

        let mut offset = 0;
        let mut logs_to_archive: Vec<OpLog> = Vec::new();
        let mut semantic_payloads: Vec<String> = Vec::new();
        let aligned_buf = rkyv::util::AlignedVec::<16>::new();

        // 16-Byte Aligned Batchh Parser with CRC32 Verification
        while offset < buffer.len() {
            if offset + 4 > buffer.len() {
                break;
            }

            let mut len_bytes = [0u8; 4];
            len_bytes.copy_from_slice(&buffer[offset..offset + 4]);
            let entry_len = u32::from_le_bytes(len_bytes) as usize;
            offset += 4;

            // Skip Over the 4-byte CRC32 header
            if offset + 4 > buffer.len() {
                break;
            }
            offset += 4;

            let entry_slice = &buffer[offset..offset + entry_len];

            match rkyv::access::<<Vec<OpLog> as Archive>::Archived, rkyv::rancor::Error>(
                entry_slice,
            ) {
                Ok(archived_log) => {
                    if let Ok(log) =
                        rkyv::deserialize::<Vec<OpLog>, rkyv::rancor::Error>(archived_log)
                    {
                        let payload = format!(
                            "[{:?}] Agent in {} stated {}",
                            log.state.status, log.state.namespace, log.state.text
                        );

                        logs_to_archive.push(log);
                        semantic_payloads.push(payload);
                    }
                }

                Err(e) => {
                    eprintln!(
                        "[COMPACTOR ERROR] Corrupted log frame at offset {}: {} ",
                        offset, e
                    );
                }
            }

            offset += entry_len;
        }

        if logs_to_archive.is_empty() {
            println!(
                "[COMPACTOR] SEGMENT {} contained zero valid logs. Removing. ",
                &processing_path,
            );
            let _ = fs::remove_file(processing_path);
            let _ = fs::remove_file(manifest_path);
            return;
        }

        // High throughput batch vector embedding
        let vectors = match self
            .lance_engine
            .embedder
            .embed_batch(&semantic_payloads)
            .await
        {
            Ok(vecs) => vecs,
            Err(e) => {
                // Prevent amnesia: If embedding fails, the wal file is not deleted
                eprintln!(
                    "[COMPACTOR CRITICAL ERROR] Batch embedding failed for segment {}: {}. Segment preserved for retry.",
                    processing_path, e
                );
                return;
            }
        };

        // extract max tx_id
        let max_compacted_tx = logs_to_archive
            .iter()
            .map(|l| l.state.transaction_id)
            .max()
            .unwrap_or(0);

        self.lance_engine
            .archive_batch(&logs_to_archive, &vectors)
            .await;

        // 2PC State 2: COMMITTED
        let commited_manifest = CompactionManifest {
            target_file: processing_path.to_string(),
            state: CompactionState::Committed,
        };
        Self::write_manifest_atomically(&manifest_path, &commited_manifest);

        println!(
            "[COMPACTOR] Successfully archived {} thoughts from {} to lanceDB.",
            logs_to_archive.len(),
            processing_path
        );

        if let Err(e) = fs::remove_file(processing_path) {
            eprintln!(
                "[COMPACTOR WARRNING] Failed to remove processed WAL segment {}: {} ",
                processing_path, e
            );
        }
        let _ = fs::remove_file(manifest_path);

        let _ = self.tx.send(SystemEvent::CompactionTriggered {
            archived_count: logs_to_archive.len(),
            max_compacted_tx,
        });

        0
    }
}
