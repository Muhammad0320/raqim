use std::sync::Arc;
use std::sync::atomic::AtomicU64;
use std::time::{SystemTime, UNIX_EPOCH};
use wasmtime_wasi::WasiCtx;

use crate::aegis::AegisGateKeeper;
use crate::lancedb_store::LanceEngine;
use crate::network::GlobalNetworkBridge;
use crate::nucleus::WalEngine;
use crate::{A2AEnvelope, SystemEvent};
use crate::{AgentState, axon::AxonGateKeeper, state::SwarmState};
use anyhow::Ok;
use anyhow::anyhow;
use rkyv::Archive;
use tokio::sync::broadcast::Sender;
use tokio::sync::mpsc;
use wasmtime::*;

///  The internal state we pass into sandbox,
///  so that the host fxns can interact with the rest of the synpase organism.
pub struct SandboxContent {
    pub axon: Arc<AxonGateKeeper>,
    pub aegis: Arc<AegisGateKeeper>,
    pub brain: Arc<SwarmState>,
    pub wal: Arc<WalEngine>,
    pub cortex_tx: mpsc::UnboundedSender<Vec<u8>>,
    pub global_net: Arc<GlobalNetworkBridge>,
    pub global_tx_counter: Arc<AtomicU64>,
    pub event_tx: Sender<SystemEvent>,
    pub wasi: WasiCtx,
    pub lance: Arc<LanceEngine>,
    pub agent_hex: String,

    // LIVE MODE: We collect seeds and HTTP responses as they happen
    pub live_seeds: Vec<u64>,
    pub live_responses: Vec<String>,

    // REPLAY MODE: We load the seeds and HTTP responses here before booting
    pub replay_seeds: Vec<u64>,
    pub replay_responses: Vec<String>,
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
        config.static_memory_maximum_size(50 * 1024 * 1024);

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

