use std::sync::Arc;

use anyhow::Ok;
use anyhow::anyhow;
use rkyv::Archive;
use uuid::Uuid;
use wasmtime::*;
use tokio::sync::mpsc;
use crate::{AgentState, axon::AxonGateKeeper, state::SwarmState};

///  The internal state we pass into sandbox,
///  so that the host fxns can interact with the rest of the synpase organism.
struct SandboxContent {
    axon: Arc<AxonGateKeeper>,
    brain: Arc<SwarmState>,
   wal: Arc<WalEngine>,
   cortex_tx: mpsc::UnboundedSender<Vec<u8>>,
   global_net: Arc<GlobalNetworkBridge>
}

pub struct WasmEngine {
    engine: Engine,
}

impl WasmEngine {
    pub fn new() -> Self {
        println!("Bismillah. Booting Wasmtime Capability-Based Sandbox");
        let mut config = Config::new();
        // 1. Enable CPU fuels to prevent infinite loop attacks
        config.consume_fuel(true);
        // 2. Restrict maximum memory allocation to prevnt OOM attacks (e.g., 50MB)
        config.static_memory_maximum_size(50 * 1024 * 1024);

        Self {
            engine: Engine::new(&config).expect("Failed to initialize wastime engine"),
        }
    }

    /// Executes a compiled WASM agent securely.
    pub fn execute_agent(
        &self,
        wasm_binary: &[u8],
        brain: Arc<SwarmState>,
        axon: Arc<AxonGateKeeper>,
        agent_id_hex: &str,
    ) -> Result<(), anyhow::Error> {
        let mut linker = Linker::new(&self.engine);

        // ===================================
        // THE ONLY DOOR TO THE OUTSIDE WORLD
        // We define the 'host_emit_thought' fucntion for the WASM to call
        // It takes memory pointers (offset and length) from the WASM's isolated RAM.
        //  ===================================

        linker.func_wrap(
            "synapse_env",
            "host_emit_thought",
            |mut caller: Caller<'_, SandboxContent>, ptr: i32, len: i32| {
                // 1. Get the Isolated memory of the WASM cage
                let mem = match caller.get_export("memory") {
                    Some(Extern::Memory(mem)) => mem,
                    _ => return Err(anyhow!("Failed to find WASM memory")),
                };

                // 2. Read the raw bytes safely from the WASM linear memory
                let data = mem
                    .data(&caller)
                    .get(ptr as usize..(ptr + len) as usize)
                    .ok_or_else(|| anyhow!("Memory access out of bounds"))?;


                // Zero-copy desetialize the AgentState from the WASM memory.
                let archived_state =
                    unsafe { rkyv::access_unchecked::<<AgentState as Archive>::Archived>(data) };

                let incoming_state: AgentState =
                    rkyv::deserialize::<AgentState, rkyv::rancor::Error>(archived_state)
                        .expect("Failed to deserialize from WASM");

                        
            // used tokio::spawn to bridge syncronous WASM call to out async cascade
                
            let brain_clone = data.brain.clone();
            let axon_clone = data.axon.clone();
            let wal_clone = data.wal.clone();
            let cortex_tx_clone = data.cortex_tx.clone();
            let global_net_clone = data.global_net.clone();
            let incoming_state_tx_id = &incoming_state.transaction_id;
                        
                tokio::spawn(async move {
                            
                   // 4. Trigger the synapse cascade
                  crate::execute_synapse_cascade(incoming_state, brain_clone, axon_clone, wal_clone, cortex_tx_clone, global_net_clone ).await;

                });

                println!(
                    "WASM sandbox successfully parsed state for TxID: {}",
                    incoming_state_tx_id
                );

                Ok(())
            },
        )?;

        // Initialize the Sandbox Context
        let mut store = Store::new(
            &self.engine,
            SandboxContent {
                agent_id_hex: agent_id_hex.to_string(),
                axon,
                brain,
                fuel_consumed: 0,
            },
        );

        // Give the agent exactly 1_000_000 CPU instrctions of fuel
        store.set_fuel(1_000_000)?;

        // Compile and initialize the agent
        let module = Module::new(&self.engine, wasm_binary)?;
        let instance = linker.instantiate(&mut store, &module)?;

        // Retreive the  'main' function of AI agent and execute it
        let agent_main = instance.get_typed_func::<(), ()>(&mut store, "agent_main")?;

        println!("Execting Agent {} in the isolated sandbox...", agent_id_hex);
        match agent_main.call(&mut store, ()) {
            std::result::Result::Ok(_) => println!("Agent execution completed successfully."),
            Err(e) => eprintln!("Agent execution trapped/terminated: {}", e),
        }

        Ok(())
    }
}
