use raqim_core::aegis::AegisGateKeeper;
use raqim_core::network::GlobalNetworkBridge;
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::broadcast;

#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
async fn test_a2a_timeout_resilience() {
    println!("Bismillah. Initiating A2A Chaos Starvation Test...");

    // 1. MOCK INFRASTRUCTURE BOOT
    let (event_tx, _) = broadcast::channel(100);
    let (ui_tx, _) = broadcast::channel(100);

    // We pass a dummy master key for the test firewall
    let aegis = AegisGateKeeper::new(
        "aegis.toml",
        "0000000000000000000000000000000000000000000000000000000000000000",
        event_tx,
        ui_tx,
    );

    let net = Arc::new(
        GlobalNetworkBridge::new(
            "test_tenant",
            "chaos_swarm",
            aegis.clone(),
            false, // Locked to local loopback
            "chaos_node_01".to_string(),
        )
        .await,
    );

    // 2. THE BLACK HOLE: Register a capability that intentionally starves the thread
    let blackhole_cap = "chaos/blackhole";
    net.register_agent_capability(blackhole_cap, |_question| {
        // We force the responding thread to sleep for 20 seconds, simulating a deadlocked LLM API
        std::thread::sleep(std::time::Duration::from_secs(20));
        b"This should never be received".to_vec()
    })
    .await;

    // Allow Zenoh 100ms to propagate the route locally
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

    // 3. CONSTRUCT THE DOOMED ENVELOPE
    let envelope = A2AEnvelope {
        sender_id: [2u8; 16],
        sender_public_key: [0u8; 32],
        target_capability: blackhole_cap.to_string(),
        payload: b"Are you there?".to_vec(),
        signature: [0u8; 64],
        sender_capability_cert: Vec::new(),
    };

    let telemetry = raqim_core::telemetry::TelemetryEngine::new("test", "test");

    // 4. THE EXECUTION AND ASSERTION
    let start_time = Instant::now();

    // Note: In a real test, you would forge a valid cert to bypass the Aegis firewall here,
    // or you can implement a test-flag in `verify_and_authorize_ingress` that bypasses crypto for unit tests.
    // Assuming the envelope clears the firewall, we test the network timeout:

    let result = net.execute_a2a_rpc(envelope, aegis, telemetry).await;

    let elapsed = start_time.elapsed().as_secs();

    // 5. THE PHYSICS CHECK
    // If the timeout works, it must fail.
    assert!(
        result.is_err(),
        "FATAL: The A2A call succeeded when it should have timed out!"
    );

    let err_msg = result.unwrap_err().to_string();
    assert!(
        err_msg.contains("A2A Timeout"),
        "FATAL: Returned the wrong error. Expected A2A Timeout, got: {}",
        err_msg
    );

    // If the thread was held hostage, elapsed would be 20+ seconds.
    // If the timeout supervisor fired correctly, elapsed will be exactly 15 seconds.
    assert!(
        elapsed >= 15 && elapsed < 17,
        "FATAL: Scheduler starvation! Thread yielded at {} seconds instead of 15s.",
        elapsed
    );

    println!(
        "[SUCCESS] Chaos test passed. Tokio thread pool yielded safely at 15 seconds. Scheduler protected."
    );
}
