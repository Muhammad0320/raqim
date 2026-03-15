use crate::{OpLog, SystemEvent, lancedb_store::LanceEngine};
use rkyv::Archive;
use std::{
    fs::{self, File},
    io::Read,
    sync::Arc,
};
use tokio::{
    sync::broadcast::Sender,
    time::{Duration, interval},
};

pub struct WalCompactor {
    wal_path: String,
    lance_engine: Arc<LanceEngine>,
    tx: Sender<SystemEvent>,
}

impl WalCompactor {
    pub fn new(wal_path: &str, lance_engine: Arc<LanceEngine>, tx: Sender<SystemEvent>) -> Self {
        Self {
            wal_path: wal_path.to_string(),
            lance_engine,
            tx,
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
                                    self.execute_compaction().await;
                                }
                            }

                        },

                        _ = daily_interval.tick() => {

                            println!("24-hour cycle reached. Routine compaction...");
                            self.execute_compaction().await;
                        },

                }
            }
        });
    }

    async fn execute_compaction(&self) {
        let processing_path = format!("{}.processing", &self.wal_path);

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
                let simulated_vector = vec![0.01_f32; self.lance_engine.dims as usize];

                logs_to_archive.push(log);
                vector.push(simulated_vector);
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
}
