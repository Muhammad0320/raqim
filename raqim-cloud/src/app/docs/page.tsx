import { DynamicCodeBlock } from "@/components/docs/DynamicCodeBlock";

export default function DocsPage() {
  const bashCode = `curl -sL https://raqim.cloud/install.sh | bash -s -- --tenant {{TENANT_ALIAS}} --license {{LICENSE_KEY}}`;

  const pythonCode = `from raqim import RaqimClient

agent = RaqimClient(
    alias="MY_FIRST_AGENT", 
    tenant="{{TENANT_ALIAS}}", 
    license="{{LICENSE_KEY}}"
)
await agent.boot()`;

  return (
    <article className="prose prose-invert prose-zinc max-w-none prose-headings:tracking-tight prose-a:text-cyan-400 hover:prose-a:text-cyan-300">
      <div className="mb-16">
        <h1 className="text-4xl md:text-5xl font-semibold text-white mb-6">Introduction & Quickstart</h1>
        <p className="text-xl text-zinc-400 leading-relaxed">
          Welcome to Raqim OS. This documentation covers the architecture, deployment, and operation 
          of the Sovereign, Zero-Copy Agent platform.
        </p>
      </div>

      <div className="space-y-16">
        <section id="byoc" className="scroll-mt-24">
          <h2 className="text-2xl font-medium text-zinc-100 border-b border-zinc-800/80 pb-3 mb-6">The Bring-Your-Own-Compute (BYOC) Philosophy</h2>
          <p className="text-zinc-400 leading-relaxed">
            Unlike traditional monolithic SaaS platforms, Raqim Cloud does not execute your agents or hold your data. 
            We strictly manage the <strong>cryptographic control plane</strong>. You run the compute layer on your own metal—whether that's 
            a massive AWS EKS cluster or a fleet of Raspberry Pis at the edge.
          </p>
          <p className="text-zinc-400 leading-relaxed mt-4">
            When your agents boot, they use your Tenant Alias and RSA License Key to authenticate with the Aegis Firewall. 
            Once verified, they establish direct, zero-copy TCP connections (the <a href="/docs/zenoh">Zenoh A2A Mesh</a>) with other agents 
            in your swarm, entirely bypassing our servers for data transit.
          </p>
        </section>

        <section id="install" className="scroll-mt-24">
          <h2 className="text-2xl font-medium text-zinc-100 border-b border-zinc-800/80 pb-3 mb-6">Daemon Installation</h2>
          <p className="text-zinc-400 mb-6">
            Raqim OS operates close to the metal. To install the core daemon and the required routing utilities on your compute node, 
            run the following bootstrap script. Your active tenant credentials have been automatically injected into the command below.
          </p>
          <DynamicCodeBlock 
            codeTemplate={bashCode} 
            language="Bash" 
          />
        </section>

        <section id="sdk" className="scroll-mt-24">
          <h2 className="text-2xl font-medium text-zinc-100 border-b border-zinc-800/80 pb-3 mb-6">Python SDK Boot</h2>
          <p className="text-zinc-400 mb-6">
            Once the daemon is active on the host, you can boot agents that bind directly to your tenant's CRDT swarm. 
            The Python SDK (<code className="text-pink-400 bg-pink-950/30 px-1.5 py-0.5 rounded text-sm font-mono border border-pink-900/50">raqim-py</code>) provides 
            an elegant, highly concurrent asynchronous interface for agent logic.
          </p>
          <DynamicCodeBlock 
            codeTemplate={pythonCode} 
            language="Python" 
          />
        </section>

        <section className="bg-gradient-to-br from-zinc-900/50 to-zinc-950 border border-zinc-800 rounded-2xl p-8 lg:p-10 mt-16 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-emerald-500 opacity-50"></div>
          <h3 className="text-xl font-medium text-white mb-4">Ready for Production?</h3>
          <p className="text-zinc-400 mb-8 max-w-2xl leading-relaxed">
            Your agent is now connected to the global WAN. You can monitor its telemetry directly from your 
            fleet dashboard, or dive into the core concepts to understand the underlying mathematics of the Swarm Brain.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="/dashboard" className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors">
              View Fleet Dashboard
            </a>
            <a href="/docs/swarm" className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium border border-zinc-700 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors">
              Understand The Swarm
            </a>
          </div>
        </section>
      </div>
    </article>
  );
}
