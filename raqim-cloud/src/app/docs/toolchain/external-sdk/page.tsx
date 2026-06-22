import { DynamicCodeBlock } from "@/components/docs/DynamicCodeBlock";

export default function ExternalSdkPage() {
  const ignitionCode = `from raqim import RaqimClient
import llm_memory_module

agent = RaqimClient(
    alias="finance_worker_01",
    tenant="{{TENANT_ALIAS}}",
    private_key_path="./vault/identities/finance_worker_01.pem"
)

# Define HOW your specific LLM clears its memory buffer during a Reality Fork
def reality_reseed_hook(new_system_prompt: str):
    print(f"[OS DIRECTIVE]: {new_system_prompt}")
    llm_memory_module.clear() # Memory wiped. Reality reset.

# Register the hook with the Zenoh Out-of-Band Control Plane
agent.register_eviction_hook(reality_reseed_hook)

# Initiate the TCP Handshake and Zenoh Subscription
await agent.boot()`;

  const multiplexerCode = `# Connect the background routing multiplexer
await agent.connect_swarm()

# Ask the Compliance Node a question. 
# This suspends execution until the Zenoh mesh routes the answer back.
compliance_answer = await agent.ask_swarm(
    capability="/compliance/kyc/verify",
    question=b"Verify Transaction ID: 8492",
    sender_hex=agent.agent_hex
)

print(f"Compliance Node Responded: {compliance_answer.decode('utf-8')}")`;

  return (
    <article className="prose prose-zinc prose-invert max-w-none prose-headings:tracking-tight prose-a:text-cyan-400 hover:prose-a:text-cyan-300">
      <div className="mb-16">
        <div className="text-cyan-500 font-mono text-sm uppercase tracking-widest mb-3">Toolchain & SDKs</div>
        <h1 className="text-4xl md:text-5xl font-semibold text-white mb-6">Vector 2 & 3: Python SDK and MCP Bridge</h1>
        <p className="text-xl text-zinc-400 leading-relaxed">
          Python is the lingua franca of AI, but its execution loop is a liability for high-throughput distributed systems. The raqim-py SDK does not rely on Python for cryptography. It wraps a compiled PyO3 Rust extension (RaqimCryptoCore) to serialize zero-copy bytes, firing them directly over a raw TCP socket (The Data Plane), while listening to a Zenoh mesh for administrative commands (The Control Plane).
        </p>
      </div>

      <div className="space-y-16">
        <section id="ignition" className="scroll-mt-24">
          <h2 className="text-2xl font-medium text-zinc-100 border-b border-zinc-800/80 pb-3 mb-6">The Ignition Sequence & Out-of-Band Eviction</h2>
          <p className="text-zinc-400 leading-relaxed mb-6">
            Booting an external agent requires establishing secure, cryptographically validated links back to the Raqim Core daemon. By registering a reality reseed hook, the Python process can gracefully handle Reality Forks triggered by system administrators, wiping model context arrays whenever a historical fork is executed.
          </p>
          <DynamicCodeBlock 
            codeTemplate={ignitionCode} 
            language="python" 
          />
        </section>

        <section id="multiplexer" className="scroll-mt-24">
          <h2 className="text-2xl font-medium text-zinc-100 border-b border-zinc-800/80 pb-3 mb-6">The Async Multiplexer (Zero-Trust A2A)</h2>
          <p className="text-zinc-400 leading-relaxed mb-6">
            <code>raqim-py</code> mirrors the Rust <code>tokio::select</code> loop. When an agent asks the swarm a question, it fires an Ed25519-signed packet and suspends the Python coroutine. It yields zero CPU cycles until the background WebSocket multiplexer wakes it up with the answer.
          </p>
          <DynamicCodeBlock 
            codeTemplate={multiplexerCode} 
            language="python" 
          />
        </section>

        <section id="mcp-bridge" className="scroll-mt-24">
          <h2 className="text-2xl font-medium text-zinc-100 border-b border-zinc-800/80 pb-3 mb-6">Vector 3: The MCP Bridge (synapse-mcp)</h2>
          <p className="text-zinc-400 leading-relaxed mb-6">
            The synapse-mcp server is not an SDK; it is a Model Context Protocol translation layer. It allows external commercial LLMs (like Claude or Cursor IDE) to securely authenticate with the Aegis Firewall and natively read/write to the Swarm Brain via Stdio transports.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            The bridge automatically injects three tools into the LLM's context: <code>commit_thought</code>, <code>query_memory</code>, and <code>ask_swarm</code>. The LLM simply calls the tool, and the MCP Rust server handles the Ed25519 packet signing and TCP routing on its behalf.
          </p>
        </section>
      </div>
    </article>
  );
}
