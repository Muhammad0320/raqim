import { getCachedUserTenantContext } from "@/lib/supabase/db";
import { DynamicCodeBlock } from "@/components/docs/DynamicCodeBlock";

export default async function DocsPage() {
  const userData = await getCachedUserTenantContext();

  const pythonCode = `from raqim import RaqimClient

agent = RaqimClient(
    alias="MY_FIRST_AGENT", 
    tenant="{{TENANT_ID}}", 
    private_key_path="./secret.pem"
)
await agent.boot()`;

  const bashCode = `curl -sL https://raqim.cloud/install.sh | bash -s -- --tenant {{TENANT_ID}}`;

  return (
    <article className="prose prose-invert prose-zinc max-w-none">
      <div className="mb-12">
        <h1 className="text-4xl font-semibold tracking-tight text-white mb-4">Quickstart</h1>
        <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl">
          Welcome to Raqim OS. This guide will walk you through deploying your first 
          Sovereign, Zero-Copy Agent within your dedicated tenant infrastructure.
        </p>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-medium tracking-tight text-zinc-100 border-b border-zinc-800/50 pb-2 mb-6">1. System Installation</h2>
          <p className="text-zinc-400 mb-6">
            Raqim OS operates close to the metal. To install the core daemon and the required Zenoh A2A routing utilities, run the following bootstrap script. 
            We have automatically injected your active tenant ID into the command below.
          </p>
          <DynamicCodeBlock 
            codeTemplate={bashCode} 
            userData={userData} 
            language="Bash" 
          />
        </section>

        <section>
          <h2 className="text-2xl font-medium tracking-tight text-zinc-100 border-b border-zinc-800/50 pb-2 mb-6">2. Initialize the Python SDK</h2>
          <p className="text-zinc-400 mb-6">
            Once the daemon is active, you can boot agents that bind directly to your tenant's CRDT swarm. 
            The Python SDK (<code className="text-pink-400 bg-pink-950/30 px-1.5 py-0.5 rounded">raqim-py</code>) provides an elegant, highly concurrent asynchronous interface.
          </p>
          <DynamicCodeBlock 
            codeTemplate={pythonCode} 
            userData={userData} 
            language="Python" 
          />
        </section>

        <section className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-8 mt-12">
          <h3 className="text-xl font-medium text-white mb-3">Next Steps</h3>
          <p className="text-zinc-400 mb-6">
            Your agent is now connected to the global WAN. You can monitor its telemetry directly from your 
            fleet dashboard, or dive into the core concepts to understand the zero-trust architecture.
          </p>
          <div className="flex gap-4">
            <a href="/dashboard" className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors">
              View Fleet Dashboard
            </a>
            <a href="/docs/swarm" className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium border border-zinc-700 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors">
              Read about The Swarm
            </a>
          </div>
        </section>
      </div>
    </article>
  );
}
