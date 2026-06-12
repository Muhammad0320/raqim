use std::sync::Arc;

use ed25519_dalek::SigningKey;
use rand_core::OsRng;
use raqim_core::{
    aegis::AegisGateKeeper,
    axon::AxonGateKeeper,
    embedding::LocalBgeProvider,
    lancedb_store::LanceEngine,
    network::GlobalNetworkBridge,
    nucleus::WalEngine,
    sandbox::{CheckPointTracker, SandboxContent, WasmEngine},
    state::SwarmStateRegistry,
    telemetry::TelemetryEngine,
};
use sysinfo::System;
use tokio::sync::broadcast;
use wasmtime_wasi::WasiCtxBuilder;

#[tokio::main]
async fn test_wasm_sandbox_memory_reclamation() {
    println!(" Bismillah. Initiating WASM Temporal Memory Leak Audit... ");

    // Bootstrap Dummy infra
    let (event_tx, _) = broadcast::channel(100);
    let (ui_tx, _) = broadcast::channel(100);
    let (cortex_tx, _) = tokio::sync::mpsc::unbounded_channel();

    let aegis = AegisGateKeeper::new(
        "dummy_test_aegis.toml",
        "0000000000000000000000000000000000000000000000000000000000000000",
        event_tx.clone(),
        ui_tx,
    );
    let net = Arc::new(
        GlobalNetworkBridge::new("test", "test", aegis.clone(), false, "node".to_string()).await,
    );
    let brain_shard = Arc::new(SwarmStateRegistry::new());
    let embedder = Box::new(LocalBgeProvider::new());
    let lance = Arc::new(LanceEngine::new_dummy(embedder).await);

    let wasm_engine = WasmEngine::new();

    // COMPILE A DUMMY WASM MODULE
    let dummy_wasm_bytes = wat::parse_str(
        r#"
        (module 
            (memory (export "memory") 1)
            ( func (export "agent_main")
                ;; Do nothing  
            )
        )
    "#,
    )
    .expect("Failed to parse WAT to WASM");

    let mut sys = System::new_all();
    sys.refresh_memory();
    let initial_memory = sys.used_memory();
    println!(
        " [AUDIT] Initial System Memory: {} KB ",
        initial_memory / 1024
    );

    // The leak loop
    let iteration = 100;
    println!(
        "[AUDIT] Spinning up and Destroying {} Isolated WASM timelines",
        iteration
    );

    let embedder_clone = embedder.clone();

    for i in 0..iteration {
        // Generate Isolated Credential
        let mut csprng = OsRng;
        let signing_key = SigningKey::generate(&mut csprng);

        // Build Isolated Sandbox content.
        let content = SandboxContent {
            axon: Arc::new(AxonGateKeeper::new()),
            aegis: aegis.clone(),
            wal: WalEngine::start_dummy().await,
            shard: brain_shard.clone(),
            cortex_tx: cortex_tx.clone(),
            global_net: net.clone(),
            global_tx_counter: Arc::new(std::sync::atomic::AtomicU64::new(0)),
            event_tx: event_tx.clone(),
            wasi: WasiCtxBuilder::new().build_p1(),
            lance: lance.clone(),
            telemetry: TelemetryEngine::new("test", "test"),
            agent_hex: format!("phantom_agent_{:02}", i),
            agent_private_key: signing_key,
            capability_cert_bytes: vec![0u8; 128],

            live_responses: Vec::new(),
            live_seeds: Vec::new(),
            live_timestamps: Vec::new(),
            replay_seeds: Vec::new(),
            replay_responses: Vec::new(),
            replay_timestamps: Vec::new(),
            a2a_incoming_cache: Vec::new(),
            a2a_response_cache: Vec::new(),
            http_response_cache: Vec::new(),
            a2a_receiver: None,
            a2a_reply_channel: None,
        };

        let mut tracker = CheckPointTracker {
            last_snapshot_time: 0,
            last_snapshot_tx: 0,
        };

        // Execute the agent.
        // We inject a 5MB 'historical snapshot' to bloat the linear memory
        let bloat_snapshot = vec![48u8, 5 * 1024 * 1024];

        let res = wasm_engine.execute_agent(
            &dummy_wasm_bytes,
            content,
            &mut tracker,
            i as u64,
            Some(bloat_snapshot),
        );

        assert!(
            res.is_ok(),
            "FATAL: WASM Exection failed at iteration {}",
            i
        );
    }

    // Force the system to register freed memory.
    tokio::time::sleep(std::time::Duration::from_millis(500));
    sys.refresh_memory();
    let final_memory = sys.used_memory();
    println!(" [AUDIT] Fianl System Memory: {} KB", final_memory / 1024);

    // Assert that we didn't permanently leak 500MB - We allow a small variance fro Tokio runtime background allocation.
    let lack_ceiling = initial_memory + (15 * 1024 * 1024);

    assert!(
        final_memory <= lack_ceiling,
        "FATAL: Memory Leak detected. Heap bloated by over 15MB. WASM Linear memory was not dropped."
    );

    println!(
        "[SUCCESS] 100 phantom realities initialized and collapsed cleanly without OOM crashes.  "
    );
}
