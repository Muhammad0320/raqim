use std::sync::Arc;
use std::sync::atomic::AtomicU64;
use wasmtime_wasi::{WasiCtx, WasiCtxBuilder};

use crate::SystemEvent;
use crate::network::GlobalNetworkBridge;
use crate::nucleus::WalEngine;
use crate::{AgentState, axon::AxonGateKeeper, state::SwarmState};
use anyhow::Ok;
use anyhow::anyhow;
use rkyv::{Archive, Archived};
use tokio::sync::broadcast::Sender;
use tokio::sync::mpsc;
use wasmtime::*;

///  The internal state we pass into sandbox,
///  so that the host fxns can interact with the rest of the synpase organism.
pub struct SandboxContent {
    pub axon: Arc<AxonGateKeeper>,
    pub brain: Arc<SwarmState>,
    pub wal: Arc<WalEngine>,
    pub cortex_tx: mpsc::UnboundedSender<Vec<u8>>,
    pub global_net: Arc<GlobalNetworkBridge>,
    pub global_tx_counter: Arc<AtomicU64>,
    pub event_tx: Sender<SystemEvent>,
    pub wasi: WasiCtx,
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
        let active_size = memory.data_size(store);
        let mem_slice = memory.data(store);
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

    /// Bootstrap the WASI Context
    pub fn build_wasi_context(historical_seed: Option<u64>) -> (WasiCtx, u64) {
        let mut builder = WasiCtxBuilder::new();

        // 1. THE PHYSICS OF DETERMINISM (wasi-random)
        let actual_seed = match historical_seed {
            // REPLAY MODE
            Some(past_seed) => {
                println!(
                    "[TIME MACHINE] Initializing the wasi with historical seed: {} ",
                    past_seed
                );
                past_seed
            }
            // lIVE MODE, we generate a true random seed from the host
            None => rand::random::<u64>(),
        };

        // 2. We inject a Pseudo-Random Number generator initialized with out EXACT seed
        // Whenever the WASM agent calls `random()` in pulls from this deterministic sequence
        let deterministic_prng = StdRng::seed_from_u64(actual_seed);

        let wasi_ctx = builder.build();
        (wasi_ctx, actual_seed)
    }

    /// Executes a compiled WASM agent securely.
    pub fn execute_agent(
        &self,
        wasm_binary: &[u8],
        content: SandboxContent,
    ) -> Result<(), anyhow::Error> {
        let mut linker = Linker::new(&self.engine);

        // LINK WASI: This traps all OS calls (clock, random, HTTP) into our hypervisor.
        wasmtime_wasi::add_to_linker(&mut linker, |ctx: &mut SandboxContent| &mut ctx.wasi)?;

        // ===================================
        // THE ONLY DOOR TO THE OUTSIDE WORLD
        // We define the 'host_emit_thought' fucntion for the WASM to call
        // It takes memory pointers (offset and length) from the WASM's isolated RAM.
        //  ===================================

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

        // Initialize the Sandbox Context
        let mut store = Store::new(&self.engine, content);

        // Give the agent exactly 1_000_000 CPU instructions of fuel
        store.set_fuel(1_000_000)?;

        // Compile and initialize the agent
        let module = Module::new(&self.engine, wasm_binary)?;
        let instance = linker.instantiate(&mut store, &module)?;

        // THE DYNAMIC CHECKPOINT
        let memory = instance
            .get_memory(&mut store, "memory")
            .ok_or(anyhow!("No more exported"))?;
        let active_snapshot = Self::create_checkpoint(&mut store, memory);

        println!(
            "[SYSTEM] Captured {} bytes of active WASM deterministic state (Base Time). ",
            active_snapshot.len()
        );

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
