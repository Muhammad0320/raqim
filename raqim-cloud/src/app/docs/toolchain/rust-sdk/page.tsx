import { DynamicCodeBlock } from "@/components/docs/DynamicCodeBlock";

export default function RustSdkPage() {
  const deterministicCode = `use raqim_agent_sdk::Raqim;

// WARNING: Standard library calls like SystemTime::now() will panic inside the sandbox.
// You MUST use the OS-injected deterministic primitives. During a Reality Fork,
// the Temporal Router will perfectly replay these values.

let safe_time = Raqim::time();
let safe_seed = Raqim::entropy();`;

  const capabilityCode = `#[no_mangle]
pub extern "C" fn agent_main() {
    // Expose the audit capability to the global swarm
    Raqim::server_capability("/finance/ledger/audit", |question_bytes| {
        let question = String::from_utf8_lossy(question_bytes);
        println!("[FINANCE_WORKER] Received audit request: {}", question);

        // Perform deterministic ledger validation...
        let status = b"AUDIT_PASS_200_OK";

        // Return the raw bytes to the OS for zero-copy routing
        status.to_vec() 
    });
}`;

  const a2aCode = `// Ask the Compliance Node a question over the Zenoh mesh
let response_bytes = Raqim::ask_swarm(
    "/compliance/kyc/verify", 
    b"Verify Transaction ID: 8492"
).expect("A2A Timeout or Payload exceeded 2MB limit");

let response = String::from_utf8_lossy(&response_bytes);
println!("Compliance Node Responded: {}", response);`;

  const commitCode = `use raqim_core::{AgentState, AgentStatus};

let final_state = AgentState {
    agent_id: None, // Injected securely by the OS
    transaction_id: 0,
    namespace: "/finance/ledger".to_string(),
    timestamp: Raqim::time(),
    status: AgentStatus::Idle,
    text: "Transaction 8492 fully reconciled and audited.".to_string(),
};

// Physically serialize and emit to the global Loro CRDT
Raqim::emit_thought(&final_state);`;

  return (
    <article className="prose prose-zinc prose-invert max-w-none prose-headings:tracking-tight prose-a:text-cyan-400 hover:prose-a:text-cyan-300">
      <div className="mb-16">
        <div className="text-cyan-500 font-mono text-sm uppercase tracking-widest mb-3">Toolchain & SDKs</div>
        <h1 className="text-4xl md:text-5xl font-semibold text-white mb-6">Vector 1: The Rust WASM SDK (In-Process)</h1>
        <p className="text-xl text-zinc-400 leading-relaxed">
          To achieve 790,000 TPS, network latency must be eradicated. Agents compiled to wasm32-wasi via the raqim-agent-sdk execute directly inside the Raqim Core hypervisor. They interact with the Swarm Brain via unsafe FFI host bindings, sharing the host's memory space while remaining fiercely sandboxed.
        </p>
      </div>

      <div className="space-y-16">
        <section id="deterministic-primitives" className="scroll-mt-24">
          <h2 className="text-2xl font-medium text-zinc-100 border-b border-zinc-800/80 pb-3 mb-6">Deterministic Primitives</h2>
          <p className="text-zinc-400 leading-relaxed mb-6">
            In a time-traveling hypervisor, standard system calls like time query or random seeds break determinism. Reality replay mechanisms during state synchronization or debugging forks require execution paths to produce identical outcomes given the same input logs.
          </p>
          <DynamicCodeBlock 
            codeTemplate={deterministicCode} 
            language="rust" 
          />
        </section>

        <section id="serving-capability" className="scroll-mt-24">
          <h2 className="text-2xl font-medium text-zinc-100 border-b border-zinc-800/80 pb-3 mb-6">Serving a Swarm Capability</h2>
          <p className="text-zinc-400 leading-relaxed mb-6">
            When an agent exposes a capability to the swarm, it enters an eternal listening loop. Raqim::server_capability invokes an OS-level thread suspension. It consumes exactly zero CPU cycles until a valid, Aegis-authorized TCP packet wakes it up.
          </p>
          <DynamicCodeBlock 
            codeTemplate={capabilityCode} 
            language="rust" 
          />
        </section>

        <section id="a2a-queries" className="scroll-mt-24">
          <h2 className="text-2xl font-medium text-zinc-100 border-b border-zinc-800/80 pb-3 mb-6">Zero-Trust A2A Queries</h2>
          <p className="text-zinc-400 leading-relaxed mb-6">
            To prevent buffer overflow exploits, Raqim uses a 2-pass FFI allocator. The SDK first asks the OS for the exact byte length of the incoming answer, allocates a perfectly sized Rust Vec, and then pulls the data across the WASM boundary.
          </p>
          <DynamicCodeBlock 
            codeTemplate={a2aCode} 
            language="rust" 
          />
        </section>

        <section id="committing-state" className="scroll-mt-24">
          <h2 className="text-2xl font-medium text-zinc-100 border-b border-zinc-800/80 pb-3 mb-6">Committing State to Loro CRDT</h2>
          <p className="text-zinc-400 leading-relaxed mb-6">
            Conclude the narrative by committing the reconciled thought to the permanent Loro CRDT. This physically serializes and emits the record to the peer-to-peer Swarm network for global replication.
          </p>
          <DynamicCodeBlock 
            codeTemplate={commitCode} 
            language="rust" 
          />
        </section>
      </div>
    </article>
  );
}
