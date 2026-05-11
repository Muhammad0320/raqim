import Link from "next/link";
import { getCachedUserTenantContext } from "@/lib/supabase/db";

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { alias, planTier } = await getCachedUserTenantContext();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 flex flex-col md:flex-row font-sans selection:bg-zinc-800 selection:text-white">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 border-r border-zinc-800/50 bg-[#0a0a0c] flex-shrink-0 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800/50 flex flex-col gap-4">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="20" height="20" rx="4" className="fill-white" />
              <path d="M8 12L12 8L16 12M12 16V8" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-semibold text-white tracking-tight text-lg">raqim docs</span>
          </Link>
          
          {alias && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-xs font-mono text-zinc-400 truncate">{alias}</span>
              <span className="ml-auto text-[10px] font-mono text-cyan-500 bg-cyan-950/30 px-1.5 py-0.5 rounded uppercase">{planTier}</span>
            </div>
          )}
        </div>
        
        {/* Navigation Tree */}
        <nav className="p-4 space-y-6 overflow-y-auto flex-1">
          <div>
            <div className="px-3 py-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Getting Started</div>
            <div className="space-y-0.5">
              <NavLink href="/docs" active>Quickstart</NavLink>
              <NavLink href="/docs/installation">Installation</NavLink>
              <NavLink href="/docs/deployment">Deployment (AWS/K8s)</NavLink>
            </div>
          </div>

          <div>
            <div className="px-3 py-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Core Concepts</div>
            <div className="space-y-0.5">
              <NavLink href="/docs/swarm">The Swarm (CRDTs)</NavLink>
              <NavLink href="/docs/vault">The Vault (LanceDB + WAL)</NavLink>
              <NavLink href="/docs/aegis">Aegis Firewall (Ed25519)</NavLink>
              <NavLink href="/docs/reality-forking">Reality Forking (Time Travel)</NavLink>
            </div>
          </div>

          <div>
            <div className="px-3 py-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">SDKs</div>
            <div className="space-y-0.5">
              <NavLink href="/docs/python">Python SDK (raqim-py)</NavLink>
              <NavLink href="/docs/rust">Rust WASM SDK (raqim-agent-sdk)</NavLink>
            </div>
          </div>

          <div>
            <div className="px-3 py-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Architecture</div>
            <div className="space-y-0.5">
              <NavLink href="/docs/zero-trust">Zero-Trust Model</NavLink>
              <NavLink href="/docs/zero-copy">Zero-Copy TCP</NavLink>
              <NavLink href="/docs/zenoh">Zenoh A2A Mesh</NavLink>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-zinc-950">
        <div className="max-w-4xl mx-auto px-8 py-12 lg:px-16 lg:py-20">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavLink({ href, children, active = false }: { href: string, children: React.ReactNode, active?: boolean }) {
  return (
    <Link 
      href={href} 
      className={`block px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
        active 
          ? "bg-zinc-800/80 text-white shadow-sm border border-zinc-700/50" 
          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
      }`}
    >
      {children}
    </Link>
  );
}
