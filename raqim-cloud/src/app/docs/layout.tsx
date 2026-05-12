import Link from "next/link";
import { getCachedUserTenantContext } from "@/lib/supabase/db";
import { DocsProvider } from "@/components/docs/DocsProvider";

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { alias, planTier, licenseKey } = await getCachedUserTenantContext();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-zinc-800 selection:text-white flex flex-col md:flex-row">
      {/* 1. Left Navigation (Sticky) */}
      <aside className="w-full md:w-64 lg:w-72 border-r border-zinc-800/50 bg-[#0a0a0c] flex-shrink-0 flex flex-col md:sticky md:top-0 md:h-screen">
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
            <div className="px-3 py-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Foundation</div>
            <div className="space-y-0.5">
              <NavLink href="/docs" active>Introduction & Quickstart</NavLink>
            </div>
          </div>

          <div>
            <div className="px-3 py-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Core Systems</div>
            <div className="space-y-0.5">
              <NavLink href="/docs/swarm">Swarm Brain</NavLink>
              <NavLink href="/docs/aegis">Aegis Firewall</NavLink>
            </div>
          </div>

          <div>
            <div className="px-3 py-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Deployment</div>
            <div className="space-y-0.5">
              <NavLink href="/docs/k8s">Kubernetes (K8s)</NavLink>
              <NavLink href="/docs/aws">AWS Architecture</NavLink>
            </div>
          </div>

          <div>
            <div className="px-3 py-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Physics</div>
            <div className="space-y-0.5">
              <NavLink href="/docs/zero-copy">Zero-Copy TCP</NavLink>
            </div>
          </div>
        </nav>
      </aside>

      {/* 2. Center Content */}
      <main className="flex-1 min-w-0 flex justify-center bg-zinc-950 py-12 px-6 lg:py-20 lg:px-12">
        <div className="w-full max-w-3xl">
          <DocsProvider 
            tenantAlias={alias || "YOUR_TENANT_ALIAS"} 
            licenseKey={licenseKey || "YOUR_LICENSE_KEY"}
            planTier={planTier || "OPEN_CORE"}
          >
            {children}
          </DocsProvider>
        </div>
      </main>

      {/* 3. Right TOC (Sticky) */}
      <aside className="hidden xl:block w-64 flex-shrink-0 sticky top-0 h-screen py-20 px-8 border-l border-zinc-800/50">
        <h4 className="text-xs font-semibold text-white uppercase tracking-widest mb-4">On this page</h4>
        <nav className="space-y-2.5 text-sm text-zinc-500">
          <a href="#byoc" className="block hover:text-zinc-300 transition-colors">Bring-Your-Own-Compute</a>
          <a href="#install" className="block hover:text-zinc-300 transition-colors">Daemon Installation</a>
          <a href="#sdk" className="block hover:text-zinc-300 transition-colors">Python SDK Boot</a>
        </nav>
      </aside>
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
