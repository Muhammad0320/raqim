use jsonwebtoken::{Validation, decode};
use raqim_core::aegis::AegisGateKeeper;
use raqim_core::api::{ApiState, EnterpriseClaim, UiEvent, build_admin_router};
use raqim_core::axon::AxonGateKeeper;
use raqim_core::compactor::WalCompactor;
use raqim_core::config::RaqimConfig;
use raqim_core::cortex::{CortexDataPlane, listen_for_local_thoughts};
use raqim_core::embedding::{EmbeddingProvider, LocalBgeProvider, OpenAIProvider};
use raqim_core::health::{HealthMonitor, SystemHealth};
use raqim_core::lancedb_store::LanceEngine;
use raqim_core::memory_router::MemoryRouter;
use raqim_core::network::GlobalNetworkBridge;
use raqim_core::nucleus::WalEngine;
use raqim_core::registry::SwarmRegistry;
use raqim_core::sandbox::{CheckPointTracker, SandboxContent, WasmEngine};
use raqim_core::state::SwarmState;
use raqim_core::telemetry::TelemetryEngine;
use raqim_core::utils::parse_agent_id;
use raqim_core::{AgentState, IngressEnvelope, SystemEvent, execute_raqim_cascade};

use std::collections::HashMap;
use std::fs;
use std::sync::atomic::AtomicU64;
use std::sync::{Arc, Mutex};
use tokio::io::AsyncReadExt;
use tokio::net::TcpListener;
use tokio::signal::unix::{SignalKind, signal};
use tokio::sync::{broadcast, mpsc};
use tokio::task::JoinSet;
use tokio_util::sync::CancellationToken;
use wasmtime_wasi::WasiCtxBuilder;

