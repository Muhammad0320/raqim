use std::sync::Arc;

use anyhow::Ok;
use wasmtime::*;

use crate::{AgentState, axon::AxonGateKeeper, state::SwarmState};

///  The internal state we pass into sandbox,
///  so that the host fxns can interact with the rest of the synpase organism.
struct SandboxContent {
    axon: Arc<AxonGateKeeper>,
    brain: Arc<SwarmState>,
    agent_id_hex: String,
    fuel_consumed: u64,
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
                    _ => return Err(Trap::new("Failed to find WASM memory")),
                };
                let agent_uuid_bytes = Uuid::new_v4().into_bytes();

                // 2. Read the raw bytes safely from the WASM linear memory
                let data = mem
                    .data(&caller)
                    .get(ptr as usize..(ptr + len) as usize)
                    .ok_or_else(|| Trap::new("Memory access out of bounds"))?;

                // 3. Convert bytes to string (The Agent's Thought )
                let thought = std::str::from_utf8(data)
                    .map_err(|_| Trap::new("Invalid UTF-8 in thought payload"))?;

                // 4. Trigger the synapse cascade
                // The WASM agents doesn't touch the CRDT or WAL directly. We do it for them safely.
                let state = AgentState {
                    transaction_id: 0,
                    timestamp: 0,
                    status: crate::AgentStatus::Reasoning,
                    memory_offset: 0,
                    agent_id: agent_uuid_bytes,
                };

                caller
                    .data()
                    .brain
                    .update_agent_state(&caller.data().agent_id_hex, &state);
                // The rest of the Axon/WAL cascade happens seamlessly

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
            Ok(_) => println!("Agent execution completed successfully."),
            Err(e) => eprintln!("Agent execution trapped/terminated: {}", e),
        }

        Ok(())
    }
}
