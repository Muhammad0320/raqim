use md5::{Digest, Md5};
use rand_core::OsRng;
use raqim_siege::{AgentState, AgentStatus, CapabilityCertificate, IngressEnvelope};
use std::{fs, time::Instant};

use ed25519_dalek::{Signer, SigningKey};
use tokio::{io::AsyncWriteExt, net::TcpStream};

#[tokio::main]
async fn main() {
    println!("Bismillah. Forging the Enterprise Distributed Magazine...");

    let total_rounds = 1_000_000;
    let concurrency = 32;
    let num_agents = 50;
    let rounds_per_thread = total_rounds / concurrency;

    // Load the Soverign Master Key directly from the secure disk vault
    println!("[SIEGE CA] Acessing Swarm Master from ./ca-keys/swarm_master.key ....");
    let master_key_bytes = fs::read("./ca-keys/swarm_master.key")
        .expect("FATAL: Master Key Missing. Run raqim-core once to bootstrap keys ");

    let master_key_array: [u8; 32] = master_key_bytes.as_slice().try_into().unwrap();
    let master_signing_key = SigningKey::from_bytes(&master_key_array);

    // Forge 50 distict agents and Certificates.
    println!(
        "[SIEGE CA] Minting {} Crytographic Identity and Passports.... ",
        num_agents
    );
    let mut agents = Vec::with_capacity(num_agents);

    for i in 0..num_agents {
        let mut csprng = OsRng;
        let agent_signing_key = SigningKey::generate(&mut csprng);
        let pub_key_bytes = agent_signing_key.verifying_key().to_bytes();

        let mut hasher = Md5::new();
        hasher.update(pub_key_bytes);
        let agent_id: [u8; 16] = hasher.finalize().into();
        let agent_hex = hex::encode(agent_id);

        let namespace = format!("/siege/shard_{:02}", i);

        // Forge the capability passport.
        let mut cert = CapabilityCertificate {
            agent_hex: agent_hex.clone(),
            group_name: "siege_tester".to_string(),
            expiration_timestamp: u64::MAX,
            master_signature: Vec::new(),
        };

        // Sign the passport with the Master Key
        let serialized_raw = postcard::to_allocvec(&cert).unwrap();

        let master_sig = master_signing_key.sign(&serialized_raw);
        cert.master_signature = master_sig.to_bytes().to_vec();

        let cert_bytes = postcard::to_allocvec(&cert).unwrap();
        agents.push((
            agent_id,
            agent_signing_key,
            pub_key_bytes,
            cert_bytes,
            namespace,
        ));
    }

    println!("[SIEGE] Agents deployed. Allocating 1,000,000 rounds in RAM... ");

    // Forge the Magazine in RAM (Interleaved to guarantee lock-free parallemlism)

    let mut magazine: Vec<Vec<u8>> = Vec::with_capacity(total_rounds);

    for i in 0..total_rounds {
        // Interleave Selection. Round 0 -> Agent 0, Round 1 -> Agent 1 ... Round 50 -> Agent 0
        let agent_idx = i % num_agents;
        let (agent_id, ref signing_key, pub_key_bytes, ref cert_bytes, ref namespace) =
            agents[agent_idx];

        let state = AgentState {
            agent_id: Some(agent_id),
            transaction_id: i as u64,
            timestamp: 0,
            status: AgentStatus::Idle,
            text: format!("Siege Parallel Payload: {}", i),
            namespace: namespace.clone(),
        };

        let state_bytes = rkyv::to_bytes::<rkyv::rancor::Error>(&state)
            .unwrap()
            .into_vec();
        let signature = signing_key.sign(&state_bytes);

        let envelope = IngressEnvelope {
            intent_path: namespace.clone(),
            public_key: pub_key_bytes,
            signature: signature.to_bytes(),
            state_bytes,
            capability_cert: cert_bytes.clone(),
        };

        let payload_bytes = rkyv::to_bytes::<rkyv::rancor::Error>(&envelope)
            .unwrap()
            .into_vec();
        let len_prefix = (payload_bytes.len() as u32).to_le_bytes().to_vec();

        let mut network_packet = Vec::with_capacity(len_prefix.len() + payload_bytes.len());
        network_packet.extend(len_prefix);
        network_packet.extend(payload_bytes);

        magazine.push(network_packet);
    }

    println!("Magazine loaded. Distributing to multi-core network streams...");

    // Split the magazine across 32 threads
    let chunks: Vec<Vec<Vec<u8>>> = magazine
        .chunks(rounds_per_thread)
        .map(|c| c.to_vec())
        .collect();
    let mut join_handles = Vec::new();

    let start_time = Instant::now();

    for chunk in chunks {
        let handle = tokio::spawn(async move {
            let mut socket = TcpStream::connect("127.0.0.1:8080")
                .await
                .expect("Failed to connect to Raqim Core TCP listener");

            // No Nagle's algorithm delay for pure throuput benchmark
            let _ = socket.set_nodelay(true);

            // Monolithic buffer aggregation: Calculate the total capacity required to avoid costly heap allocation.
            let total_size: usize = chunk.iter().map(|p| p.len()).sum();
            let mut super_buffer = Vec::with_capacity(total_size);

            // Pull the trigger
            for packet in chunk {
                super_buffer.extend(packet);
            }

            // Pull the trigger: Blast the entire magazine in a single kernel syscall.
            if let Err(e) = socket.write_all(&super_buffer).await {
                eprintln!("[SEIGE THRREAD WARN]: TCP write interrupted: {}", e)
            }
        });

        join_handles.push(handle);
    }

    // Wait for all 32 threads to empty their magazines
    for handle in join_handles {
        let _ = handle.await;
    }

    let elapsed = start_time.elapsed();
    let tps = (total_rounds as f64) / elapsed.as_secs_f64();

    println!("==================================");
    println!("MULTI-SHHARD SIEGE COMPLETE.");
    println!("Total Thoughts Processed: {}", total_rounds);
    println!("Concurrent Shards Hit: {}", num_agents);
    println!("Total Elapsed: {:.2} seconds", elapsed.as_secs_f64());
    println!("Throughput: {:.2} TPS", tps);
    println!("==================================");
}