    /// Takes a full byte-for-byte snapshot of the agent's linear memory. The foundation of the Time Machine.
    pub fn extract_memory_snapshot(store: &mut Store<SandboxContent>, memory: Memory) -> Vec<u8> {
        //  We literally copy the entire working brain of the agent into a vector.
        memory.data(store).to_vec()
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

    /// Executes a compiled WASM agent securely.
    pub fn execute_agent(
        &self,
        wasm_binary: &[u8],
        content: SandboxContent,
        tracker: &mut CheckPointTracker,
        current_tx_id: u64,
    ) -> Result<(), anyhow::Error> {
        let mut linker = Linker::new(&self.engine);

        // LINK WASI: This traps all OS calls (clock, random, HTTP) into our hypervisor.
        wasmtime_wasi::p1::wasi_snapshot_preview1::add_to_linker(
            &mut linker,
            |ctx: &mut SandboxContent| &mut ctx.wasi,
        )?;

        linker.func_wrap(
            "synapse_env",
            "host_emit_thought",
            move |mut caller: Caller<'_, SandboxContent>, ptr: i32, len: i32| {
                // 1. Get the Isolated memory of the WASM cage
                let mem = match caller.get_export("memory") {
                    Some(Extern::Memory(mem)) => mem,
                    _ => return Err(anyhow!("Failed to locate WASM linear memory")),
                };

                // 2. Read the raw bytes safely from the WASM linear memory
                let data = mem
                    .data(&caller)
                    .get(ptr as usize..(ptr + len) as usize)
                    .ok_or_else(|| anyhow!("Memory access out of bounds"))?;

                // Zero-copy Pointer cast
                let archived_state =
                    unsafe { rkyv::access_unchecked::<<AgentState as Archive>::Archived>(data) };

                let layers = caller.data();

                let brain_clone = layers.brain.clone();
                let axon_clone = layers.axon.clone();
                let wal_clone = layers.wal.clone();
                let cortex_tx_clone = layers.cortex_tx.clone();
                let global_net_clone = layers.global_net.clone();
                let counter_clone = layers.global_tx_counter.clone();
                let event_tx_clone = layers.event_tx.clone();
                let seeds_to_save = layers.live_seeds.clone();
                let network_to_save = layers.replay_responses.clone();

                // Clear the live queues for the next thought cycle
                caller.data_mut().live_responses.clear();
                caller.data_mut().live_seeds.clear();

                // To cross thread boundaries. We must read the required bytes into a temp buffer, because the pointer is tied to WASM memory lifespan.
                // (Lifetime prevents moving pointers across threads )
                let temp_buffer = data.to_vec();

                // used tokio::spawn to bridge syncronous WASM call to out async cascade
                tokio::spawn(async move {
                    // Recast the pointer safely inside the own thread.
                    let archived_bytes = unsafe {
                        rkyv::access_unchecked::<<AgentState as Archive>::Archived>(&temp_buffer)
                    };

                    crate::execute_synapse_cascade(
                        archived_bytes,
                        brain_clone,
                        axon_clone,
                        wal_clone,
                        cortex_tx_clone,
                        global_net_clone,
                        counter_clone,
                        event_tx_clone,
                        seeds_to_save,
                        network_to_save,
                    )
                    .await;
                });

                println!(
                    "WASM sandbox successfully parsed state from agent {} ",
                    hex::encode(
                        archived_state
                            .agent_id
                            .as_ref()
                            .as_slice()
                            .try_into()
                            .unwrap()
                    )
                );

                Ok(())
            },
        )?;

        // Entropy interceptor
        linker.func_wrap(
            "synapse_env",
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

        // Network Interceptor (Reality Fork)
        // The WASM agent passes a pointer to the URL it wants tot fetch
        linker.func_wrap(
            "synapse_env",
            "host_fetch_url",
            move |mut caller: Caller<'_, SandboxContent>,
                  url_ptr: i32,
                  url_len: i32,
                  out_ptr: i32,
                  out_len: i32|
                  -> i32 {
                let mem = caller.get_export("memory").unwrap().into_memory().unwrap();

                // Read the URL requested by the agent.
                let mem_slice = mem.data(&caller);
                let url_bytes = &mem_slice[url_ptr as usize..(url_ptr + url_len) as usize];
                let url = std::str::from_utf8(url_bytes).unwrap();

                let content = caller.data_mut();

                // 2. THE REALITY FORK
                let response_string = if !content.replay_responses.is_empty() {
                    // REPLAY: We feed the historical reality back to the agent
                    content.replay_responses.remove(0)
                } else {
                    // LIVE: We excute a real, blocking http request.
                    let res = tokio::task::block_in_place(|| {
                        reqwest::blocking::get(url)
                            .map(|r| r.text().unwrap_or_default())
                            .unwrap_or_default()
                    });

                    // save reality so we can replay it later
                    content.live_responses.push(res.clone());
                    res
                };

                // 3. ZERO-COPY Injection into WASM memory.
                let response_bytes = response_string.as_bytes();
                let bytes_to_write = std::cmp::min(response_bytes.len(), out_len as usize);

                // We physically overrites the agent's pre-allocated buffer with thr HTTP response.
                mem.write(
                    &mut caller,
                    out_ptr as usize,
                    &response_bytes[..bytes_to_write],
                )
                .expect("Failed to write the network res to WASM memory");

                // Return the actutal number of bytes written so the agent_knows how to much to read
                bytes_to_write as i32
            },
        )?;

        linker.func_wrap(
            "synapse_env",
            "host_ask_agent",
            move |mut caller: Caller<'_, SandboxContent>,
                  cap_ptr: i32,
                  cap_len: i32,
                  payload_ptr: i32,
                  payload_len: i32,
                  out_ptr: i32,
                  out_len: i32,
                  max_len: i32|
                  -> i32 {
                let mem = caller.get_export("memory").unwrap().into_memory().unwrap();
                let mem_slice = mem.data(&caller);

                // Read Capability String (e.g., "rqm_finance/ledger" )
                let cap_bytes = &mem_slice[cap_ptr as usize..(cap_ptr + cap_len) as usize];
                let capability = std::str::from_utf8(cap_bytes).unwrap().to_string();

                // Read Question Payload
                let payload_bytes =
                    &mem_slice[payload_ptr as usize..(payload_ptr + payload_len) as usize];

                let content = caller.data_mut();

                // Construct the Envelope
                let envelope = A2AEnvelope {
                    sender_id: content.agent_hex.as_bytes().try_into().unwrap_or([0; 16]),
                    target_capability: capability.clone(),
                    payload: payload_bytes.to_vec(),
                    crypto_sig: [0; 64],
                };

                // Execute the actual RPC call (block_in_place because WASM calls are sync)
                let net_clone = content.global_net.clone();
                let aegis_clone = content.aegis.clone();

                let response_bytes = tokio::task::block_in_place(|| {
                    tokio::runtime::Handle::current()
                        .block_on(net_clone.execute_a2a_rpc(envelope, aegis_clone))
                })
                .unwrap_or_else(|e| e.to_string().into_bytes());

                // Zero-copy injectiton of the answer back into WASM memory
                let bytes_to_write = std::cmp::min(response_bytes.len(), max_len as usize);
                mem.write(
                    &mut caller,
                    out_ptr as usize,
                    &response_bytes[..bytes_to_write],
                )
                .unwrap();

                bytes_to_write as i32
            },
        )?;

        // Initialize the Sandbox Context
        let mut store = Store::new(&self.engine, content);

        // Give the agent exactly 1_000_000 CPU instructions of fuel
        store.set_fuel(1_000_000)?;

        // Compile and initialize the agent
        let module = Module::new(&self.engine, wasm_binary)?;
        let instance = linker.instantiate(&mut store, &module)?;

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
            let lance_clone = content.lance.clone();
            let agent_hex_clone = content.agent_hex.clone();
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
                    .save_snapshot(current_tx_id as i64, &agent_hex_clone, snapshot_clone)
                    .await;

                println!(
                    "[SYSTEM] LanceDB Snapshot Secured for TxID: {} ",
                    current_tx_id
                );
            });
        }

        // Retreive the  'main' function of AI agent and execute it
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
