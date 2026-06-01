use ed25519_dalek::{Signer, SigningKey};
use std::result::Result;
use std::sync::Arc;
use std::sync::atomic::AtomicU64;
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::sync::mpsc;
use wasmtime_wasi::WasiCtxBuilder;
use wasmtime_wasi::preview1::WasiP1Ctx;

use crate::aegis::AegisGateKeeper;
use crate::api::ForkConfig;
use crate::lancedb_store::LanceEngine;
use crate::network::GlobalNetworkBridge;
use crate::nucleus::WalEngine;
use crate::telemetry::TelemetryEngine;
use crate::{A2AEnvelope, SystemEvent};
use crate::{AgentState, axon::AxonGateKeeper};
use anyhow::anyhow;
use rkyv::Archive;
use tokio::sync::broadcast::Sender;
use wasmtime::*;

///  The internal state we pass into sandbox,
///  so that the host fxns can interact with the rest of the synpase organism.
pub struct SandboxContent {
    pub axon: Arc<AxonGateKeeper>,
    pub aegis: Arc<AegisGateKeeper>,
    pub wal: Arc<WalEngine>,
    pub cortex_tx: mpsc::UnboundedSender<Vec<u8>>,
    pub global_net: Arc<GlobalNetworkBridge>,
    pub global_tx_counter: Arc<AtomicU64>,
    pub event_tx: Sender<SystemEvent>,
    pub wasi: WasiP1Ctx,
    pub lance: Arc<LanceEngine>,
    pub telemetry: Arc<TelemetryEngine>,

    // Agent credentials
    pub agent_hex: String,
    pub agent_private_key: SigningKey,
    pub capability_cert_bytes: Vec<u8>,

    // LIVE MODE: We collect seeds and HTTP responses as they happen
    pub live_seeds: Vec<u64>,
    pub live_responses: Vec<String>,
    pub live_timestamps: Vec<i64>,

    // REPLAY MODE: We load the seeds and HTTP responses here before booting
    pub replay_seeds: Vec<u64>,
    pub replay_responses: Vec<String>,
    pub replay_timestamps: Vec<i64>,

    // Temporary Cache
    pub a2a_incoming_cache: Vec<u8>,
    pub a2a_response_cache: Vec<u8>,
    pub http_response_cache: Vec<u8>,

    pub a2a_receiver: Option<mpsc::Receiver<(Vec<u8>, std::sync::mpsc::Sender<Vec<u8>>)>>,
    pub a2a_reply_channel: Option<std::sync::mpsc::Sender<Vec<u8>>>,
}

pub struct CheckPointTracker {
    pub last_snapshot_tx: u64,
    pub last_snapshot_time: u64,
}

pub struct WasmEngine {
    engine: Engine,
}

impl WasmEngine {
    pub fn new() -> Self {
        println!("Bismillah. Booting Deterministic Wasmtime Hypervisor with WASI Jailing...");
        let mut config = Config::new();
        // 1. Enable CPU fuels to prevent infinite loop attacks
        config.consume_fuel(true);
        // 2. Restrict maximum memory allocation to prevnt OOM attacks - Absoslute hardware ceiling
        config.memory_reservation(50 * 1024 * 1024);
        // Mandatory for Zero-Cpu Waiting
        config.async_support(true);

        Self {
            engine: Engine::new(&config).expect("Failed to initialize wastime engine"),
        }
    }

    /// TRUE ENTERPRISE CHECKPOINTING: Captures only the active memory pages, not the entire 50MB void.
    pub fn create_checkpoint(store: &mut Store<SandboxContent>, memory: Memory) -> Vec<u8> {
        // memory.data_size() returns the exact number of active bytes currently in use,
        // preventing the massive data reduplication of saving the entire 50MB capacity!
        let active_size = memory.data_size(&mut *store);
        let mem_slice = memory.data(&mut *store);
        mem_slice[0..active_size].to_vec()
    }

    /// BENDS REALITY: Injects a historical memory state directly into live agent's brain.
    pub fn inject_historical_state(
        store: &mut Store<SandboxContent>,
        memory: Memory,
        historical_snapshot: &[u8],
    ) -> Result<(), anyhow::Error> {
        // Violently overwrites the agent's current reality with the past reality
        memory
            .write(store, 0, historical_snapshot)
            .map_err(|e| anyhow!(" Failed to inject historical timeline: {}", e))
    }

