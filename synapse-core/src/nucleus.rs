use tokio::sync::mpsc;
use tokio::fs::OpenOptions;
use tokio::io::AsyncWriteExt;
use rkyv::to_bytes;
use crate::OpLog;


pub  struct WalEngine {

    sender: mpsc::Sender<OpLog>

}

impl WalEngine {

    pub async fn start(file_path: &str) -> Self {

        let (tx, mut rx) = mpsc::channel::<OpLog>(100_000);
        
        let mut file = OpenOptions::new().create(true)
                .append(true).open(file_path).await.expect("Failed to open WAL file");

        tokio::spawn(async move {

            let mut batch = Vec::new();

            loop {

                // Wait for the first thought.
                if let Some(log) = rx.recv().await {

                    batch.push(log);

                while let Ok(log) = rx.try_recv() {
                    batch.push(log);
                }

                // Zero-copy serialize the entire batch instantly
                let bytes = to_bytes::<rkyv::rancor::Error>(&batch).expect("Failed to serrialize batch");

                // 1. Write to the OS buffer
                if let Err(e) = file.write_all(&bytes).await {
                    eprintln!("EAL Write Error: {}", e); 
                    continue;
                }

                // 2. Force to metal (The durability guarrantee)
                if let Err(e) = file.sync_data().await {
                    eprintln!("WAL sync Error: {}", e); 
                    continue;
                }

                batch.clear();
                } 

            }

        });

        Self {sender: tx} 

    }

    /// Fire and forget. The agent Never blocks here.
    pub async fn append(&self, log: OpLog) {

        let _ = self.sender.send(log).await;

    }

}