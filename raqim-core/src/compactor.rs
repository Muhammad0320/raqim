use crate::{OpLog, SystemEvent, lancedb_store::LanceEngine, nucleus::WalCommand};
use rkyv::Archive;
use std::{
    fs::{self, File},
    io::Read,
    sync::Arc,
};
use tokio::{
    sync::{broadcast::Sender, mpsc, oneshot},
    time::{Duration, interval},
};

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
            let mut check_interval = interval(Duration::from_secs(60));
            let mut daily_interval = interval(Duration::from_secs(24 * 60 * 60));

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

    async fn execute_compaction(&self, processing_path: &str) {
        // 1. Lock and Rename WAL (Nucleus will seamlessly create a new one)
        if fs::rename(&self.wal_path, &processing_path).is_err() {
            return;
        }

        // 2. Read the framed bytes from the processing file
        let mut file = match File::open(&processing_path) {
            Ok(f) => f,
            Err(_) => return,
        };

        let mut buffer = Vec::new();
        if file.read_to_end(&mut buffer).is_err() {
            return;
        }

        let mut offset = 0;
        let mut logs_to_archive = Vec::new();
        let mut vector = Vec::new();

        // 3. Zero-copy Framing Extraction
        while offset < buffer.len() {
            if offset + 4 > buffer.len() {
                break;
            }

            let mut len_bytes = [0u8; 4];
            len_bytes.copy_from_slice(&buffer[offset..offset + 4]);
            let entry_len = u32::from_le_bytes(len_bytes) as usize;
            offset += 4;

            let entry_slice = &buffer[offset..offset + entry_len];
            let archived_log =
                unsafe { rkyv::access_unchecked::<<OpLog as Archive>::Archived>(entry_slice) };

            if let Ok(log) = rkyv::deserialize::<OpLog, rkyv::rancor::Error>(archived_log) {
                // Construct the dense semantic string
                let semantic_payload = format!(
                    "[{:?}] Agent in {} stated {}",
                    log.state.status, log.state.namespace, log.state.text
                );

                // Call the Pluggable Embedder ( This is CPU bound, but we're off the TCP path )
                // PATH A
                #[cfg(feature = "native-embedding")]
                {
                    match self.lance_engine.embedder.embed(&semantic_payload).await {
                        Ok(vec_data) => {
                            logs_to_archive.push(log.clone());
                            vector.push(vec_data);
                        }
                        Err(e) => eprintln!(
                            "[COMPACTOR WARNING] Failed to embed TxID {}: {} ",
                            log.state.transaction_id, e
                        ),
                    }
                }

                // Path B:
                #[cfg(feature = "mock-embedding")]
                {
                    let vec_data = vec![0.0f32; 768];
                    logs_to_archive.push(log);
                    vector.push(vec_data);
                }
            }

            offset += entry_len;
        }

        if !logs_to_archive.is_empty() {
            self.lance_engine
                .archive_batch(&logs_to_archive, &vector)
                .await;
            println!("Archived {} thoughts to lanceDB", logs_to_archive.len());
        }

        // 5. Delete the processed file to reclaim disk space
        let _ = fs::remove_file(processing_path);

        let _ = self.tx.send(SystemEvent::CompactionTriggered {
            archived_count: logs_to_archive.len(),
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
