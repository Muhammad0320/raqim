use std::sync::Arc;

use raqim_core::{AgentState, state::SwarmStateRegistry};

#[tokio::test]
async fn test_crdt_split_brain_convergence() {
    println!("Bismillah. Initiating Split-Brain Chaos Test...");

    let namespace = "/siege/global_shard";

    //  PHYSICAL ISOLATION: Boot 3 distict servers in memory
    let registry_a = Arc::new(SwarmStateRegistry::new());
    let registry_b = Arc::new(SwarmStateRegistry::new());
    let registry_c = Arc::new(SwarmStateRegistry::new());

    // Helper closure to forge a state
    let forge_state = |tx_id: u64, text: &str| AgentState {
        agent_id: Some([1u8; 16]),
        transaction_id: tx_id,
        timestamp: 1000000,
        status: raqim_core::AgentStatus::Idle,
        text: text.to_string(),
        namespace: namespace.to_string(),
    };

    let agent_id_hex = hex::encode([1u8; 12]);

    // PHASE 1: THE FORK (NETWORK PARTITION)

    // Node A and B generate thoughts.
    let state_a1 = forge_state(1, "NODE A: Intial Thought");
    let delta_a1 = registry_a
        .get_or_create_brain(namespace.clone())
        .append_agent_thought(&agent_id_hex, &state_a1)
        .unwrap();

    // Node C also generates a thought simultaneously but it's isolated
    let state_c1 = forge_state(2, "NODE C: Isolated Thought");
    let delta_c1 = registry_c
        .get_or_create_brain(namespace.clone())
        .append_agent_thought(&agent_id_hex, &state_c1)
        .unwrap();

    // Phase 2: Partial Sync (A and B talk, C remains isolated)
    registry_b
        .get_or_create_brain(namespace.clone())
        .assimilate_foreign_thought(&delta_a1);

    let state_b1 = forge_state(3, "NODE B: Reply to A");
    let delta_b1 = registry_b
        .get_or_create_brain(namespace.clone())
        .append_agent_thought(&agent_id_hex, &state_b1)
        .unwrap();

    registry_a
        .get_or_create_brain(namespace.clone())
        .assimilate_foreign_thought(&delta_b1);

    // Phase 3: The heal the Reconnection
    // The partition ends: Node C's Zenoh router floods the network with it's missing delta. Node A and B floods C with their missing delta
    registry_c
        .get_or_create_brain(namespace.clone())
        .assimilate_foreign_thought(&delta_a1)
        .unwrap();
    registry_c
        .get_or_create_brain(namespace.clone())
        .assimilate_foreign_thought(&delta_b1)
        .unwrap();

    registry_a
        .get_or_create_brain(namespace.clone())
        .assimilate_foreign_thought(&delta_c1)
        .unwrap();
    registry_b
        .get_or_create_brain(namespace.clone())
        .assimilate_foreign_thought(&delta_c1)
        .unwrap();

    // Phase 4: Mathematical assertion.
    // Wr export the entire raw json graph of the loro document for all 3 nodes
    let json_a = registry_a
        .get_or_create_brain(namespace.clone())
        .doc
        .read()
        .export_json_updates(
            &loro::VersionVector::new(),
            &registry_a
                .get_or_create_brain(namespace.clone())
                .doc
                .read()
                .oplog_vv(),
        );
    let json_b = registry_b
        .get_or_create_brain(namespace.clone())
        .doc
        .read()
        .export_json_updates(
            &loro::VersionVector::new(),
            &registry_b
                .get_or_create_brain(namespace.clone())
                .doc
                .read()
                .oplog_vv(),
        );
    let json_c = registry_c
        .get_or_create_brain(namespace.clone())
        .doc
        .read()
        .export_json_updates(
            &loro::VersionVector::new(),
            &registry_c
                .get_or_create_brain(namespace.clone())
                .doc
                .read()
                .oplog_vv(),
        );

    // If the CRDT Math is flawless, A B and C must be identical despite the temporal ordering of events.
    assert_eq!(
        json_a, json_b,
        "FATAL: Node A and Node B Failed to converge"
    );
    assert_eq!(
        json_b, json_c,
        "FATAL: Node C failed to merge forked reality upon reconnection!"
    );

    println!(
        "[SUCCESS] Split-Brain Resolved. All nodes converged tot absolute zero lock consistency "
    );
}
