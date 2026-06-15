'use client';
import { Sidebar } from './Sidebar';
import { usePathname } from 'next/navigation';

export function MainLayout({ children, title }: { children: React.ReactNode, title: string }) {
  const pathname = usePathname();
  const isTopology = pathname === '/topology';
  const isRouter = pathname === '/router';
  const isNoHeader = isTopology || isRouter;

  return (
    <div className="bg-surface text-on-surface antialiased h-screen w-screen overflow-hidden flex flex-col selection:bg-primary-container/30">

      {/* ── Body row: Sidebar is a fixed-width flex child, main takes the rest ── */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* Sidebar: flex child, not fixed — so it participates in normal flow */}
        <Sidebar />

        {/* Main column: flex col so footer stacks at the very bottom of THIS column only */}
        <main className={`flex-1 flex flex-col ${isNoHeader ? 'bg-surface' : 'bg-surface-container-low'} overflow-hidden relative min-h-0`}>
          {!isNoHeader && (
            <header className="flex justify-between items-center w-full px-8 py-6 bg-surface z-30 shrink-0">
              <div className="flex items-center gap-4">
                <h1 className="font-headline text-3xl font-black tracking-tight text-on-surface uppercase">{title}</h1>
                <div className="bg-surface-container-high px-3 py-1 rounded-sm outline outline-1 outline-outline-variant/15 outline-offset-[-1px] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                  <span className="font-mono text-[10px] text-secondary uppercase tracking-widest">Global Sec Active</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {pathname === '/firewall' && (
                  <div className="text-[#ef4444] border border-[#ef4444]/30 bg-[#ef4444]/10 px-3.5 py-1.5 rounded-sm font-mono text-[10px] uppercase tracking-[0.2em] font-bold shadow-[0_0_10px_rgba(239,68,68,0.15)]">
                    [ AEGIS ENFORCEMENT: STRICT ]
                  </div>
                )}
              </div>
            </header>
          )}

          {/* Scrollable page content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {children}
          </div>

          {/* ── Footer: scoped to the content column, never overlaps the sidebar ── */}
          <footer className="shrink-0 border-t border-zinc-800 bg-zinc-950 z-30 relative z-40">
            <div className="flex items-center justify-between px-8 py-3">
              {/* Left: OS Identity */}
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse shrink-0"></span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-300">RAQIM OS</span>
                  <span className="font-mono text-[10px] text-zinc-600">v1.0.0-rc.1</span>
                </div>
                <div className="h-3 w-px bg-zinc-800 shrink-0"></div>
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-secondary">
                  UPTIME:&nbsp;14h 22m
                </span>
              </div>

              {/* Center: Node status */}
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">NODE STATUS</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#00f3ff] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00f3ff] shadow-[0_0_6px_rgba(0,243,255,0.8)]"></span>
                  OPERATIONAL
                </span>
              </div>

              {/* Right: Tenant badge */}
              <div className="flex items-center gap-3">
                <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">TENANT</span>
                <span className="font-mono text-[10px] text-primary-fixed-dim bg-primary-container/10 px-2.5 py-1 border border-primary-container/25 uppercase tracking-widest">
                  ROOT_NODE_0x1
                </span>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
