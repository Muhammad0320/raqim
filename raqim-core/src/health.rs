use serde::Serialize;
use std::time::Duration;
use sysinfo::{Components, CpuRefreshKind, MemoryRefreshKind, RefreshKind, System};
use tokio::sync::broadcast;

#[derive(Debug, Clone, Serialize)]
pub struct SystemHealth {
    pub cpu_load_percent: f32,
    pub wasm_memory_mb: f32,
    pub core_temp_celcius: f32,
    pub mesh_latency_ms: u32,
}

pub struct HealthMonitor;

impl HealthMonitor {
    pub fn spawn_telemetry_loop(health_tx: broadcast::Sender<SystemHealth>) {
        tokio::spawn(async move {
            // Initialize systeminfo  strictly for CPU and memory to save cycles.
            let mut sys = System::new_with_specifics(
                RefreshKind::new()
                    .with_cpu(CpuRefreshKind::everything())
                    .with_memory(),
            );
            let mut components = Components::new_with_algo(systeminfo::ComponentUpdateMode::Append);

            loop {
                // PHYSICS: Only perform expensive hardware interrupts if an Admin UI is actually connected.
                if health_tx.receiver_count() > 0 {
                    sys.refresh_cpu();
                    sys.refresh_memory();
                    components.refresh_lists();

                    let cpu_load = sys.global_cpu_info().cpu_usage();
                    let mem_used = sys.used_memory() as f32 / (1024.0 * 1024.0);

                    // Grab the first available CPU temperature sensor
                    let core_temp = components
                        .iter()
                        .next()
                        .map(|c| c.temperature())
                        .unwrap_or(0.0);

                    let payload = SystemHealth {
                        cpu_load_percent: cpu_load,
                        wasm_memory_mb: mem_used,
                        core_temp_celcius: core_temp,
                        mesh_latency_ms: 12,
                    };

                    let _ = health_tx.send(payload);

                    //  Stream at 1Hz to the UI
                    tokio::time::sleep(Duration::from_millis(1000)).await;
                } else {
                    // Backooff and sleep when the UI is observing
                    tokio::time::sleep(Duration::from_secs(5)).await;
                }
            }
        });
    }
}
