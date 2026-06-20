use std::{
    sync::{
        Arc, RwLock,
        atomic::{AtomicU64, Ordering},
    },
    time::{SystemTime, UNIX_EPOCH},
};

use reqwest::Client;
use tokio::{fs::OpenOptions, io::AsyncWriteExt, sync::broadcast};

use crate::SystemEvent;

// The lock free memory counter. Zero impact on the hot path.
pub struct TelemetryEngine {
    pub tenant_id: String,

    pub license_key: RwLock<String>,
    pub crdt_merges: AtomicU64,
    pub a2a_bytes_routed: AtomicU64,
    pub time_travel_queries: AtomicU64,
}

impl TelemetryEngine {
    pub fn new(tenant_id: &str, license: &str) -> Arc<Self> {
        Arc::new(Self {
            tenant_id: tenant_id.to_string(),
            license_key: RwLock::new(license.to_string()),
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
        // Execute the outside loop inside a dedicated background worker
        tokio::task::spawn_blocking(move || {
            // Initialize a private, single-threaded basic runtime exclusively to run the billing sink out-of-band.
            let rt = tokio::runtime::Builder::new_current_thread()
                .enable_all()
                .build()
                .unwrap();

            rt.block_on(async move {
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
                let current_jwt = engine.license_key.read().unwrap().clone();

                // 4. Ship to Cloud: Send the usage data to Raqim cloud API
                let res = client
                    .post("https://api.Raqim.cloud/v1/metering/injest")
                    .header("Authorization", format!("Bearer {}", current_jwt))
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
                    }

                    _ => {
                        eprintln!(
                            "[TELEMETRY WARNING] Cloud API unreachable. Data safely preserved in billing.wal for next retry."
                        );
                    }
                }
            }
        });
        });
    }

    /// The Highly isolated 24-hour cryptographic heartbeat
    pub fn start_heartbeat_daemon(engine: Arc<Self>, event_tx: broadcast::Sender<SystemEvent>) {
        tokio::spawn(async move {
            let client = reqwest::Client::new();

            let mut interval = tokio::time::interval(std::time::Duration::from_secs(86_400));

            loop {
                interval.tick().await;

                let current_jwt = engine.license_key.read().unwrap().clone();

                let res = client
                    .get("https://api.raqim.cloud/v1/system/heartbeat")
                    .header("Authorization", format!("Bearer {}", current_jwt))
                    .send()
                    .await;

                match res {
                    Ok(r) if r.status().is_success() => {
                        if let Ok(json_res) = r.json::<serde_json::Value>().await {
                            if let Some(new_jwt) = json_res
                                .get("new_license")
                                .and_then(|v: &serde_json::Value| v.as_str())
                            {
                                println!("[SYSTEM] 24h Heartbeat: Rolling license renewed.");

                                // In-Memory Hot swap
                                *engine.license_key.write().unwrap() = new_jwt.to_string();

                                // Persistence ( Zero-Destruction Ttoml Edit )
                                let toml_str = tokio::fs::read_to_string("raqim.toml")
                                    .await
                                    .unwrap_or_default();
                                if let Ok(mut doc) = toml_str.parse::<toml_edit::DocumentMut>() {
                                    doc["license_key"] = toml_edit::value(new_jwt);
                                    let _ = tokio::fs::write("raqim.toml", doc.to_string()).await;
                                }

                                // FIRE SYSTEM EVENT (wake up zenoh/argis to apply new claims)
                                let _ = event_tx.send(SystemEvent::LicenseUpdated {
                                    new_jwt: new_jwt.to_string(),
                                });
                            }
                        }
                    }

                    Ok(r) if r.status() == reqwest::StatusCode::PAYMENT_REQUIRED => {
                        eprintln!(
                            "[FATAL] Heartbeat returned 402. Stripe Invoice failed. Grace period exceeded."
                        );

                        //  We set it to the Open Core JWT the Cloud provided.
                        if let Ok(json_res) = r.json::<serde_json::Value>().await {
                            if let Some(fallback_jwt) =
                                json_res.get("new_license").and_then(|v| v.as_str())
                            {
                                // Clear the JWT from RAM safely
                                *engine.license_key.write().unwrap() = fallback_jwt.to_string();

                                // Erase it from disc config so it doesn't try to boot with a dead key
                                let toml_str = tokio::fs::read_to_string("raqim.toml")
                                    .await
                                    .unwrap_or_default();
                                if let Ok(mut doc) = toml_str.parse::<toml_edit::DocumentMut>() {
                                    doc["license_key"] = toml_edit::value(fallback_jwt);
                                    let _ = tokio::fs::write("raqim.toml", doc.to_string()).await;
                                }
                                let _ = event_tx.send(SystemEvent::LicenseUpdated {
                                    new_jwt: fallback_jwt.to_string(),
                                });
                            }
                        }
                    }

                    _ => {
                        eprintln!(
                            "[WARNING] Heartbeat failed to reach Cloud. OS survives until JWT expiration."
                        );
                    }
                }
            }
        });
    }
}

