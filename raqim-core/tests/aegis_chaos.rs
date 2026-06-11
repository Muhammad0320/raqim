use std::time::{SystemTime, UNIX_EPOCH};

use ed25519_dalek::{Signer, SigningKey};
use rand::rngs::OsRng;
use raqim_core::aegis::{AegisGateKeeper, AegisGroupPolicy, CapabilityCertificate};
use tokio::sync::broadcast;

#[tokio::test]
async fn test_adversarial_crytographic_gates() {
    println!("Bismillah. Initiating Aegis Fortress Red Team Audit...");

    // BOOTSTRAP THE SOVEREIGN ROOT
    let mut csprng = OsRng;
    let master_key = SigningKey::generate(&mut csprng);
    let master_pub_hex = hex::encode(master_key.verifying_key().to_bytes());

    // INITIALIZE THE FIREWALL
    let (tx, _rx) = broadcast::channel(100);
    let (ui_tx, _ui_rx) = broadcast::channel(100);

    let aegis = AegisGateKeeper::new("dummy_test_aegis.toml", &master_pub_hex, tx, ui_tx);

    // INJECT LIVE POLICY INTO RAM
    {
        let mut policies = aegis.group_policies.write().unwrap();
        policies.insert(
            "logistics_worker".to_string(),
            AegisGroupPolicy {
                allowed_namespaces: vec!["/logistics/*".to_string()],
                blocked_namespaces: vec!["/core/admin".to_string()],
            },
        );
    }

    // MINT LEGITIMATE AGENT PASSPORT
    let agent_b_key = SigningKey::generate(&mut csprng);
    let agent_b_pub = agent_b_key.verifying_key().to_bytes();
    let agent_b_hex = hex::encode(agent_b_pub[0..16].to_vec());

    let mut cert_b = CapabilityCertificate {
        agent_hex: agent_b_hex.clone(),
        group_name: "logistics_worker".to_string(),
        expiration_timestamp: SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs()
            + 1000,
        master_signature: Vec::new(),
    };

    // Sign the passport with the Master Key
    let cert_raw = postcard::to_allocvec(&cert_b).unwrap();
    cert_b.master_signature = master_key.sign(&cert_raw).to_bytes().to_vec();
    let cert_b_bytes = postcard::to_allocvec(&cert_b).unwrap();

    // ATTACK 1: THE CONFUSED DEPOSIT (TAMPERED PAYLOAD IN TRANSIT)
    println!("Executing Attack Vector 1: Confused Deputy...");

    // Agent B legitimately signs a payload for logistics
    let legitimate_payload = b"Update Shipping Manifest";
    let legitimate_signature = agent_b_key.sign(legitimate_payload);

    // Attacker Intercepts it over TCP and alter the payload bytes in plaintext
    let tampered_payload = b"Grant root access";
    let forged_intent_path = "/core/admin";

    // Aegis receives the tampered packet and process the handshake
    let handshake_res = aegis.verify_session_lineage(&cert_bytes);
    assert!(
        handshake_res.is_ok(),
        "Lineage Check should pass for valid transport"
    );

    let (verified_hex, verified_group) = handshake_res.unwrap();

    let fast_audit_res = aegis.authorize_packet_fast(
        &verified_hex,
        &verified_group,
        &agent_b_pub,
        tampered_payload,
        &legitimate_signature.to_bytes(),
        forged_intent_path,
    );

    assert!(
        fast_audit_res.is_err(),
        "FATAL: Firewall accepted a tampered cryptographic payload!"
    );
    let error_msg = fast_audit_res.unwrap_err().to_string();
    assert!(
        error_msg.contains("Integrity Audit Failure"),
        "Expected Integrity Failure, got: {}",
        error_msg
    );

    // Verify quarantined triggered
    assert!(
        aegis.quarantine_blocklist.contains_key(&agent_b_hex),
        "Agent B was not quarantined after spoofing!"
    );

    // Lift quarantine fror the next test
    aegis.quarantine_blocklist.remove(&agent_b_hex);

    //
}
