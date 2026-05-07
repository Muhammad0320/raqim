export default function DocsPage() {
  return (
    <article className="prose prose-invert prose-zinc max-w-none prose-headings:font-semibold prose-a:text-blue-400">
      <h1 className="text-4xl text-white mb-4 tracking-tight">Bring Your Own Compute (BYOC)</h1>
      <p className="text-lg text-zinc-400 mb-8 font-light">
        Raqim OS separates the semantic memory layer from the computation layer, allowing you to run agentic swarms wherever it makes the most sense for your architecture.
      </p>

      <div className="my-8 p-6 bg-zinc-900/30 border border-zinc-800 rounded-lg">
        <h3 className="text-white text-lg font-medium mt-0 mb-2">The Vending Machine Model</h3>
        <p className="text-zinc-400 mb-0 text-sm leading-relaxed">
          While Raqim Cloud acts as a SaaS Gateway, providing coordination, telemtry, and auth, actual execution is completely decoupled. We vend cryptographic capabilities to your infrastructure.
        </p>
      </div>

      <h2 className="text-2xl text-white mt-12 mb-4 tracking-tight">How it works</h2>
      <p className="text-zinc-300 leading-relaxed mb-6">
        When you initialize a Raqim Swarm, the orchestration layer (Raqim Cloud) distributes Ed25519 keys to the designated worker nodes. These nodes can be:
      </p>
      
      <ul className="space-y-3 mb-8 text-zinc-300 list-disc pl-5">
        <li><strong className="text-white">Local Development:</strong> Your Macbook running our Rust CLI.</li>
        <li><strong className="text-white">Edge Nodes:</strong> Cloudflare Workers executing WASM bundles.</li>
        <li><strong className="text-white">Enterprise VPC:</strong> Secure AWS instances isolated from the public internet.</li>
      </ul>

      <h2 className="text-2xl text-white mt-12 mb-4 tracking-tight">Zero-Copy Architecture</h2>
      <p className="text-zinc-300 leading-relaxed mb-6">
        The core advantage of BYOC in Raqim is the avoidance of data serialization overhead. The CRDT brain ensures that when an agent updates a belief or memory, the state delta is propagated asynchronously without locking or deep copying. 
      </p>

      <pre className="bg-black border border-zinc-800 rounded-lg p-4 my-8 overflow-x-auto">
        <code className="text-sm font-mono text-zinc-300">
{`// Example Python SDK initialization
import raqim

swarm = raqim.Swarm(
    api_key="rq_live_xxxxxxxx",
    compute="local", // BYOC mode
    memory="crdt_cloud"
)

swarm.deploy()`}
        </code>
      </pre>
    </article>
  );
}
