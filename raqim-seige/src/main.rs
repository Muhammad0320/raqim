use std::time::Instant;

use ed25519_dalek::{Signer, SigningKey};
use raqim_core::AgentState;
use tokio::{io::AsyncWriteExt, net::TcpStream};

use tokio::io::AsyncWriteExt;

#[tokio::main]
async fn main() {
    println!("Bismillah. Forging the Loaded Magazine...");

    let total_rounds = 1_000_000;
    let concurrency = 32;
    let rounds_per_thread = total_rounds / concurrency;

    // The key
    let secret_key_bytes = [0u8; 32];
    let signing_key = SigningKey::from_bytes(&secret_key_bytes);
    let agent_hex = "".to_string();

    // Forge the Magazine in RAM
    let mut magazine: Vec<Vec<u8>> = Vec::with_capacity(total_rounds);

    let agent_id = [0u8; 16];

    for i in 0..total_rounds {
        // Prebuild the exact AgenttState struct
        let state = AgentState {
            agent_id: Some(agent_id),
            transaction_id: i as u64,
            namespace: "/siege/test".to_string(),
            timestamp: 0,
            status: raqim_core::AgentStatus::Idle,
            text: format!("Seige Payload: {}", i),
        };

        // Serialize via rkyv
        let payload_bytes = rkyv::to_bytes::<rkyv::rancor::Error>(&state)
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
