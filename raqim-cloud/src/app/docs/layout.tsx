import Link from "next/link";
import { getCachedUserTenantContext } from "@/lib/supabase/db";
import { DocsProvider } from "@/components/docs/DocsProvider";
import NavLink from "@/components/docs/NavLink";
import { TableOfContents } from "@/components/docs/TableOfContents";

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { alias, planTier, licenseKey, isAuthenticated } = await getCachedUserTenantContext();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-zinc-800 selection:text-white flex flex-col md:flex-row">
      {/* 1. Left Navigation (Sticky) */}
      <aside className="w-full md:w-64 lg:w-72 border-r border-zinc-800/50 bg-[#0a0a0c] flex-shrink-0 flex flex-col md:sticky md:top-0 md:h-screen">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800/50 flex flex-col gap-4">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <svg className="w-6 h-6 text-white" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="docs-logo-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              {/* Heavy vertical spine monolith */}
              <path d="M28 15v70" stroke="currentColor" strokeWidth="8" strokeLinecap="square" />
              {/* Sharp, geometric upper loop */}
              <path d="M28 19h36l12 16l-12 16H28" stroke="currentColor" strokeWidth="8" strokeLinecap="square" strokeLinejoin="miter" />
              {/* Intersecting sharp, glowing cyan diagonal zero-copy bypass path */}
              <path d="M46 49l28 36" stroke="#00E5FF" strokeWidth="8" strokeLinecap="square" filter="url(#docs-logo-glow)" />
            </svg>
            <span className="font-semibold text-white tracking-tight text-lg font-mono">raqim docs</span>
          </Link>
          
          {isAuthenticated && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-none">
              <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
              <span className="text-xs font-mono text-zinc-400 truncate">{alias}</span>
              <span className="ml-auto text-[10px] font-mono text-cyan-500 bg-cyan-950/30 px-1.5 py-0.5 rounded-none border border-cyan-800 uppercase">{planTier}</span>
            </div>
          )}
        </div>
        
        {/* Navigation Tree */}
        <nav className="p-4 space-y-6 overflow-y-auto flex-1">
          <div>
            <div className="px-3 py-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Foundation</div>
            <div className="space-y-0.5">
              <NavLink href="/docs">Introduction & Quickstart</NavLink>
            </div>
          </div>

          <div>
            <div className="px-3 py-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Core Systems</div>
            <div className="space-y-0.5">
              <NavLink href="/docs/core-systems/aegis-firewall">Aegis Firewall</NavLink>
              <NavLink href="/docs/core-systems/temporal-router">Temporal Router</NavLink>
            </div>
          </div>

          <div>
            <div className="px-3 py-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Toolchain</div>
            <div className="space-y-0.5">
              <NavLink href="/docs/toolchain">Toolchain & CLI</NavLink>
              <NavLink href="/docs/toolchain/rust-sdk">Rust WASM SDK (In-Proc)</NavLink>
            </div>
          </div>

          <div>
            <div className="px-3 py-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Deployment</div>
            <div className="space-y-0.5">
              <NavLink href="/docs/deployment/kubernetes">Kubernetes (K8s)</NavLink>
            </div>
          </div>

          <div>
            <div className="px-3 py-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Physics</div>
            <div className="space-y-0.5">
              <NavLink href="/docs/physics/architecture">Internal Physics</NavLink>
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

      {/* 3. Right TOC (Sticky Dynamic Component) */}
      <TableOfContents />
    </div>
  );
}