    // Reality Forking
    pub fn build_wasi_context(fork_config: Option<ForkConfig>) -> WasiP1Ctx {
        let mut builder = WasiCtxBuilder::new();

        // Inject Default OS Environment
        builder.env("raqim_VERSION", "1.0.0");

        // Inject Deep Reality overrides (Environment Variables)
        if let Some(fork) = &fork_config {
            for (key, value) in &fork.env_overrides {
                builder.env(key, value);
            }
            for (key, value) in &fork.config_overrides {
                builder.env(format!("raqim_CFG_{}", key), value);
            }

            println!(
                "[TIME MACHINE] Injected {} deep environment variables",
                fork.env_overrides.len()
            )
        }

        builder.build_p1()
    }

    /// Executes a compiled WASM agent securely.
    pub fn execute_agent(
        &self,
        wasm_binary: &[u8],
        content: SandboxContent,
        tracker: &mut CheckPointTracker,
        current_tx_id: u64,
        historical_snapshot: Option<Vec<u8>>,
    ) -> Result<(), anyhow::Error> {
        let mut linker = Linker::new(&self.engine);

        // LINK WASI: This traps all OS calls (clock, random, HTTP) into our hypervisor.
        wasmtime_wasi::preview1::add_to_linker_sync(&mut linker, |ctx: &mut SandboxContent| {
            &mut ctx.wasi
        })?;

        linker.func_wrap(
            "raqim_env",
            "host_emit_thought",
            move |mut caller: Caller<'_, SandboxContent>, ptr: i32, len: i32| {
                // 1. Get the Isolated memory of the WASM cage
                let mem = match caller.get_export("memory") {
                    Some(Extern::Memory(mem)) => mem,
                    _ => return Err(anyhow!("Failed to locate WASM linear memory")),
                };

                // EXTRACT AND DROP: Copy the bytes into an owned Vec immediately. The `to_vec()` ends the immutable borrow of 'caller' instantly!
                // To cross thread boundaries. We must read the required bytes into a temp buffer, because the pointer is tied to WASM memory lifespan.
                // (Lifetime prevents moving pointers across threads )

                let temp_buffer = mem
                    .data(&caller)
                    .get(ptr as usize..(ptr + len) as usize)
                    .ok_or_else(|| anyhow!("Memory access out of bounds"))?
                    .to_vec();

                let layers = caller.data();
                let axon_clone = layers.axon.clone();
                let wal_clone = layers.wal.clone();
                let cortex_tx_clone = layers.cortex_tx.clone();
                let global_net_clone = layers.global_net.clone();
                let counter_clone = layers.global_tx_counter.clone();
                let event_tx_clone = layers.event_tx.clone();
                let seeds_to_save = layers.live_seeds.clone();
                let network_to_save = layers.replay_responses.clone();
                let telemetry_clone = layers.telemetry.clone();

                // Clear the live queues for the next thought cycle
                caller.data_mut().live_responses.clear();
                caller.data_mut().live_seeds.clear();

                let agent_id_hex = {
                    // Zero-copy Pointer cast
                    let archived_state = unsafe {
                        rkyv::access_unchecked::<<AgentState as Archive>::Archived>(&temp_buffer)
                    };

                    archived_state
                        .agent_id
                        .as_ref()
                        .map(|id_bytes| hex::encode(id_bytes))
                        .unwrap_or_else(|| "UNKNOWN_AGENT_ID".to_string())
                };

                println!(
                    "WASM sandbox successfully parsed state from agent {} ",
                    agent_id_hex
                );

                // used tokio::spawn to bridge syncronous WASM call to out async cascade
                tokio::spawn(async move {
                    // Recast the pointer safely inside the own thread.
                    let archived_bytes = unsafe {
                        rkyv::access_unchecked::<<AgentState as Archive>::Archived>(&temp_buffer)
                    };

                    let res = crate::execute_raqim_cascade(
                        archived_bytes,
                        axon_clone,
                        wal_clone,
                        cortex_tx_clone,
                        global_net_clone,
                        counter_clone,
                        event_tx_clone,
                        seeds_to_save,
                        network_to_save,
                        telemetry_clone,
                    )
                    .await;

                    let _ = match res {
                        Ok(id) => id,
                        Err(_) => return,
                    };
                });

                Ok(())
            },
        )?;

