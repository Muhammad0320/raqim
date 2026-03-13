use clap::Parser;
use std::fs;
use std::sync::Arc;
use std::sync::atomic::AtomicU64;
use synapse_core::axon::AxonGateKeeper;
use synapse_core::compactor::WalCompactor;
use synapse_core::cortex::{CortexDataPlane, listen_for_local_thoughts};
use synapse_core::lancedb_store::LanceEngine;
use synapse_core::network::GlobalNetworkBridge;
use synapse_core::nucleus::WalEngine;
use synapse_core::sandbox::WasmEngine;
use synapse_core::state::SwarmState;
use synapse_core::{AgentState, execute_synapse_cascade};
use tokio::io::AsyncReadExt;
use tokio::net::TcpListener;
use tokio::sync::mpsc;

/// Synapse Daemon: The Agentic Control Plane
#[derive(Parser, Debug, Clone)]
#[command(author, version, about)]
struct DameonConfig {
    /// The namespace for this specific agent swarm
    #[arg(short, long, env = "SYNAPSE_SWARM_TOPIC")]
    topic: String,

    /// Path to append-only wal file.
    #[arg(short, long, env = "SYNAPSE_WAL_PATH")]
    wal_path: String,

    /// Port for local python agent to connect to
    #[arg(short, long, default_value_t = 8080)]
    port: u16,
}

