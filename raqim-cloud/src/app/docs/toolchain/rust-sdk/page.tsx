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

  const askSwarmCode = `// Ask the Compliance Node a question over the Zenoh mesh
let response_bytes = Raqim::ask_swarm(
    "/compliance/kyc/verify", 
    b"Verify Transaction ID: 8492"
).expect("A2A Timeout or Payload exceeded 2MB limit");

let response = String::from_utf8_lossy(&response_bytes);
println!("Compliance Node Responded: {}", response);`;

  const emitThoughtCode = `use raqim_core::{AgentState, AgentStatus};

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
        <div className="text-cyan-500 font-mono text-sm uppercase tracking-widest mb-3">Toolchain</div>
        <h1 className="text-4xl md:text-5xl font-semibold text-white mb-6">Vector 1: The Rust WASM SDK (In-Process)</h1>
        <p className="text-xl text-zinc-400 leading-relaxed">
          To achieve 790,000 TPS, network latency must be eradicated. Agents compiled to <code>wasm32-wasi</code> via the <code>raqim-agent-sdk</code> execute directly inside the Raqim Core hypervisor. They interact with the Swarm Brain via unsafe FFI host bindings, sharing the host's memory space while remaining fiercely sandboxed.
        </p>
      </div>

      <div className="space-y-16">
        <section id="deterministic-primitives" className="scroll-mt-24">
          <h2 className="text-2xl font-medium text-zinc-100 border-b border-zinc-800/80 pb-3 mb-6">Deterministic Primitives</h2>
          <p className="text-zinc-400 leading-relaxed mb-6">
            Time and randomness are illusions in a time-traveling hypervisor. Traditional system calls introduce execution divergence, causing reality simulation drift during replay operations.
          </p>
          <DynamicCodeBlock 
            codeTemplate={deterministicCode} 
            language="rust" 
          />
        </section>

        <section id="serving-capability" className="scroll-mt-24">
          <h2 className="text-2xl font-medium text-zinc-100 border-b border-zinc-800/80 pb-3 mb-6">Serving a Capability (Zero-CPU Yielding)</h2>
          <p className="text-zinc-400 leading-relaxed mb-4">
            When an agent exposes a capability to the swarm, it enters an eternal listening loop. <code>Raqim::server_capability</code> invokes an OS-level thread suspension. It consumes exactly zero CPU cycles until a valid, Aegis-authorized TCP packet wakes it up.
          </p>
          <DynamicCodeBlock 
            codeTemplate={capabilityCode} 
            language="rust" 
          />
        </section>

        <section id="a2a-queries" className="scroll-mt-24">
          <h2 className="text-2xl font-medium text-zinc-100 border-b border-zinc-800/80 pb-3 mb-6">Zero-Trust A2A Queries (The 2-Pass Memory Allocator)</h2>
          <p className="text-zinc-400 leading-relaxed mb-4">
            To prevent buffer overflow exploits, Raqim uses a 2-pass FFI allocator. The SDK first asks the OS for the exact byte length of the incoming answer, allocates a perfectly sized Rust <code>Vec</code>, and then pulls the data across the WASM boundary.
          </p>
          <DynamicCodeBlock 
            codeTemplate={askSwarmCode} 
            language="rust" 
          />
        </section>

        <section id="committing-state" className="scroll-mt-24">
          <h2 className="text-2xl font-medium text-zinc-100 border-b border-zinc-800/80 pb-3 mb-6">Committing State (The Data Plane)</h2>
          <p className="text-zinc-400 leading-relaxed mb-4">
            Conclude the narrative by committing the reconciled thought to the permanent Loro CRDT log topology.
          </p>
          <DynamicCodeBlock 
            codeTemplate={emitThoughtCode} 
            language="rust" 
          />
        </section>
      </div>
    </article>
  );
}