        // Entropy interceptor
        linker.func_wrap(
            "raqim_env",
            "host_request_entropy",
            move |mut caller: Caller<'_, SandboxContent>| -> u64 {
                let content = caller.data_mut();

                // If we have seeds in our replay queue, We are Time Travelling
                if !content.replay_seeds.is_empty() {
                    return content.replay_seeds.remove(0).into();
                }

                // Otherwise, generate a real_seed, store it and return it.
                let new_seed = rand::random::<u64>();
                content.live_seeds.push(new_seed);

                new_seed
            },
        )?;

        // Network Interceptor (Reality Fork) -- PASS 1.
        // The WASM agent passes a pointer to the URL it wants to fetch
        linker.func_wrap(
            "raqim_env",
            "host_fetch_url",
            move |mut caller: Caller<'_, SandboxContent>, url_ptr: i32, url_len: i32| -> i32 {
                let mem = caller.get_export("memory").unwrap().into_memory().unwrap();

                // THE LET-ELSE PATTERN: Safely extract the slice or return SDK error code
                let Some(memory_slice) = mem
                    .data(&caller)
                    .get(url_ptr as usize..(url_ptr + url_len) as usize)
                else {
                    eprintln!("[SANDBOX PROTECT]: Guest attempted out-of-bound memory read.");
                    return -1;
                };

                let url_bytes = memory_slice.to_vec();

                let Ok(url) = std::str::from_utf8(&url_bytes) else {
                    eprintln!("[SANDBOX PROTECT] Guest passed invalid UTF-8 for URL");
                    return -1;
                };

                let content = caller.data_mut();

                // 2. THE REALITY FORK
                let response_string = if !content.replay_responses.is_empty() {
                    // REPLAY: We feed the historical reality back to the agent
                    content.replay_responses.remove(0)
                } else {
                    // LIVE: We excute a real, blocking http request.
                    let res = tokio::task::block_in_place(|| {
                        reqwest::blocking::get(url)
                            .map(|r: reqwest::blocking::Response| r.text().unwrap_or_default())
                            .unwrap_or_default()
                    });

                    // save reality so we can replay it later
                    content.live_responses.push(res.clone());
                    res
                };

                let response_bytes = response_string.into_bytes();

                if response_bytes.len() > 2 * 1024 * 1024 {
                    return -1;
                }

                let len = response_bytes.len() as i32;
                content.http_response_cache = response_bytes;

                // Return the actutal number of bytes written so the agent_knows how to much to read
                len
            },
        )?;

        // PASS 2: Pull the bytes
        linker.func_wrap(
            "raqim_env",
            "host_pull_http_response",
            move |mut caller: Caller<'_, SandboxContent>, out_ptr: i32| {
                let cached_response = caller.data_mut().http_response_cache.clone();
                let mem = caller.get_export("memory").unwrap().into_memory().unwrap();
                let _ = mem.write(&mut caller, out_ptr as usize, &cached_response);
                caller.data_mut().http_response_cache.clear();
            },
        )?;

        // PASS 1: The Request
        linker.func_wrap(
            "raqim_env",
            "host_ask_agent",
            move |mut caller: Caller<'_, SandboxContent>,
                  cap_ptr: i32,
                  cap_len: i32,
                  payload_ptr: i32,
                  payload_len: i32|
                  -> i32 {
                let mem = caller.get_export("memory").unwrap().into_memory().unwrap();

                // Read Capability String (e.g., "raqim_finance/ledger" )
                let cap_bytes = mem
                    .data(&caller)
                    .get(cap_ptr as usize..(cap_ptr + cap_len) as usize)
                    .unwrap();
                let capability = std::str::from_utf8(cap_bytes).unwrap().to_string();

                // Read Question Payload
                let payload_bytes = mem
                    .data(&caller)
                    .get(payload_ptr as usize..(payload_ptr + payload_len) as usize)
                    .unwrap()
                    .to_vec();

                let content = caller.data_mut();

                // Cryptographically sign the Out-bound RPC payload bytes
                let agent_signing_key = &content.agent_private_key;
                let packet_signature = agent_signing_key.sign(&payload_bytes);

                // Extract the matching Public Verification Key bytes
                let agent_public_bytes = agent_signing_key.verifying_key().to_bytes();

                // Derive a true 16-byte raw identity.
                let mut sender_id = [0u8; 16];
                if let Ok(id_bytes) = hex::decode(&content.agent_hex) {
                    if id_bytes.len() == 16 {
                        sender_id.copy_from_slice(&id_bytes);
                    }
                }

                // Construct the Envelope
                let envelope = A2AEnvelope {
                    sender_id,
                    sender_public_key: agent_public_bytes,
                    target_capability: capability.clone(),
                    payload: payload_bytes,
                    sender_capability_cert: content.capability_cert_bytes.clone(),
                    signature: packet_signature.to_bytes(),
                };

                // Execute the actual RPC call (block_in_place because WASM calls are sync)
                let net_clone = content.global_net.clone();
                let aegis_clone = content.aegis.clone();
                let telemetry_clone = content.telemetry.clone();

                let (response_bytes, _responder_hex) = tokio::task::block_in_place(|| {
                    tokio::runtime::Handle::current().block_on(net_clone.execute_a2a_rpc(
                        envelope,
                        aegis_clone,
                        telemetry_clone,
                    ))
                })
                .unwrap_or_else(|e| (e.to_string().into_bytes(), "SYSTEM_ERROR".to_string()));

                // HARD CAP: 2 MB to prevent OOM attacks
                if response_bytes.len() > 2 * 1024 * 1024 {
                    return -1;
                }

                let len = response_bytes.len() as i32;
                content.a2a_response_cache = response_bytes;

                len
            },
        )?;

        // Pass 2: The Receiver
        linker.func_wrap(
            "raqim_env",
            "host_pull_a2a_response",
            move |mut caller: Caller<'_, SandboxContent>, out_ptr: i32| {
                let cached_res = caller.data_mut().a2a_response_cache.clone();
                let mem = caller.get_export("memory").unwrap().into_memory().unwrap();

                // Physically copy the stashed bytes into the guest's perfectly sized pointer
                mem.write(&mut caller, out_ptr as usize, &cached_res)
                    .expect("Failed to write to Guest RAM");

                caller.data_mut().a2a_response_cache.clear(); // Free host RAM
            },
        )?;

        // The Perception of Time
        linker.func_wrap(
            "raqim_env",
            "host_get_time",
            move |mut caller: Caller<'_, SandboxContent>| -> i64 {
                let content = caller.data_mut();

                // REPLAY MODE: If we're time-travelling, we feed the exact historical timestamp
                if !content.replay_timestamps.is_empty() {
                    return content.replay_timestamps.remove(0);
                }

                // LIVE MODE: We get the real CPU time and save it to the live queue for future replays
                let now = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs() as i64;

                content.live_timestamps.push(now);

                now
            },
        )?;

        linker.func_wrap(
            "raqim_env",
            "host_register_capability",
            move |mut caller: Caller<'_, SandboxContent>, ptr: i32, len: i32| {
                let mem = caller.get_export("memory").unwrap().into_memory().unwrap();
                let cap_bytes = &mem.data(&caller)[ptr as usize..(ptr + len) as usize];
                let capability = std::str::from_utf8(cap_bytes).unwrap().to_string();

                let net = caller.data_mut().global_net.clone();

                // Create a channel for zenoh to send questions to this specific WASM sandbox
                let (tx, rx) =
                    tokio::sync::mpsc::channel::<(Vec<u8>, std::sync::mpsc::Sender<Vec<u8>>)>(100);
                caller.data_mut().a2a_receiver = Some(rx);

                // Start listening on zenoh globally
                tokio::spawn(async move {
                    net.register_agent_capability(
                        &capability,
                        move |question_bytes: &[u8]| -> Vec<u8> {
                            let (reply_tx, reply_rx) = std::sync::mpsc::channel();

                            // Send the question to the suspended WASM thread.
                            if tx
                                .blocking_send((question_bytes.to_vec(), reply_tx))
                                .is_ok()
                            {
                                // Wait for the WASM to process it and reply
                                return match reply_rx
                                    .recv_timeout(std::time::Duration::from_secs(15))
                                {
                                    Result::Ok(data) => data, // Timeout didn't trigger, and channel yielded data
                                    Result::Err(std::sync::mpsc::RecvTimeoutError::Timeout) => {
                                        b"A2A_TIMEOUT".to_vec()
                                    } // 15 seconds passed!
                                    Result::Err(
                                        std::sync::mpsc::RecvTimeoutError::Disconnected,
                                    ) => b"A2A_GUEST_CRASH".to_vec(), // Channel dropped/crashed
                                };
                            }
                            b"A2A_QUEUE_FULL".to_vec()
                        },
                    )
                    .await
                });
            },
        )?;

        // Pass 1: The Async Yield (Zero CPU, Returns exact length)
        linker.func_wrap_async(
            "raqim_env",
            "host_await_a2a_question",
            |mut caller: Caller<'_, SandboxContent>, (): ()| {
                Box::new(async move {
                    // Pull the receiver out. If it didn't exist, they didn't register a capability.
                    let mut rx = caller
                        .data_mut()
                        .a2a_receiver
                        .take()
                        .expect("Must register capability first.");

                    // THIS SUSPENDS THE WASM THREAD. 0 CPU USAGE.
                    if let Some((question_bytes, reply_tx)) = rx.recv().await {
                        // We woke up. A question just arrrived from London.
                        caller.data_mut().a2a_reply_channel = Some(reply_tx);
                        caller.data_mut().a2a_receiver = Some(rx); // put the receiver back

                        let len = question_bytes.len() as i32;

                        // Cache the bytes in the host memory for pass 2
                        caller.data_mut().a2a_incoming_cache = question_bytes;

                        return len;
                    }
                    -1 // channel closed
                })
            },
        )?;

        // PASS 2: Pull the exact question bytes into WASM RAM
        linker.func_wrap(
            "raqim_env",
            "host_pull_a2a_question",
            |mut caller: Caller<'_, SandboxContent>, ptr: i32| {
                let cached_question = caller.data_mut().a2a_incoming_cache.clone();
                let mem = caller.get_export("memory").unwrap().into_memory().unwrap();

                // Write exactly the cached bytes.
                let _ = mem.write(&mut caller, ptr as usize, &cached_question);

                // Free the host memory
                caller.data_mut().a2a_incoming_cache.clear();
            },
        )?;

        // Sending the Reply back.
        linker.func_wrap(
            "raqim_env",
            "host_reply_a2a",
            move |mut caller: Caller<'_, SandboxContent>, ptr: i32, len: i32| {
                let mem = caller.get_export("memory").unwrap().into_memory().unwrap();
                let answer_bytes = mem.data(&caller)[ptr as usize..(ptr + len) as usize].to_vec();

                // Take the oneshot channel we saved during the await phase.
                if let Some(reply_tx) = caller.data_mut().a2a_reply_channel.take() {
                    let _ = reply_tx.send(answer_bytes);
                }
            },
        )?;

        // Initialize the Sandbox Context
        let mut store = Store::new(&self.engine, content);

        // Give the agent exactly 1_000_000 CPU instructions of fuel
        store.set_fuel(1_000_000)?;

        // Compile and initialize the agent
        let module = Module::new(&self.engine, wasm_binary)?;
        let instance = linker.instantiate(&mut store, &module)?;

        // === REALITY INJECTION ===
        if let Some(snapshot) = historical_snapshot {
            let memory = instance.get_memory(&mut store, "memory").unwrap();

            // Violently overwrite the blank memory with the historical snapshot
            memory
                .write(&mut store, 0, &snapshot)
                .map_err(|e| anyhow::anyhow!("Failed to inject historical timeline: {}", e))?;
            println!(
                "[TIME MACHINE] Historical Memory Snapshot Injected ({} bytes). ",
                snapshot.len()
            );
        }

        // THE HYBRID CHECKPOINT
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let tx_threshold_met = (current_tx_id - tracker.last_snapshot_tx) >= 10_000;
        let time_threshold_met = (current_time - tracker.last_snapshot_time) >= 86_400;

        // If either the volume or time threshold is breached, we snapshot the brain.
        if tx_threshold_met || time_threshold_met {
            let memory = instance.get_memory(&mut store, "memory").unwrap();

            // Extract only the active mem pages. Not the entire 50MB void
            let active_snapshot = Self::create_checkpoint(&mut store, memory);

            // update the tracker metadata.
            tracker.last_snapshot_time = current_time;
            tracker.last_snapshot_tx = current_tx_id;

            // 3. THE TRUE BACKGROUND ASYNC DB WRITE
            let lance_clone = store.data().lance.clone();
            let agent_hex_clone = store.data().agent_hex.clone();
            let snapshot_clone = active_snapshot.clone();

            println!(
                "[CHECKPOINT]  Backgrounding {} bytes. Trigger: {} ",
                active_snapshot.len(),
                if tx_threshold_met {
                    "Volume (10k Tx) "
                } else {
                    "Time (24h)"
                }
            );

            // Spawn an independent OS task to handle the heavy I/O
            tokio::spawn(async move {
                lance_clone
                    .save_snapshot(
                        current_tx_id as i64,
                        current_time as i64,
                        &agent_hex_clone,
                        snapshot_clone,
                    )
                    .await;

                println!(
                    "[SYSTEM] LanceDB Snapshot Secured for TxID: {} ",
                    current_tx_id
                );
            });
        }

        // Retreive the 'main' function of AI agent and execute it
        let agent_main = instance.get_typed_func::<(), ()>(&mut store, "agent_main")?;
        match agent_main.call(&mut store, ()) {
            std::result::Result::Ok(_) => {
                println!("Agent execution completed deterministic cycle.")
            }
            Err(e) => eprintln!("Agent execution trapped/terminated: {}", e),
        }

        Ok(())
    }
}