#[tokio::main]
async fn main() {
    let config = DameonConfig::parse();
    println!(
        "Bismillah. Booting Synapse Daemon on port {}...",
        config.port
    );

    // 1. BOOT SEQUENCE: INIITIALIZE ALL LAYERS (Wrapped in Arc for fearless concurrency)
    let brain = Arc::new(SwarmState::new(&config.topic));
    let axon = Arc::new(AxonGateKeeper::new());
    let wal = Arc::new(WalEngine::start(&config.wal_path).await);
    let global_net = Arc::new(GlobalNetworkBridge::new(&config.topic).await);
    let lance_engine = Arc::new(
        LanceEngine::new(
            &format!("{}_semantic.lancedb", &config.topic),
            "agent_history",
            384,
        )
        .await,
    );
    let wasm_engine = Arc::new(WasmEngine::new());
    let tx_counter = Arc::new(AtomicU64::new(1));

    // The Autonomous compactor (WAL reaper)
    let compactor = WalCompactor::new(&config.wal_path, lance_engine.clone());
    compactor.start_daemon();

    // The Local cortex actor
    let topic_clone = &config.topic;
    listen_for_local_thoughts(topic_clone.to_string(), brain.clone(), axon.clone());

    // Channel to talk to the publisher safely accross threads
    let (cortex_tx, mut cortex_rx) = mpsc::unbounded_channel::<Vec<u8>>();

    let topic_clone = config.topic.clone();

    // The WASM plugign Orchestrator
    let plugin_dir = "./plugins";
    fs::create_dir_all(plugin_dir).expect("Failed to create plugins dir");

    let w_brain = brain.clone();
    let w_axon = axon.clone();
    let w_wal = wal.clone();
    let w_cortex_tx = cortex_tx.clone();
    let w_global_net = global_net.clone();
    let w_wasm_engine = wasm_engine.clone();
    let w_tx_couter = tx_counter.clone();

    // Spawns a dedicated background thread to monitor the plugins folder
    tokio::spawn(async move {
        println!(
            "WASM Orchestratoro monitoring {} for a new edge plugins...",
            plugin_dir
        );
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(10));

        loop {
            interval::tick().await;

            if let Ok(entries) = fs::read_dir(plugin_dir) {
                for entry in entries.flatten() {
                    let path = entry.path();

                    // If a new .wasm file is found we execute it.
                    if path.extension().and_then(|s| s.to_str()) == Some("wasm") {
                        println!("Discovered a new WASM Plugin: {:?}", path);

                        let wasm_bytes = fs::read(&path).unwrap();

                        // We must clone the layers for the specific execution
                        let a_clone = w_axon.clone();
                        let b_clone = w_brain.clone();
                        let w_clone = w_wal.clone();
                        let c_clone = w_cortex_tx.clone();
                        let g_clone = w_global_net.clone();
                        let t_clone = w_tx_couter.clone();

                        // Execute the untrusted logic in the WASM cage
                        if let Err(e) = w_wasm_engine.execute_agent(
                            &wasm_bytes,
                            b_clone,
                            a_clone,
                            w_clone,
                            c_clone,
                            g_clone,
                            t_clone,
                        ) {
                            eprintln!("Plugin {:?} trapped/failed: {} ", &path, e);
                        }

                        // Rename this file again so we don't execute it again in the next loop
                        let mut new_path = path.clone();
                        new_path.set_extension("wasm.running");
                        let _ = fs::rename(&path, new_path);

                        // Move the processed files into an archive folder
                        let archive_dir = "./plugins_archive";
                        fs::create_dir_all(archive_dir);

                        let file_name = path.file_name().unwrap();
                        let archive_path = std::path::Path::new(archive_dir).join(file_name);

                        // Move the file our of the active dir to preserve the forensic tail
                        let _ = fs::rename(&path, archive_path);
                    }
                }
            }
        }
    });

    // Dedicated physical thread !Send publisher.
    std::thread::spawn(move || {
        // Initialize publisher inside the thread
        let cortex = CortexDataPlane::new(&topic_clone);
        let local_publisher = Arc::new(cortex.create_publisher().expect("Failed to map publisher"));

        // blocking_rev() halts the thread until data arrives, no yield_now() needed
        while let Some(bytes) = cortex_rx.blocking_recv() {
            // Loan exactly the numbe rof bytes we need
            if let Ok(sample) = local_publisher.loan_slice_uninit(bytes.len()) {
                let _ = sample.write_from_slice(&bytes).send();
            }
        }
    });

    // 2 Background Listeners (Zenoh Global network)
    let global_net_clone = global_net.clone();
    let global_axon = axon.clone();
    let global_brain = brain.clone();
    tokio::spawn(async move {
        global_net_clone
            .listen_for_foreign_thoughts(global_brain, global_axon)
            .await;
    });

    // 3. The Production TCP ingress.
    let listener = TcpListener::bind(format!("127.0.0.1:{}", config.port))
        .await
        .unwrap();
    println!("Organism live. Awaiting LLM Agent TCP Connections...");

    loop {
        let (mut socket, addr) = listener.accept().await.unwrap();
        println!("External Agent connected from: {}", addr);

        let task_brain = brain.clone();
        let task_axon = axon.clone();
        let task_cortex_tx = cortex_tx.clone();
        let task_wal = wal.clone();
        let global_publisher = global_net.clone();
        let task_tx_couter = tx_counter.clone();

        tokio::spawn(async move {
            //  THE FRAMING PROTOCOL: Read 4-byte length prefix first
            let mut len_buf = [0u8; 4];
            if socket.read_exact(&mut len_buf).await.is_err() {
                return;
            }
            let payload_len = u32::from_le_bytes(len_buf) as usize;

            // Prevent malicious massive memory allocation attacks ( Max 1mb per thought )
            if payload_len > 1024 * 1024 {
                return;
            }

            // Read the exact payload bytes
            let mut payload_buf = vec![0u8; payload_len];
            if socket.read_exact(&mut payload_buf).await.is_err() {
                return;
            }

            // TRUE Zero-copy deserialization of incoming data
            let archived_state = unsafe {
                rkyv::access_unchecked::<<AgentState as rkyv::Archive>::Archived>(&payload_buf)
            };
            let incoming_state: AgentState =
                rkyv::deserialize::<AgentState, rkyv::rancor::Error>(archived_state)
                    .expect("Failed to deserialize agent state");

            // --- The Synaptic Cascade ---
            execute_synapse_cascade(
                incoming_state,
                task_brain,
                task_axon,
                task_wal,
                task_cortex_tx,
                global_publisher,
                task_tx_couter,
            )
            .await;

            println!("Thought processed, sealed, and broadcast in sub-milliseconds.");
        });
    }
}
