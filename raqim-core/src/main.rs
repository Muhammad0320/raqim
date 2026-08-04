use ed25519_dalek::SigningKey;
use rand_core::OsRng;
use raqim_core::aegis::AegisGateKeeper;
use raqim_core::api::{ApiState, UiEvent, build_admin_router};
use raqim_core::axon::AxonGateKeeper;

use axum::http::Method;
use raqim_core::compactor::WalCompactor;
use raqim_core::config::RaqimConfig;
use raqim_core::cortex::CortexDataPlane;
use raqim_core::embedding::{EmbeddingProvider, LocalBgeProvider, OpenAIProvider};
use raqim_core::health::{HealthMonitor, SystemHealth};
use raqim_core::lancedb_store::LanceEngine;
use raqim_core::memory_router::MemoryRouter;
use raqim_core::network::GlobalNetworkBridge;
use raqim_core::nucleus::WalEngine;
use raqim_core::registry::SwarmRegistry;
use raqim_core::sandbox::{CheckPointTracker, SandboxContent, WasmEngine};
use raqim_core::state::SwarmStateRegistry;
use raqim_core::telemetry::TelemetryEngine;
use raqim_core::{
    AgentState, IngressEnvelope, RuntimeSecurityFlags, SystemEvent, execute_raqim_cascade,
};
use tower_http::cors::{Any, CorsLayer};

use std::collections::HashMap;
use std::path::Path;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::{fs, println};

