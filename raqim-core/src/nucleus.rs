use std::{
    collections::BTreeMap,
    sync::{Arc, RwLock},
    thread,
};

use crate::{OpLog, memory_router::MemoryRouter};
use rkyv::to_bytes;
use tokio::sync::mpsc;
use tokio_uring::fs::OpenOptions;

pub struct WalEngine {
    sender: mpsc::Sender<OpLog>,
    // The O(1) INDEX: Maps TxID -> Physical byte offset in the WAL.
    pub index: Arc<RwLock<BTreeMap<u64, u64>>>,
}

impl WalEngine {
    pub async fn start(file_path: String) -> Self {
        println!("Bismillah. Booting io_uring Nucleus WAL Engine on dedicated OS thread...");

        // Bounded channel to prevent OOM crashes
        let (tx, mut rx) = mpsc::channel::<OpLog>(100_000);

        let index = Arc::new(RwLock::new(BTreeMap::new()));
        let index_clone = index.clone();

        // 1. We spawn a physical OS thread entirely dedicated to the Hard Drive
        thread::spawn(move || {
            // 2. We boot the io_uring runtime inside this specific thread
            tokio_uring::start(async move {
                let file = OpenOptions::new()
                    .create(true)
                    .read(true)
                    .write(true)
                    .open(&file_path)
                    .await
                    .expect("Failed to open io_uring WAL file");

                // io_uring requires explicit offsets. We can't just "append".
                // We must query the OS for the current file_size to know where to start writing.
                let metadata = std::fs::metadata(&file_path).expect("Failed to stat WAL file");
                let mut current_offset = metadata.len();

                let mut batch = Vec::new();

                loop {
                    // Wait for the first thought to arrive.
                    if let Some(log) = rx.recv().await {
                        batch.push(log);

                        // Drain the channel of any other pending thoughts for batching
                        while let Ok(log) = rx.try_recv() {
                            batch.push(log);
                        }

                        // Record the offset for the first tx_id in this batch
                        let first_txid = batch[0].state.transaction_id;
                        {
                            let mut idx = index_clone.write().unwrap();
                            idx.insert(first_txid, current_offset);
                        }

                        // Zero-copy serialize the entire batch instantly
                        let bytes = to_bytes::<rkyv::rancor::Error>(&batch)
                            .expect("Failed to serrialize batch")
                            .into_vec();

                        // Frame it: Calculate the 4-byte length prefix (Little Endian format)
                        let len_prefix = (bytes.len() as u32).to_le_bytes().to_vec();

                        //  --- THE LINE-BY-LINE PHYSICS OF IO_URING ---

                        // We pass OWNERSHIP of the  `len_prefix` to the kernel
                        let (res, _returnerd_len_buf) =
                            file.write_at(len_prefix, current_offset).await;
                        let written_len = res.expect("WAL length write Error") as u64;
                        current_offset += written_len;

                        // We pass the OWNERSHIP of the `payload` to the kernel
                        let (res, _returnerd_payload_buf) =
                            file.write_at(bytes, current_offset).await;
                        let written_payload = res.expect("WAL paylaod write error") as u64;
                        current_offset += written_payload;

                        // 5. Force to metal (fsync).
                        if let Err(e) = file.sync_data().await {
                            eprintln!("WAL io_uring Sync Error: {}", e);
                        }

                        batch.clear();
                    } else {
                        // The channel is closed the daemon is shutting down
                        break;
                    }
                }
            });
        });

        Self { sender: tx, index }
    }

    /// Fire and forget. The TCP/Agent networking layer NEVER blocks here.
    pub async fn append(&self, log: OpLog) {
        let _ = self.sender.send(log).await;
    }

    /// Scans the raw WAL file to find the highest TxID it contains.
    pub fn get_highest_tx_id(&self, file_path: &str) -> u64 {
        let mut highest = 0;
        let file = match std::fs::File::open(file_path) {
            Ok(f) => f,
            Err(_) => return 0,
        };

        0
    }
}
