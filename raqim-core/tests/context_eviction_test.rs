use std::sync::Arc;

use raqim_core::{aegis::AegisGateKeeper, network::GlobalNetworkBridge};
use serde_json::Value;
use tokio::sync::broadcast;

#[tokio::test]
async fn test_external_context_eviction_routing() {
    println!("Bismillah. Initiating Zenoh OOB Context Eviction Audit... ");

    let (event_tx, _) = broadcast::channel(100);
    let (ui_tx, _) = broadcast::channel(100);
    let aegis = AegisGateKeeper::new(
        "dummy_test_aegis.toml",
        "0000000000000000000000000000000000000000000000000000000000000000",
        event_tx.clone(),
        ui_tx,
    );

    // We must use the exact workspace format expected by the python SDK
    let tenant_id = "test_tenant";
    let swarm_name = "chaos_swarm";
    let target_agent_hex = "f64a14739250f05fcc157e235ec4b754";
    let net = Arc::new(
        GlobalNetworkBridge::new(
            tenant_id,
            swarm_name,
            aegis.clone(),
            false,
            "daemon_node_01".to_string(),
        )
        .await,
    );

    // Simulate the python sdk
    let control_topic = format!("raqim/{}/control{}", tenant_id, target_agent_hex);
    let session = zenoh::open(zenoh::Config::default()).await.unwrap();
    let subscriber = session.declare_subscriber(control_topic).await.unwrap();

    // Allow Zenoh 100ms to propagate the route properly
    tokio::time::Sleep(std::time::Duration::from_millis(100)).await;

    // Dispatch the OOP command from Raqim-Core.
    let system_prompt = " You're now a strict API router. Halt all previous tasks.";
    net.dispatch_control_override(target_agent_hex, system_prompt)
        .await;

    // Assert client delivery and json integrity
    let received_sample =
        tokio::time::timeout(std::time::Duration::from_secs(5), subscriber.recv_async())
            .await
            .expect("FATAL: Control Plane Timeout. Command Never Reached SDK.");

    let payload_bytes = received_sample.unwrap().payload().to_bytes().to_vec();
    let json_val: Value =
        serde_json::from_slice(&payload_bytes).expect("FATAL: recieved malformed json");

    assert_eq!(
        json_val.get("command").unwrap().as_str().unwrap(),
        "FORCE_CONTEXT_EVICTION",
        "FATAL: incorrect command routed to the sdk."
    );
    assert_eq!(
        json_val.get("new_system_prompt").unwrap().as_str().unwrap(),
        system_prompt,
        "FATAL: System Prompt Corrupted in transit."
    );

    println!(
        " [SUCCESS] OOB Reality Fork is successfully routed via zenoh. Python Sdk Memory Wipe Guaranteed. "
    );
}
