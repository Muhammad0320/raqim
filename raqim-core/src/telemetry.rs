use std::{
    sync::{
        Arc,
        atomic::{AtomicU64, Ordering},
    },
    time::{SystemTime, UNIX_EPOCH},
};

use reqwest::{Client, StatusCode};
use tokio::{fs::OpenOptions, io::AsyncWriteExt};

// The lock free memory counter. Zero impact on the hot path.
pub struct TelemetryEngine {
    pub tenant_id: String,
    pub licence_key: String,
    pub crdt_merges: AtomicU64,
    pub a2a_bytes_routed: AtomicU64,
    pub time_travel_queries: AtomicU64,
}

impl TelemetryEngine {
    pub fn new(tenant_id: &str, licence_key: &str) -> Arc<Self> {
        Arc::new(Self {
            tenant_id: tenant_id.to_string(),
            licence_key: licence_key.to_string(),
            crdt_merges: AtomicU64::new(0),
            a2a_bytes_routed: AtomicU64::new(0),
            time_travel_queries: AtomicU64::new(0),
        })
    }

    /// 0(1) Lock-free increments called directly by the OS subsystems.
    pub fn record_crdt_merge(&self) {
        self.crdt_merges.fetch_add(1, Ordering::Relaxed);
    }
    pub fn record_a2a_bytes(&self, bytes: u64) {
        self.a2a_bytes_routed.fetch_add(bytes, Ordering::Relaxed);
    }
    pub fn record_time_travel(&self) {
        self.time_travel_queries.fetch_add(1, Ordering::Relaxed);
    }

    /// Starts the isolated OS background thread for resilient billing
    pub fn start_sinker_daemon(engine: Arc<Self>) {
        tokio::spawn(async move {
            let client = Client::new();
            let mut interval = tokio::time::interval(std::time::Duration::from_secs(60));

            // We open the local billing WAL in append-only mode to survive network outages.
            let mut billing_wal = OpenOptions::new()
                .create(true)
                .append(true)
                .open("production.billing.wal")
                .await
                .expect("Failed to open billing WAL");

            loop {
                interval.tick().await;

                // 1. Swap the current counter to 0. This ensures we never double-count even if the thread lags.
                let crdt_merges = engine.crdt_merges.swap(0, Ordering::SeqCst);
                let a2a_bytes = engine.a2a_bytes_routed.swap(0, Ordering::SeqCst);
                let time_travels = engine.time_travel_queries.swap(0, Ordering::SeqCst);

                if crdt_merges == 0 && a2a_bytes == 0 && time_travels == 0 {
                    continue;
                }

                let timestamp = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs();

                // 2. Construct the Stripe-compatible JSON payload
                let payload = format!(
                    r#"{{"tenant": "{}", "timestamp": {}, "crdt_merges": {}, "a2a_bytes": {}, "time_travels": {}   }}"#,
                    engine.tenant_id, timestamp, crdt_merges, a2a_bytes, time_travels
                );
                // 3. Persistence first: Write to local-disk before attempting network
                let log_entry = format!("{}\n", payload);
                if let Err(e) = billing_wal.write_all(log_entry.as_bytes()).await {
                    eprintln!("[TELEMETRY FATAL] Failed to write to biling wal: {} ", e);
                    continue; // 
                }

                let _ = billing_wal.sync_data().await;

                // Read the entire WAL file For it might contain failed batches
                let pending_data = tokio::fs::read_to_string("production.billing.wal")
                    .await
                    .unwrap_or_default();

                // 4. Ship to Cloud: Send the usage data to Raqim cloud API
                let res = client
                    .post("https://api.Raqim.cloud/v1/metering/injest")
                    .header("Authorization", format!("Bearer {}", engine.licence_key))
                    .header("Content-Type", "application/x-ndjson") // NDJSON for multiple lines
                    .body(pending_data)
                    .send()
                    .await;

                match res {
                    Ok(r) if r.status().is_success() => {
                        println!("[TELEMETRY] Successfully synced 60s usage to Raqim cloud");
                        billing_wal
                            .set_len(0)
                            .await
                            .expect("Failed to truncate billing WAL");

                        // THE ROLLING LICENSE HOT-SWAP
                        if let Ok(json_resp) = r.json::<serde_json::Value>().await {
                            if let Some(new_jwt) =
                                json_resp.get("new_license").and_then(|v| v.as_str())
                            {
                                println!(
                                    "[SYSTEM] Received rolling license renewal. Hot-swapping..."
                                );

                                //
                            }
                        }
                    }

                    Ok(r) if r.status() == reqwest::StatusCode::PAYMENT_REQUIRED => {
                        // The DEAD-MAN'S SWITCH
                        eprintln!(
                            "[FATAL] Raqim Cloud returned 402 PAYMENT REQUIRED. License Revoked "
                        );
                        eprintln!("[FATAL] initiating Downgrade to Open Core... ")
                    }

                    _ => {
                        eprintln!(
                            "[TELEMETRY WARNING] Cloud API unreachable. Data safely preserved in billing.wal for next retry."
                        );
                    }
                }
            }
        });
    }
}
