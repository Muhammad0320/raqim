use crate::{OpLog, SystemEvent, lancedb_store::LanceEngine, nucleus::WalCommand};
use rkyv::Archive;
use std::{
    eprintln, format,
    fs::{self, File},
    io::Read,
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
    lance_engine: Arc<LanceEngine>,
    tx: Sender<SystemEvent>,
    cmd_tx: mpsc::Sender<WalCommand>,
}

impl WalCompactor {
    pub fn new(
        wal_path: &str,
        lance_engine: Arc<LanceEngine>,
        tx: Sender<SystemEvent>,
        cmd_tx: mpsc::Sender<WalCommand>,
    ) -> Self {
        Self {
            wal_path: wal_path.to_string(),
            lance_engine,
            tx,
            cmd_tx,
        }
    }

    pub fn start_daemon(self) {
        tokio::spawn(async move {
            println!("Bismillah. WAL compactor Daemon Active. Monitoring Disk...");

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
                                    println!("WAL threshold (1GB) breached! Emergency compaction... ");
                                    self.trigger_safe_compaction().await;
                                }
                            }

                        },

                        _ = daily_interval.tick() => {

                            println!("24-hour cycle reached. Routine compaction...");
                            self.trigger_safe_compaction().await;
                        },

                }
            }
        });
    }

    /// Recover and finishes any compaction that failed
    async fn resume_pending_compactions(&self) {
        let manifest_path = "compaction.manifest.json";

        if let Ok(content) = fs::read_to_string(manifest_path) {
            if let Ok(manifest) = serde_json::from_str::<CompactionManifest>(&content) {
                if manifest.state == CompactionState::Pending {
                    println!(
                        "\n[COMPACTOR RECOVERY] Interrupted compaction detected for {}. Resuming LanceDB ingestion...",
                        &manifest.target_file
                    );

                    self.execute_compaction(&manifest.target_file).await;
                }
            }
        }
    }

    /// Internal Helper: Guarants the manifest write is immune to torn page corruption
    fn write_manifest_atomically(path: &str, manifest: &CompactionManifest) {
        let tmp_path = format!("{}.tmp", path);
        let json_data = serde_json::to_string_pretty(manifest).unwrap();
        if fs::write(&temp_path, json_data).is_ok() {
            let _ = fs::rename(&tmp_path, path);
        }
    }

    async fn execute_compaction(&self, processing_path: &str) {
        let manifest_path = "compaction.manifest.json";

        // 2PC State 1: PENDING
        let pending_manifest = CompactionManifest {
            target_file: processing_path.to_string(),
            state: CompactionState::Pending,
        };

        // Atomic write via tmp file rename
        Self::write_manifest_atomically(&manifest_path, &pending_manifest);

        // 1. Read the framed bytes from the processing file
        let mut file = match File::open(&processing_path) {
            Ok(f) => f,
            Err(e) => {
                eprintln!(
                    "[COMPACTOR ERROR] Could not open segemnt {}: {} ",
                    processing_path, e
                );
                return;
            }
        };

        let mut buffer = Vec::new();
        if let Err(e) = file.read_to_end(&mut buffer) {
            eprintln!("[COMPACTOR ERROR] Failed to read segment buffer: {} ", e);
            return;
        }

        let mut offset = 0;
        let mut logs_to_archive: Vec<OpLog> = Vec::new();
        let mut semantic_payloads: Vec<String> = Vec::new();

        // 3. Zero-copy Framing Extraction
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

            match rkyv::access::<<OpLog as Archive>::Archived, rkyv::rancor::Error>(entry_slice) {
                Ok(archived_log) => {
                    if let Ok(log) = rkyv::deserialize::<OpLog, rkyv::rancor::Error>(archived_log) {
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
                &processing_path, "and", &manifest_path
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
    }

    async fn trigger_safe_compaction(&self) {
        // Ask the WAL engine the physically rotate the file and give us the archived filename
        let (reply_tx, reply_rx) = oneshot::channel::<String>();

        // Fire the command to io_uring thread
        if self.cmd_tx.send(WalCommand::Rotate(reply_tx)).await.is_ok() {
            // Wait for the WAL to confirm it has released the file descriptor
            if let Ok(archived_filename) = reply_rx.await {
                println!(
                    "[COMPACTOR] WAL successfully rotated to {}. Compacting to lanceDB...",
                    archived_filename
                );

                // Safe to compact
                self.execute_compaction(&archived_filename).await;

                println!(
                    "[COMPACTOR] Segment {} assimilated and erased. ",
                    archived_filename
                );
            } else {
                eprintln!("[COMPACTOR FATAL] WAL Engine dropped the Rotation Channel ");
            }
        } else {
            eprintln!("[COMPACTOR FATAL] Failed to send Rotate command to WalEngine ");
        }
    }
}