#[tokio::main]
async fn main() {
    let config = Arc::new(RaqimConfig::load_or_bootstrap());

    println!("Bismillah. Booting Raqim Daemon on port {}...", config.port);

    // =================================
    // SIGNAL INTERCEPTION (K8s SIGTERM)
    // ================================
    let cancel_token = CancellationToken::new();
    let ct_clone = cancel_token.clone();

    tokio::spawn(async move {
        let mut sigterm = signal(SignalKind::terminate()).expect("Failed to bind SIGTERM");
        let mut sigint = signal(SignalKind::interrupt()).expect("Failed to bind SIGINT");

        tokio::select! {
            _ = sigterm.recv() => println!("\n[OS] Received SIGTERM from Kubernetes"),
            _ = sigint.recv() => println!("\n[OS] Received SIGINT (Ctrl+C) ")
        }

        println!("[SYSTEM] Initiating Sovereign Shutdown Sequence...");
        ct_clone.cancel();
    });

    // BOOT TELEMETRY SINKER
    let telemetry = TelemetryEngine::new(&config.tenant_id, &config.license_key);
    TelemetryEngine::start_sinker_daemon(telemetry.clone());

    // THE INTERNAL EVENT BUS
    let (event_tx, mut event_rx) = broadcast::channel::<SystemEvent>(5000);

    let (ui_tx, _ui_rx) = broadcast::channel::<UiEvent>(5000);
    let registry = Arc::new(SwarmRegistry::new());
    let (health_tx, _health_rx) = broadcast::channel::<SystemHealth>(100);
    let (phantom_ui_tx, _phanom_ui_rx) = broadcast::channel::<UiEvent>(100);

    let telemetry_topic = format!("{}_telemetry", config.topic);

    // 2. Spawns a dedicated Zero-copy telemetry thread ( Forwarding Internal events to iceoryx 2 )
    std::thread::spawn(move || {
        println!(
            "Bismillah. Booting IPC Telemetry Emitter on topic: {} ",
            telemetry_topic
        );

        //  Initialize Publisher INSIDE thread ( !Send Compliance )
        let cortex = CortexDataPlane::new(&telemetry_topic);
        let publisher = cortex
            .create_publisher()
            .expect("Failed to create telemetry pub");

        // Listen to internal tokio events and publish them to zero-copy memory
        while let Ok(event) = event_rx.blocking_recv() {
            let serialized_event = rkyv::to_bytes::<rkyv::rancor::Error>(&event).unwrap();

            if let Ok(sample) = publisher.loan_slice_uninit(serialized_event.len()) {
                let sample = sample.write_from_slice(&serialized_event);
                let _ = sample.send();
            }
        }
    });

    // BOOT-TIME LICENSE_VERIFIICATION
    const RAQIM_PUBLIC_KEY: &[u8] = include_bytes!("../../keys/raqim_public.pem");

    let decoding_key = Arc::new(
        jsonwebtoken::DecodingKey::from_rsa_pem(RAQIM_PUBLIC_KEY)
            .expect("FATAL: Invalid RSA PEM format"),
    );

    let validation = Validation::new(jsonwebtoken::Algorithm::RS256);

    let mut allow_wan = false;
    let mut verified_tenat_id = String::from("local_open_core");

    if let Ok(token_data) =
        decode::<EnterpriseClaim>(&config.license_key, &decoding_key, &validation)
    {
        verified_tenat_id = token_data.claims.sub.clone();
        if token_data
            .claims
            .features
            .contains(&"global_a2a".to_string())
            || token_data
                .claims
                .features
                .contains(&"global_crdt".to_string())
        {
            allow_wan = true;
            println!(
                "[SYSTEM] Enterprise Global WAN Authorized for Tenant: {} ",
                token_data.claims.sub
            );
        } else {
            println!("[SYSTEM] Open Core License detected. WAN routing disabled.");
        }
    } else {
        println!("[WARNING] Invalid License. Defaulting to Local LAN Swarm mode.");
    }

    // ===============================
    // 1. BOOT SEQUENCE: INIITIALIZE ALL LAYERS (Wrapped in Arc for fearless concurrency)
    let brain = Arc::new(SwarmState::new(&config.topic));
    let axon = Arc::new(AxonGateKeeper::new());
    let aegis = AegisGateKeeper::new("aegis.toml", event_tx.clone(), ui_tx.clone());
    let (wal, handle) = WalEngine::start(config.wal_path.clone()).await;
    let global_net = Arc::new(
        GlobalNetworkBridge::new(&verified_tenat_id, &config.topic, aegis.clone(), allow_wan).await,
    );
    let wasm_engine = Arc::new(WasmEngine::new());

    let embedder: Box<dyn EmbeddingProvider> = match config.embedder_type.as_str() {
        "openai" => {
            let key =
                std::env::var("OPENAI_API_KEY").unwrap_or_else(|_| config.openai_api_key.clone());
            if key.is_empty() {
                panic!("OPENAI_API_KEY environment variable or config entry is required");
            }
            Box::new(OpenAIProvider::new(key))
        }

        _ => Box::new(LocalBgeProvider::new()),
    };

    let lance_engine = Arc::new(
        LanceEngine::new(
            &format!("{}_semantic.lancedb", &config.topic),
            "agent_history",
            embedder,
        )
        .await,
    );

    // THE BOOTSTRAP PROTOCOL
    let (lance_highest_tx, _valut_capacity) =
        lance_engine.get_vault_metrics().await.unwrap_or((0, 0));
    let wal_highest_tx = wal.get_highest_tx_id(&config.wal_path);

    // The abs truth is the highest number found in either store.
    let starting_tx_id = std::cmp::max(lance_highest_tx, wal_highest_tx);
    let tx_counter = Arc::new(AtomicU64::new(starting_tx_id + 1));

    println!(
        "[SYSTEM] Bootstrapped Tx Counter at TxID: {} ",
        starting_tx_id + 1
    );

    // We spawn the Audit Vault Sinker. This OS thread's ONLY job is to listen to the internal event bus
    let mut valut_rx = event_tx.subscribe();
    let lance_vault_clone = lance_engine.clone();

    tokio::spawn(async move {
        println!("[SYSTEM] Audit Valult Telemetry Sinker Active.");

        while let Ok(event) = valut_rx.recv().await {
            lance_vault_clone.log_system_events(&event).await;
        }
    });

    // The Autonomous compactor (WAL reaper)
    let compactor = WalCompactor::new(
        &config.wal_path,
        lance_engine.clone(),
        event_tx.clone(),
        wal.cmd_sender.clone(),
    );
    compactor.start_daemon();

    // The Local cortex actor
    let topic_clone = &config.topic;
    listen_for_local_thoughts(
        topic_clone.to_string(),
        brain.clone(),
        axon.clone(),
        event_tx.clone(),
    );

    // Channel to talk to the publisher safely accross threads
    let (cortex_tx, mut cortex_rx) = mpsc::unbounded_channel::<Vec<u8>>();
    let topic_clone = config.topic.clone();

    // The WASM plugign Orchestrator
    let plugin_dir = "./plugins";
    fs::create_dir_all(plugin_dir).expect("Failed to create plugins dir");

    // Initialize global tracker ONCE outside the loop
    let global_tracker: Arc<Mutex<HashMap<String, CheckPointTracker>>> =
        Arc::new(Mutex::new(HashMap::new()));

    let mem_router = Arc::new(MemoryRouter::new(
        config.clone(),
        telemetry.clone(),
        aegis.clone(),
        axon.clone(),
        brain.clone(),
        lance_engine.clone(),
        wasm_engine.clone(),
        wal.clone(),
        cortex_tx.clone(),
        global_net.clone(),
        tx_counter.clone(),
        event_tx.clone(),
    ));

    let w_brain = brain.clone();
    let w_axon = axon.clone();
    let w_wal = wal.clone();
    let w_lance = lance_engine.clone();
    let w_cortex_tx = cortex_tx.clone();
    let w_global_net = global_net.clone();
    let w_wasm_engine = wasm_engine.clone();
    let w_tx_couter = tx_counter.clone();
    let w_event_tx = event_tx.clone();
    let w_aegis = aegis.clone();
    let w_telemetry = telemetry.clone();

    // Spawns a dedicated background thread to monitor the plugins folder
    tokio::spawn(async move {
        println!(
            "WASM Orchestrator monitoring {} for a new edge plugins...",
            plugin_dir
        );

        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(10));

        loop {
            interval.tick().await;

            if let Ok(entries) = fs::read_dir(plugin_dir) {
                for entry in entries.flatten() {
                    let path = entry.path();

                    // If a new .wasm file is found we execute it.
                    if path.extension().and_then(|s| s.to_str()) == Some("wasm") {
                        println!("Discovered a new WASM Plugin: {:?}", path);

                        let wasm_bytes = fs::read(&path).unwrap();

                        //  Extract the agent_id directly from the filename
                        let file_stem = path.file_stem().unwrap().to_str().unwrap();

                        // Validate ID
                        let agent_id_bytes = match parse_agent_id(file_stem) {
                            Ok(bytes) => bytes,
                            Err(_) => {
                                eprintln!(
                                    "[SYSTEM WARN] Invalid Agent ID filename: {}. Skipping...",
                                    file_stem
                                );
                                continue;
                            }
                        };

                        let agent_hex = hex::encode(agent_id_bytes);
                        println!("[SYSTEM] Deploying Agent: {} ", &agent_hex);

                        let _ = w_event_tx.send(SystemEvent::PluginLoaded {
                            plugin_name: entry.file_name().to_string_lossy().to_string(),
                        });

                        // WASI Context Must be built per-execution
                        let wasi_ctx = WasiCtxBuilder::new().build_p1();

                        // We must clone the layers for the specific execution
                        let a_clone = w_axon.clone();
                        let b_clone = w_brain.clone();
                        let w_clone = w_wal.clone();
                        let c_clone = w_cortex_tx.clone();
                        let g_clone = w_global_net.clone();
                        let t_clone = w_tx_couter.clone();
                        let tx_clone = w_event_tx.clone();
                        let lance_clone = w_lance.clone();
                        let ae_clone = w_aegis.clone();
                        let tele_clone = w_telemetry.clone();

                        // When an agent connects or boots, we retreive or initialize its specific tracker
                        let content = SandboxContent {
                            axon: a_clone,
                            brain: b_clone,
                            wal: w_clone,
                            cortex_tx: c_clone,
                            global_net: g_clone,
                            global_tx_counter: t_clone,
                            event_tx: tx_clone,
                            wasi: wasi_ctx,
                            agent_hex: agent_hex.clone(),
                            lance: lance_clone,
                            aegis: ae_clone,
                            live_responses: Vec::new(),
                            live_seeds: Vec::new(),
                            live_timestamps: Vec::new(),
                            replay_responses: Vec::new(),
                            replay_seeds: Vec::new(),
                            replay_timestamps: Vec::new(),
                            telemetry: tele_clone,
                            a2a_response_cache: Vec::new(),
                            http_response_cache: Vec::new(),
                            a2a_incoming_cache: Vec::new(),

                            a2a_receiver: None,
                            a2a_reply_channel: None,
                        };

                        let mut tracker_lock = global_tracker.lock().unwrap();
                        let agent_tracker =
                            tracker_lock.entry(agent_hex).or_insert(CheckPointTracker {
                                last_snapshot_tx: 0,
                                last_snapshot_time: 0,
                            });

                        // Get the exact current Transaction ID
                        let current_tx = w_tx_couter.load(std::sync::atomic::Ordering::SeqCst);

                        // Execute the untrusted logic in the WASM cage
                        if let Err(e) = w_wasm_engine.execute_agent(
                            &wasm_bytes,
                            content,
                            agent_tracker,
                            current_tx,
                            None,
                        ) {
                            eprintln!("Plugin {:?} trapped/failed: {} ", &path, e);
                        }

                        // Rename this file again so we don't execute it again in the next loop
                        let mut new_path = path.clone();
                        new_path.set_extension("wasm.running");
                        let _ = fs::rename(&path, new_path);

                        // Move the processed files into an archive folder
                        let archive_dir = "./plugins_archive";
                        let _ = fs::create_dir_all(archive_dir);

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
    let cortex = CortexDataPlane::new(&topic_clone);
    std::thread::spawn(move || {
        // Initialize publisher inside the thread
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
    let global_tx = event_tx.clone();
    tokio::spawn(async move {
        global_net_clone
            .listen_for_foreign_thoughts(global_brain, global_axon, global_tx)
            .await;
    });

    // Spawn the hardware interrupt loop
    HealthMonitor::spawn_telemetry_loop(health_tx.clone());

    let api_state = ApiState {
        config: config.clone(),
        aegis: aegis.clone(),
        mem_router: mem_router.clone(),
        global_net: global_net.clone(),
        telemetry: telemetry.clone(),
        axon: axon.clone(),
        brain: brain.clone(),
        lance: lance_engine.clone(),
        cortex_tx: cortex_tx.clone(),
        global_tx_counter: tx_counter.clone(),
        wal: wal.clone(),
        event_tx: event_tx.clone(),
        decoding_key,

        ui_tx: ui_tx.clone(),
        phantom_ui_tx: phantom_ui_tx.clone(),
        health_tx: health_tx.clone(),
        swarm_registry: registry.clone(),
    };

    let axum_app = build_admin_router(api_state);
    let api_port = config.port + 1;
    tokio::spawn(async move {
        let listener = TcpListener::bind(format!("0.0.0.0:{}", api_port))
            .await
            .unwrap();
        println!("[SYSTEM] Axum control plane live on port {} ", api_port);
        axum::serve(listener, axum_app).await.unwrap();
    });

    // 3. The Production TCP ingress.
    let listener = TcpListener::bind(format!("0.0.0.0:{}", config.port))
        .await
        .unwrap();
    println!("Organism live. Awaiting LLM Agent TCP Connections...");

    // JoinSet automatically tracks all spawned TCP worker tasks.
    let mut tcp_workers = JoinSet::new();

    loop {
        tokio::select! {

                    // If cancelled is triggered, break the infinite loop.
                    _ = cancel_token.cancelled() => {
                        println!("[NETWORK] TCP Ingress halted. Rejecting new connections. ");
                        break;
                    }

                // Otherwise, Accept connections normally.
                accpet_res = listener.accept() => {

                    let (mut socket, addr) = match accpet_res {
                        Ok(res) => res,
                        Err(_) => continue
                    };


                println!("External Agent connected from: {}", addr);

                let task_telemetry = telemetry.clone();
                let task_brain = brain.clone();
                let task_axon = axon.clone();
                let task_cortex_tx = cortex_tx.clone();
                let task_wal = wal.clone();
                let global_publisher = global_net.clone();
                let task_tx_couter = tx_counter.clone();
                let task_event_tx = event_tx.clone();
                let task_aegis = aegis.clone();
                let task_ui_tx = ui_tx.clone();
                let task_registry = registry.clone();

                // Spawn into the joinset
                 tcp_workers.spawn(async move {
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


                let archived_ingress = match rkyv::access::<<IngressEnvelope as rkyv::Archive>::Archived, rkyv::rancor::Error>(&payload_buf) {
                    Ok(valid_archived) => valid_archived,
                    Err(e) => {
                        eprintln!("[AEGIS] TCP Dropped: Malformed Memory layout (IngressEnvelope): {}", e);
                        return;
                    }
                };

                let path_intent = archived_ingress.intent_path.as_str();
                let state_slice = archived_ingress.state_bytes.as_slice();


                let archived_state = match rkyv::access::<<AgentState as rkyv::Archive>::Archived, rkyv::rancor::Error>(&state_slice) {
                    Ok(valid_state) => valid_state,
                    Err(e) => {
                        eprintln!("[AEGIS] TCP Dropped: Malformed Memory layout (AgentState): {} ", e);
                        return;
                    }
                };

                        // verify the inner state payload

                    let agent_hex = hex::encode(archived_state.agent_id.unwrap().as_slice());
                    let text = archived_state.text.as_str().to_string();
                    // 1. Checking aegis first before doing any expensive math or hitting the wal.
                    if !task_aegis.enforce_aegis_policy(&agent_hex, path_intent) {
                        eprintln!(
                            "[AEGIS] Dropped Unauthorized TCP packets from {}",
                            &agent_hex
                        );
                        return;
                    }

                    // TRUE CRYPTOGRAPHIC VERIFIICATION (using the exact slice)
                    let mut sig_bytes = [0u8; 64];
                    sig_bytes.copy_from_slice(archived_ingress.signature.as_slice());

                    if !task_aegis.verify_agent_signature(&agent_hex, state_slice, &sig_bytes) {
                        eprintln!(" [SECURITY] Invalid Ed25519 signature. Dropping TCP packet.");
                        return;
                    }

                    let mut alias = "Unknown".to_string();
                    if path_intent == "/system/handshake" {
                        if text.starts_with("ALIAS=") {
                            let alias = text.replace("ALIAS=", "").trim().to_string();
                            // We do not execute a cascade for handshake. We just register and drop
                            task_registry.touch_agent(&agent_hex, &path_intent, "Connected", &alias);

                            return;
                        }
                    } else {
                        // O(1) Ram lookup and keep the alias active for normal thought
                        if let Some(agent_proc) = task_registry.active_agents.get(&agent_hex) {
                            alias = agent_proc.alias.clone();
                        }
                    }

                    // --- The Raqim Cascade ---
                    let res = execute_raqim_cascade(
                        &archived_state,
                        task_brain,
                        task_axon,
                        task_wal,
                        task_cortex_tx,
                        global_publisher,
                        task_tx_couter,
                        task_event_tx,
                        Vec::new(),
                        Vec::new(),
                        task_telemetry,
                    )
                    .await;

                    // Update RAM process Table (O(1) nanoseconds lock)
                    task_registry.touch_agent(
                        agent_hex.clone().as_str(),
                        archived_ingress.intent_path.as_str(),
                        "Active",
                        &alias,
                    );

                    let tx_id = match res {
                        Ok(id) => id,
                        Err(_) => return,
                    };

                    let ui_payload = UiEvent::ThoughtCommited {
                        agent_hex: agent_hex.clone(),
                        intent_path: path_intent.to_string(),
                        tx_id,
                        text,
                    };

                    let _ = task_ui_tx.send(ui_payload);

                    println!("Thought processed, sealed, and broadcast in sub-milliseconds.");





                });

            }
        }
    }

    // =========================
    // GRACEFUL DRAIN
    // =========================

    // Drain In-Flight TCP packets
    println!(
        "[SYSTEM] Draining {} active TCP threads... ",
        tcp_workers.len()
    );
    while let Some(res) = tcp_workers.join_next().await {
        if let Err(e) = res {
            eprint!(
                "[SYSTEM WARN] A TCP worker panicked during shutdown: {} ",
                e
            );
        }
    }

    println!("[SYSTEM] All active thoughts processed and sealed.");

    // Sever the Global Mesh
    global_net.shutdown().await;

    // Seal the WAL safely to nvme
    drop(wal);
    println!("[WAL] Senders dropped. Awaiting final io_uring fsync to NVMe... ");

    // Block the main thread from exiting until the disk thread physically joins
    handle
        .join()
        .expect("FATAL: WAL thread panicked during shutdown.");

    println!("[SYSTEM] Raqim OS terminated cleanly. Zero data loss. Alhamdullilah.");
}
