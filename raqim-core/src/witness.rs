use std::{
    format,
    fs::{self, OpenOptions},
    io::Write,
    path::Path,
    println,
    time::{SystemTime, UNIX_EPOCH},
};

use ed25519_dalek::{Signer, SigningKey};
use serde::{Deserialize, Serialize};

use crate::axon::MarkleBatch;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnchoredRootWitness {
    pub batch_id: u64,
    pub namespace: String,
    pub merkle_root_hex: String,
    pub parent_batch_root_hex: String,
    pub leaf_count: usize,
    pub timestamp: u64,
    pub master_signature_hex: String,
}

pub struct WormWitnessEngine {
    witness_dir: String,
    master_signing_key: SigningKey,
    gcp_worm_bucket_url: Option<String>,
}

impl WormWitnessEngine {
    pub fn new(
        witness_dir: &str,
        master_signing_key: SigningKey,
        gcp_worm_bucket_url: Option<String>,
    ) -> Self {
        if !Path::new(witness_dir).exists() {
            let _ = fs::create_dir_all(witness_dir);
        }

        Self {
            witness_dir: witness_dir.to_string(),
            master_signing_key,
            gcp_worm_bucket_url,
        }
    }

    /// ANCHOR BATCH: Signs and Persists Merkle root to immutable WORM storage
    pub async fn anchor_batch(
        &self,
        batch: &MarkleBatch,
    ) -> Result<AnchoredRootWitness, anyhow::Error> {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        let merkle_root_hex = hex::encode(batch.markle_root);
        let parent_root_hex = hex::encode(batch.parent_batch_root);

        // Construct unsigned witness payload
        let unsign_payload = format!(
            "{}:{}:{}:{}:{}",
            batch.batch_id, batch.namespace, merkle_root_hex, parent_root_hex, timestamp
        );

        // Sign root with Master key
        let signature = self.master_signing_key.sign(unsign_payload.as_bytes());
        let signature_hex = hex::encode(signature.to_bytes());

        let witness = AnchoredRootWitness {
            batch_id: batch.batch_id,
            namespace: batch.namespace.clone(),
            merkle_root_hex: merkle_root_hex.clone(),
            parent_batch_root_hex: parent_root_hex.clone(),
            leaf_count: batch.leaves.len(),
            timestamp,
            master_signature_hex: signature_hex,
        };

        // Target 1: Local Append-Only Immutable WORM log
        let witness_file_path = format!("{}/batch_{:08}.json", self.witness_dir, batch.batch_id);
        let json_bytes = serde_json::to_vec_pretty(&witness)?;

        let mut file = OpenOptions::new()
            .create(true)
            .write(true)
            .truncate(true)
            .open(&witness_file_path)?;
        file.write_all(&json_bytes)?;
        file.sync_all()?;

        // Apply Linux Kernel Immutable Attribute
        #[cfg(target_os = "linux")]
        {
            let _ = std::process::Command::new("chattr")
                .arg("+i")
                .arg(&witness_file_path)
                .status();
        }

        println!(
            "[WORM WITNESS] Merkle Root for Batchh #{} anchored to immutable storage: {} ",
            batch.batch_id, merkle_root_hex
        );

        // Target 2: GCP WORM Bucket
        if let Some(bucket_url) = &self.gcp_worm_bucket_url {
            let client = reqwest::Client::new();
            let url = format!("{}/batch_{:08}.json", bucket_url, batch.batch_id);
            let _ = client.put(&url).body(json_bytes).send().await;
        }

        Ok(witness)
    }

    /// Read all anchored witness on boot to verify local db integrity
    pub fn load_anchored_witness(&self) -> Vec<AnchoredRootWitness> {
        let mut witnesses = Vec::new();

        if let Ok(entries) = fs::read_dir(&self.witness_dir) {
            for entry in entries.flatten() {
                if entry.path().extension().and_then(|s| s.to_str()) == Some(".json") {
                    if let Ok(content) = fs::read_to_string(entry.path()) {
                        if let Ok(witness) = serde_json::from_str::<AnchoredRootWitness>(&content) {
                            witnesses.push(witness);
                        }
                    }
                }
            }
        }

        witnesses.sort_by_key(|w| w.batch_id);
        witnesses
    }
}