use tokio::net::TcpListener;
use tokio::signal::unix::{SignalKind, signal};
use tokio::sync::{broadcast, mpsc};
use tokio::task::JoinSet;
use tokio_util::sync::CancellationToken;
use uuid::Uuid;
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
    // let telemetry = TelemetryEngine::new(&config.tenant_id);
    // TelemetryEngine::start_sinker_daemon(telemetry.clone());

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

    let security_flags = RuntimeSecurityFlags::new();

    // Spawning a dynamic hot swap listener
    let decoding_key_clone = decoding_key.clone();
    let mut license_rx = event_tx.subscribe();
    let flag_worker = security_flags.clone();

    let allow_wan = Arc::new(AtomicBool::new(false));

    // let allow_wan_clone = allow_wan.clone();
    // tokio::spawn(async move {
    //     println!("[SYSTEM] Ingess security claim listener spawned successfully. ");
    //     while let Ok(event) = license_rx.recv().await {
    //         if let SystemEvent::LicenseUpdated { new_jwt } = event {
    //             flag_worker.evaluate_jwt(&new_jwt, &decoding_key_clone);
    //         }

    //         let allow_global_a2a = flag_worker.allow_global_a2a.clone().load(Ordering::Relaxed);
    //         let allow_global_aegis = flag_worker
    //             .allow_global_aegis
    //             .clone()
    //             .load(Ordering::Relaxed);
    //         let allow_global_crdt = flag_worker
    //             .allow_global_crdt
    //             .clone()
    //             .load(Ordering::Relaxed);

    //         // Determine if Zenoh needs to connect to the cloud router at all.
    //         let allow_wan_bool = allow_global_a2a || allow_global_aegis || allow_global_crdt;

    //         allow_wan_clone.store(allow_wan_bool, Ordering::SeqCst);
    //     }
    // });

    // Securely loads the swarm key from disk. Generate it if it doesn't exist/
    let key_dir = Path::new("./ca-keys");
    let key_path = key_dir.join("swarm_master.key");

    // Generation Phase (First Boot Only)
    if !key_path.exists() {
        println!("[SECURITY] Initializing Swarm Master Cryptographic Root... ");
        fs::create_dir_all(key_dir).expect("Failed to create keys directory");

        let mut csprng = OsRng;
        let signing_key = SigningKey::generate(&mut csprng);

        fs::write(&key_path, signing_key.to_bytes()).expect("Failed to write Master Key");

        // Lock down Unix permissions
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&key_path, fs::Permissions::from_mode(0o600))
                .expect("Failed to secure Master Key Permissions");
        }
    }

    // Memory Load Phase
    let key_bytes = fs::read(&key_path).expect("FATAL: Failed to read master_key from disk");
    let key_array: [u8; 32] = key_bytes
        .as_slice()
        .try_into()
        .expect("FATAL: Master key bytes is corruped (not 32 bytes)");
    let master_signing_key = SigningKey::from_bytes(&key_array);

    let master_public_key = master_signing_key.verifying_key().to_bytes();
    let master_public_key_hex = hex::encode(master_public_key.clone());
    println!("[SECURITY] Swarm Master Identity loaded into a secure kernel memory ");

    // ===============================
    let os_node_id = Uuid::new_v4().to_string();
    println!("[SYSTEM] Sovereign OS Node ID: {} ", os_node_id);

    // 1. BOOT SEQUENCE: INIITIALIZE ALL LAYERS (Wrapped in Arc for fearless concurrency)
    let brain_shard = Arc::new(SwarmStateRegistry::new());

    let axon = Arc::new(AxonGateKeeper::new());
    let aegis = AegisGateKeeper::new(
        &config.aegis_path,
        master_public_key_hex.as_str(),
        event_tx.clone(),
        ui_tx.clone(),
    );

    let (wal, handle) = WalEngine::start(config.wal_path.clone()).await;
    let global_net = Arc::new(
        GlobalNetworkBridge::new(
            &security_flags.tenant_id.clone().read().unwrap(),
            &config.topic,
            aegis.clone(),
            os_node_id,
            allow_wan.clone(),
            security_flags.allow_global_a2a.clone(),
            security_flags.allow_global_aegis.clone(),
        )
        .await,
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

    let lance_engine =
        Arc::new(LanceEngine::new(&config.lance_path, &config.table_name, embedder).await);

    // 1. Boot global Quarantine network subscriber
    global_net.listen_for_global_quarantine(aegis.clone()).await;

    // 2. Wire SystemEvent subscriber loop for outbound local quarantine events
    let mut system_rx = event_tx.subscribe();
    let net_clone = global_net.clone();

    tokio::spawn(async move {
        while let Ok(event) = system_rx.recv().await {
            if let SystemEvent::GlobalQuarantineSync { record } = event {
                net_clone.broadcast_quarantine_sync(record);
            }
        }
    });

    // THE BOOTSTRAP PROTOCOL
    // let (lance_highest_tx, _valut_capacity) =
    //     lance_engine.get_vault_metrics().await.unwrap_or((0, 0));
    // let wal_highest_tx = wal.get_highest_tx_id(&config.wal_path);

    // // The abs truth is the highest number found in either store.
    // let starting_tx_id = std::cmp::max(lance_highest_tx, wal_highest_tx);
    // let tx_counter = Arc::new(AtomicU64::new(starting_tx_id + 1));

    // println!(
    //     "[SYSTEM] Bootstrapped Tx Counter at TxID: {} ",
    //     starting_tx_id + 1
    // );

    // ============================
    // THE PHOENIX HYDRATION PROTOCOL: Reconstructs in-memory Axon Merkle trees from uncompacted WAL frames on boot.
    // ============================
    println!("[INITIALIIZATION] Phoenix protocol: Hydrating Axon state from active WAL...");
    if Path::new(&config.wal_path).exists() {
        if let Ok(wal_bytes) = fs::read(&config.wal_path) {
            let mut offset = 0;
            let mut recovered_count = 0;

            while offset < wal_bytes.len() {
                if offset + 4 > wal_bytes.len() {
                    break;
                }

                let mut len_bytes = [0u8; 4];
                len_bytes.copy_from_slice(&wal_bytes[offset..offset + 4]);
                let entry_len = u32::from_le_bytes(len_bytes) as usize;
                offset += 4;

                if offset + entry_len > len_bytes.len() {
                    break;
                }

                let entry_slice = &wal_bytes[offset..offset + entry_len];

                if let Ok(archived_log) =
                    rkyv::access::<<OpLog as rkyv::Archive>::Archived>(entry_slice)
                {
                    if let Ok(recovered_log) =
                        rkyv::deserialize::<OpLog, rkyv::rancor::Error>(archived_log)
                    {
                        axon.hydrate_from_recoverey(&recovered_log);
                        recovered_count += 1;
                    }
                }

                offset += entry_len;
            }
            println!(
                "[INITIALIIZATION] Phoenix protocol Complete. Hydrated {} log frames into Axon DAG memory. ",
                recovered_count
            );
        }
    }

    // We spawn the Audit Vault Sinker. This OS thread's ONLY job is to listen to the internal event bus
    let mut valut_rx = event_tx.subscribe();
    let lance_vault_clone = lance_engine.clone();
    let lance_net = global_net.clone();

    tokio::spawn(async move {
        println!("[SYSTEM] Audit Valult Telemetry Sinker Active.");

        while let Ok(event) = valut_rx.recv().await {
            lance_vault_clone.log_system_events(&event).await;

            match event {
                SystemEvent::GlobalQuarantineSync { record } => {
                    lance_net.broadcast_quarantine_sync(record).await;
                }

                _ => {}
            }
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

    // Channel to talk to the publisher safely accross threads
    let (cortex_tx, mut cortex_rx) = mpsc::unbounded_channel::<Vec<u8>>();
    let topic_clone = config.topic.clone();

    // The WASM plugign Orchestrator
    let plugin_dir = "./plugins";
    fs::create_dir_all(plugin_dir).expect("Failed to create plugins dir");

    let mem_router = Arc::new(MemoryRouter::new(
        config.clone(),
        telemetry.clone(),
        aegis.clone(),
        axon.clone(),
        brain_shard.clone(),
        lance_engine.clone(),
        wasm_engine.clone(),
        wal.clone(),
        cortex_tx.clone(),
        global_net.clone(),
        event_tx.clone(),
        master_signing_key.clone(),
        security_flags.allow_time_travel.clone(),
    ));

    // Initialize global tracker ONCE outside the loop
    let global_tracker: Arc<Mutex<HashMap<String, CheckPointTracker>>> =
        Arc::new(Mutex::new(HashMap::new()));

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
    let w_brain_shard = brain_shard.clone();

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

                    if path.extension().and_then(|s| s.to_str()) == Some("wasm") {
                        println!("Discovered a new WASM Plugin: {:?}", path);
                        let file_stem = path.file_stem().unwrap().to_str().unwrap();

                        // Resolve the adjacent secure crptographic files
                        let key_path = path.with_extension("key");
                        let cert_path = path.with_extension("cert");

                        if !key_path.exists() || !cert_path.exists() {
                            eprintln!(
                                " [ORCHESTRATOR WARNING] Dropped plugin deployment for '{}'. Missing adjacent secure credentials (.key / .cert). ",
                                file_stem
                            );
                            continue;
                        }

                        println!(
                            "[ORCHESTRATOR] Initializing secure cryptographic verification for: {}.wasm ",
                            file_stem
                        );

                        // Read the raw system component from the disk
                        let wasm_bytes = fs::read(&path).unwrap();
                        let private_key_bytes = fs::read(&key_path).unwrap();
                        let cert_bytes = fs::read(&cert_path).unwrap();

                        // Re-instantiate the authentic cryptographic identity
                        let agent_private_key = match private_key_bytes.as_slice().try_into() {
                            Ok(bytes) => SigningKey::from_bytes(bytes),
                            Err(_) => {
                                eprintln!(
                                    "[ORCHESTRATOR FATAL] Private key for '{}' is corrupt. Skipping. ",
                                    file_stem
                                );
                                continue;
                            }
                        };

                        // Compute the Agent ID Hex directly from the valid public key bytes
                        let pub_key_bytes = agent_private_key.verifying_key().to_bytes();

                        // Initialize blake3 key derivation function with Strict Domain Separation
                        let mut hasher = blake3::Hasher::new_derive_key("raqim.agent.v1.identity");
                        hasher.update(&pub_key_bytes);

                        let mut agent_id_byte = [0u8; 16];
                        hasher.finalize_xof().fill(&mut agent_id_byte);

                        let agent_hex = hex::encode(agent_id_byte);

                        println!(
                            "[ORCHESTRATOR] Deploying Certified Identity Node: [Hex: {}] [Alias: {}] ",
                            &agent_hex, file_stem
                        );

                        let _ = w_event_tx.send(SystemEvent::PluginLoaded {
                            plugin_name: entry.file_name().to_string_lossy().to_string(),
                        });

                        // WASI Context Must be built per-execution
                        let wasi_ctx = WasiCtxBuilder::new().build_p1();

                        // We must clone the layers for the specific execution
                        let a_clone = w_axon.clone();
                        let w_clone = w_wal.clone();
                        let c_clone = w_cortex_tx.clone();
                        let g_clone = w_global_net.clone();
                        let tx_clone = w_event_tx.clone();
                        let lance_clone = w_lance.clone();
                        let ae_clone = w_aegis.clone();
                        let tele_clone = w_telemetry.clone();
                        let shard_clone = w_brain_shard.clone();

                        // When an agent connects or boots, we retreive or initialize its specific tracker
                        let content = SandboxContent {
                            axon: a_clone,
                            wal: w_clone,
                            shard: shard_clone,
                            cortex_tx: c_clone,
                            global_net: g_clone,
                            event_tx: tx_clone,
                            wasi: wasi_ctx,
                            agent_hex: agent_hex.clone(),

                            agent_private_key,
                            capability_cert_bytes: cert_bytes,

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

                        // Mutex lifetime enforcement

                        let mut tracker_lock = global_tracker.lock().unwrap();

                        // Extract an owned, independent clone of the tracker out of the map boundary
                        let mut agent_tracker =
                            *tracker_lock
                                .entry(agent_hex.clone())
                                .or_insert(CheckPointTracker {
                                    last_snapshot_tx: 0,
                                    last_snapshot_time: 0,
                                });

                        // Drop the lock instantly to prevent hot path thread starvation
                        drop(tracker_lock);

                        // Get the exact current Transaction ID
                        let current_tx = w_tx_couter.load(std::sync::atomic::Ordering::SeqCst);
                        let w_engine_clone = w_wasm_engine.clone();
                        let wasm_bytes_clone = wasm_bytes.clone();

                        // Execute the untrusted logic in the safe WASM execution cell
                        tokio::spawn(async move {
                            if let Err(e) = w_engine_clone.execute_agent(
                                &wasm_bytes_clone,
                                content,
                                &mut agent_tracker,
                                current_tx,
                                None,
                            ) {
                                eprintln!("[SANDBOX TRAPPED] Plugin engine failure: {}", e);
                            }
                        });

                        // Secure Forensic Footprint Archive Transition
                        let archive_dir = "./plugins_archive";
                        let _ = fs::create_dir_all(archive_dir);

                        let _ = fs::rename(
                            &key_path,
                            format!("{}/{}.key.running", archive_dir, &agent_hex),
                        );
                        let _ = fs::rename(
                            &cert_path,
                            format!("{}/{}.cert.running", archive_dir, &agent_hex),
                        );
                        let _ = fs::rename(
                            &path,
                            format!("{}/{}.wasm.running", archive_dir, agent_hex),
                        );
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
    let global_brain = brain_shard.clone();
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
        brain: brain_shard.clone(),
        lance: lance_engine.clone(),
        cortex_tx: cortex_tx.clone(),
        global_tx_counter: tx_counter.clone(),
        wal: wal.clone(),
        event_tx: event_tx.clone(),

        ui_tx: ui_tx.clone(),
        phantom_ui_tx: phantom_ui_tx.clone(),
        health_tx: health_tx.clone(),
        swarm_registry: registry.clone(),
        master_signing_key: master_signing_key.clone(),
    };

    let axum_app = build_admin_router(api_state).layer(
        CorsLayer::new()
            .allow_origin(Any)
            .allow_methods([Method::GET, Method::POST])
            .allow_headers(Any),
    );
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

                    let (socket, addr) = match accpet_res {
                        Ok(res) => res,
                        Err(_) => continue
                    };


                println!("External Agent connected from: {}", addr);

                let task_telemetry = telemetry.clone();
                let task_axon = axon.clone();
                let task_cortex_tx = cortex_tx.clone();
                let task_wal = wal.clone();
                let global_publisher = global_net.clone();
                let task_tx_couter = tx_counter.clone();
                let task_event_tx = event_tx.clone();
                let task_aegis = aegis.clone();
                let task_ui_tx = ui_tx.clone();
                let task_registry = registry.clone();
                let task_brain = brain_shard.clone();

                // Spawn into the joinset
                 tcp_workers.spawn(async move {

                //  Syscall Amortization: Wrap the socket in a 1mb BufReader to eliminate kernel context switches
                let mut reader = tokio::io::BufReader::with_capacity(1024 * 1024, socket);

                // Heap Allocation Amortization: pre-allocate a 1mb scratch buffer ONCE to eliminate dynamic heap allocation.
                let mut payload_scratch_buf = vec![0u8; 1024* 1024];

                // ENTERPRISE FIX: Socket-Level Cryptographic Session Cache.
                let mut session_established = false;
                let mut cached_agent_hex = String::new();
                let mut cached_group_name = String::new();

                loop {
                   //  THE FRAMING PROTOCOL: Read 4-byte length prefix first
                //    Read from the BufReader
                    let mut len_buf = [0u8; 4];
                    if let Err(e) = tokio::io::AsyncReadExt::read_exact(&mut reader, &mut len_buf).await {

                            if e.kind() == std::io::ErrorKind::UnexpectedEof {
                                println!("[TCP EDGE] Agent at {} disconnected cleanly (EOF) ", addr);
                            } else {


                                eprintln!("[TCP EDGE]: Connection closed or read failed: {}", e);
                            }
                        break;
                    }
                    let payload_len = u32::from_le_bytes(len_buf) as usize;

                    // Prevent malicious massive memory allocation attacks ( Max 1mb per thought )
                    if payload_len > 1024 * 1024 {
                        eprintln!("[NETWORK WARN] Payload Exceeded 1MB limit. Dropping Connections.");
                        break;
                    }

                    // Read the exact payload bytes: Read into the preallocated screatch bufffer.
                    // We slice the scratch buffer to the exact length of the incoming payload complately bypassing the OS memory allocator


                    let active_payload_slice : &mut [u8] = &mut payload_scratch_buf[0..payload_len];

                    if let Err(e) = tokio::io::AsyncReadExt::read_exact(&mut reader, active_payload_slice).await {
                        eprintln!("[TCP EDGE]: Failed to load TCP payload {}", e);
                        break;
                    }

                let archived_ingress = match rkyv::access::<<IngressEnvelope as rkyv::Archive>::Archived, rkyv::rancor::Error>(active_payload_slice) {
                    Ok(valid_archived) => valid_archived,
                    Err(e) => {
                        eprintln!("[AEGIS] TCP Dropped: Malformed Memory layout (IngressEnvelope): {}", e);
                        break;
                    }
                };

                let path_intent = archived_ingress.intent_path.as_str();
                let state_slice = archived_ingress.state_bytes.as_slice();


                // ===== REALIGNMENT: Force the sub-slice onto machine word boundaries ==========
                    let mut aligned_state_buf: rkyv::util::AlignedVec<16> = rkyv::util::AlignedVec::new();
                    aligned_state_buf.extend_from_slice(state_slice);

                    // Validates the memory layout over the aligned buffer allocation
                    let archived_state = match rkyv::access::<<AgentState as rkyv::Archive>::Archived, rkyv::rancor::Error>(&aligned_state_buf) {
                        Ok(valid_state) => valid_state,
                        Err(e) => {
                            eprintln!("[AEGIS ERROR] TCP Dropped: Misaligned/Malformed Inner Payload (AgentState): {} ", e);
                            break;
                        }
                    };

                    let agent_pub_key: [u8; 32] = archived_ingress.public_key.try_into().unwrap_or([0; 32]);
                    let mut packet_sig = [0u8; 64];
                    packet_sig.copy_from_slice( archived_ingress.signature.as_slice() );

                    // UNIFIED PERIMETER: Validates lineage, check signature, and checks the namespace instantly

                    // ONLY verify the heavy Master Certificate on the very first packet.
                    if !session_established {

                            match task_aegis.verify_session_lineage(archived_ingress.capability_cert.as_slice()) {
                                Ok((agent_hex, group_name)) => {
                                    session_established = true;
                                    cached_agent_hex = agent_hex;
                                    cached_group_name = group_name;
                                }

                                Err(e) => {
                                    eprintln!("[AEGIS INTERDICTION] Handshake Failed: {} ", e);
                                    break;

                                }
                            }
                    }

                    // Perform ultrafast packet audit for each packet.
                    if let  Err(e) = task_aegis.authorize_packet_fast(&cached_agent_hex, &cached_group_name, &agent_pub_key, state_slice, &packet_sig, path_intent) {

                        eprintln!("[AEGIS INTERDICTION] Fast Audit failed: {} ", e);
                        break;

                    }

                    let agent_hex = cached_agent_hex.clone();

                    let text = archived_state.text.as_str().to_string();

                    let mut alias = "Unknown".to_string();
                    if path_intent == "/system/handshake" {
                        if text.starts_with("ALIAS=") {
                            let alias = text.replace("ALIAS=", "").trim().to_string();
                            // We do not execute a cascade for handshake. We just register and drop
                            task_registry.touch_agent(&agent_hex, &path_intent, "Connected", &alias);

                            continue;
                        }
                    } else {
                        // O(1) Ram lookup and keep the alias active for normal thought
                        if let Some(agent_proc) = task_registry.active_agents.get(&agent_hex) {
                            alias = agent_proc.alias.clone();
                        }
                    }

                    // --- The Raqim Cascade ---
                    // If the WAL or the Publisher channel are full, the .await creates a healthy backppressure rather than panicking.
                    let res = execute_raqim_cascade(
                        &archived_state,
                        task_axon.clone(),
                        task_wal.clone(),
                        task_brain.clone(),
                        task_cortex_tx.clone(),
                        global_publisher.clone(),
                        task_event_tx.clone(),
                        Vec::new(),
                        Vec::new(),
                        task_telemetry.clone(),
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
                        Err(e) => {
                            eprintln!("[CASCADE ERROR]: Processing failed: {:?}", e);
                            continue;
                        }
                    };

                    let _ = task_ui_tx.send(UiEvent::ThoughtCommitted {
                        agent_hex: agent_hex.clone(),
                        intent_path: path_intent.to_string(),
                        tx_id: format!("{:032x}", tx_id),
                        text,
                    });

                }

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
