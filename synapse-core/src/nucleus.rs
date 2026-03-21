use std::thread;

use crate::OpLog;
use rkyv::to_bytes;
use tokio::sync::mpsc;
use tokio_uring::fs::OpenOptions;

pub struct WalEngine {
    sender: mpsc::Sender<OpLog>,
}

impl WalEngine {
    pub async fn start(file_path: &str) -> Self {
        println!("Bismillah. Booting io_uring Nucleus WAL Engine on dedicated OS thread...");

        // Bounded channel to prevent OOM crashes
        let (tx, mut rx) = mpsc::channel::<OpLog>(100_000);

        // 1. We spawn a physical OS thread entirely dedicated to the Hard Drive
        thread::spawn(move || {
            // 2. We boot the io_uring runtime inside this specific thread
            tokio_uring::start(async move {
                let mut file = OpenOptions::new()
                    .create(true)
                    .read(true)
                    .write(true)
                    .open(&file_path)
                    .await
                    .expect("Failed to open io_uring WAL file");

                // io_uring requires explicit offsets. We can't just "append".
                // We must query the OS for the current file_size to know where ti start writing.
                let stat = file.statx().await.expect(" Failed to stat WAL file ");
                let current_offset = stat.stx_size;

                let mut batch = Vec::new();

                loop {
                    // Wait for the first thought to arrive.
                    if let Some(log) = rx.recv().await {
                        batch.push(log);

                        // Drain the channel of any other pending thoughts for batching
                        while let Ok(log) = rx.try_recv() {
                            batch.push(log);
                        }

                        // Zero-copy serialize the entire batch instantly
                        let bytes = to_bytes::<rkyv::rancor::Error>(&batch)
                            .expect("Failed to serrialize batch")
                            .into_vec();

                        // Frame it: Calculate the 4-byte length prefix (Little Endian format)
                        let len_prefix = (bytes.len() as u32).to_le_bytes();

                        //  --- THE LINE-BY-LINE PHYSICS OF IO_URING ---

                        // We pass OWNERSHIP of the  `len_prefix` to the kernel
                        let (res, _returnerd_len_buf) = file.write_at(len_prefix, current_offset);
                        let written_len = res.expect("WAL length write Error") as u64;
                        current_offset += written_len;

                        // We pass the OWNERSHIP of the `payload` to the kernel
                        let (res, _returnerd_payload_buf) = file.write_at(bytes, current_offset);
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

        Self { sender: tx }
    }

    /// Fire and forget. The TCP/Agent networking layer NEVER blocks here.
    pub async fn append(&self, log: OpLog) {
        let _ = self.sender.send(log).await;
    }
}
