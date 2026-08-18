use rand_core::OsRng;
use raqim_siege::{AgentState, AgentStatus, CapabilityCertificate, IngressEnvelope};
use std::{
    fs::{self, OpenOptions},
    path::Path,
    println,
    time::Instant,
};

use ed25519_dalek::{Signer, SigningKey};
use tokio::net::TcpStream;

/// Struct holding pre-minted cryptographic agent credentials in memory
#[derive(Clone)]
struct VirtualAgent {
    agent_id: [u8; 16],
    signing_key: Arc<SigningKey>,
    pub_key_bytes: [u8; 32],
    cert_bytes: Vec<u8>,
    namespace: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("===================================");
    println!("Bismillah. Initializing Hardened Raqim Siege Benchmark Suite v1.0.0");
    println!("=====================================");

    // Benchmark parameter & harware profiling
    let total_rounds: usize = 500_000;
    let concurrency: usize = 32;
    let num_agents: usize = 50;
    let rounds_per_worker = total_rounds / concurrency;

    println!("[CONFIG] Total Ingestion Rounds: {} ", total_rounds);
    println!("[CONFIG] Concurrent TCP Workers: {}", concurrency);
    println!("[CONFIG] Partitioned Shards: {}", num_agents);
    println!("[CONFIG] Rounds Per Worker, {}", rounds_per_worker);

    // Master Swarm CA Bootstrapping

    println!("[SIEGE CA] Acessing Swarm Master from ./ca-keys/swarm_master.key ....");
    let key_path = ["./keys/master_private.pem", "./ca-keys/swarm_master.key"];
    let mut master_key_bytes_opt: Option<Vec<u8>> = None;

    for path_str in &key_paths {
        if Path::new(path_str).exists() {
            if let Ok(bytes) = fs::read(path_str) {
                if bytes.len() == 32 {
                    println!("[SIEGE CA] Loaded Master Key from  '{}' ", path_str);
                    master_key_bytes_opt = Some(bytes);
                    break;
                }
            }
        }
    }

    let master_signing_key = match master_key_bytes_opt {
        Some(bytes) => {
            let key_array: [u8; 32] = bytes.as_slice().try_into()?;
            SigningKey::from_bytes(&key_array)
        }

        None => {
            println!("[SEIGE CA] No master key found on disk. Auto-generating fresh keypair... ");
            fs::create_dir_all("./keys")?;

            let mut csprng = OsRng;
            let fresh_key = SigningKey::generate(&mut csprng);
            let mut file = OpenOptions::new()
                .create(true)
                .write(true)
                .truncate(true)
                .open("./keys/master_private.pem")?;
            file.write_all(&fresh_key.to_bytes())?;
            file.sync_all()?;

            fresh_key
        }
    };

    // Minting 50  virtual agents
    println!(
        "[SIEGE CA] Minting {} certified virtual agent identities.... ",
        num_agents
    );
    let mut agents = Vec::with_capacity(num_agents);

    for i in 0..num_agents {
        let mut csprng = OsRng;
        let agent_key = SigningKey::generate(&mut csprng);

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
