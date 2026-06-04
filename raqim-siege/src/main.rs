use md5::{Digest, Md5};
use raqim_siege::{AgentState, AgentStatus, IngressEnvelope};
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

    // Forge the Magazine in RAM
    let mut magazine: Vec<Vec<u8>> = Vec::with_capacity(total_rounds);

    for i in 0..total_rounds {
        // Prebuild the exact AgenttState struct
        let state = AgentState {
            agent_id: Some(agent_id),
            transaction_id: i as u64,
            namespace: "/siege/test".to_string(),
            timestamp: 0,
            status: AgentStatus::Idle,
            text: format!("Seige Payload: {}", i),
        };

        // Serialize via rkyv
        let state_bytes = rkyv::to_bytes::<rkyv::rancor::Error>(&state)
            .unwrap()
            .into_vec();

        // Sign the exact bytes
        let signature = signing_key.sign(&state_bytes);

        // Build the IngressEnvelope
        let envelope = IngressEnvelope {
            intent_path: "/siege/test".to_string(),
            public_key: pub_key_bytes,
            signature: signature.to_bytes(),
            state_bytes: state_bytes,
        };

        let payload_bytes = rkyv::to_bytes::<rkyv::rancor::Error>(&envelope)
            .unwrap()
            .into_vec();

        // Pre-calculate the 4-byte legth prefix for the TCP framing
        let len_prefix = (payload_bytes.len() as u32).to_le_bytes().to_vec();

        let mut network_packet = Vec::new();
        network_packet.extend(len_prefix);
        network_packet.extend(payload_bytes);

        magazine.push(network_packet);
    }

    println!(
        "Magazine loaded with {} signed crytographic rounds. Memory allocated.",
        total_rounds
    );
    println!("Connecting 32 simultaneous TCP sockets Raqim OS...");

    // Split the magzine across the 32 threads
    let chunks: Vec<Vec<Vec<u8>>> = magazine
        .chunks(rounds_per_thread)
        .map(|c| c.to_vec())
        .collect();
    let mut join_handles = Vec::new();

    // Start the clock
    let start_time = Instant::now();

    for chunk in chunks {
        let handle = tokio::spawn(async move {
            let mut socket = TcpStream::connect("127.0.0.1:8080")
                .await
                .expect("Failed to connect to Raqim");

            // Pull the trigger
            for packet in chunk {
                socket.write_all(&packet).await.expect("TCP Write Failed");
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
    println!("SIEGE COMPLETE.");
    println!("Total Thoughts Processed: {}", total_rounds);
    println!("Total Elapsed: {:.2} seconds", elapsed.as_secs_f64());
    println!("Throughput: {:.2} TPS", tps);
    println!("==================================");
}
