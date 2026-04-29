'use client';
import { Sidebar } from './Sidebar';
import { usePathname } from 'next/navigation';

export function MainLayout({ children, title }: { children: React.ReactNode, title: string }) {
  const pathname = usePathname();
  const isTopology = pathname === '/topology';

  return (
    <div className="bg-surface text-on-surface antialiased h-screen w-screen overflow-hidden flex flex-col selection:bg-primary-container/30">

      {/* ── Global Top Nav ── */}
      <nav className="z-50 bg-zinc-950/80 backdrop-blur-xl flex justify-between items-center w-full px-6 py-3 h-16 shrink-0 border-b border-zinc-900/50">
        <div className="flex items-center gap-4">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_8px_rgba(78,222,163,0.4)]">
            <path d="M16 2L2 16L16 30L30 16L16 2Z" fill="url(#paint0_linear)" fillOpacity="0.2"/>
            <path d="M16 6L6 16L16 26L26 16L16 6Z" stroke="#0070f3" strokeWidth="1.5"/>
            <circle cx="16" cy="16" r="3" fill="#4edea3" className="animate-pulse"/>
            <defs>
              <linearGradient id="paint0_linear" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
                <stop stopColor="#aec6ff"/>
                <stop offset="1" stopColor="#004397"/>
              </linearGradient>
            </defs>
          </svg>
          <div className="flex flex-col justify-center">
            <span className="text-xl font-black tracking-widest text-white font-headline leading-none mt-1">RAQIM<span className="text-secondary ml-1">OS</span></span>
            <span className="text-[8px] font-mono text-on-surface-variant tracking-[0.3em] uppercase mt-0.5">Tactical View</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button className="text-zinc-400 hover:text-white p-2 rounded transition-colors"><span className="material-symbols-outlined text-lg">notifications</span></button>
            <button className="text-zinc-400 hover:text-white p-2 rounded transition-colors"><span className="material-symbols-outlined text-lg">settings</span></button>
          </div>
          <button className="bg-primary-container text-on-primary-container px-4 py-1.5 rounded text-sm font-bold tracking-wide transition-opacity hover:opacity-90">Deploy Agent</button>
        </div>
      </nav>

      {/* ── Body row: Sidebar is a fixed-width flex child, main takes the rest ── */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* Sidebar: flex child, not fixed — so it participates in normal flow */}
        <Sidebar />

        {/* Main column: flex col so footer stacks at the very bottom of THIS column only */}
        {isTopology ? (
          <main className="flex-1 flex flex-col bg-surface relative overflow-hidden min-h-0">
            {children}
          </main>
        ) : (
          <main className="flex-1 flex flex-col bg-surface-container-low overflow-hidden relative min-h-0">

            {/* Per-page app bar */}
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
                  <>
                    <div className="relative">
                      <input
                        className="bg-surface-container-lowest border border-outline-variant/30 text-on-surface font-mono text-xs px-4 py-2 rounded-sm focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/20 w-64 transition-all"
                        placeholder="QUERY AGENT ID..."
                        type="text"
                      />
                      <span className="material-symbols-outlined absolute right-3 top-2 text-on-surface-variant text-sm">search</span>
                    </div>
                    <button className="text-on-surface-variant hover:text-on-surface transition-colors p-2 bg-surface-container-low rounded-sm outline outline-1 outline-outline-variant/15 outline-offset-[-1px]">
                      <span className="material-symbols-outlined">tune</span>
                    </button>
                  </>
                )}
              </div>
            </header>

            {/* Scrollable page content */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {children}
            </div>

            {/* ── Footer: scoped to the content column, never overlaps the sidebar ── */}
            <footer className="shrink-0 border-t border-zinc-800 bg-zinc-950 z-30">
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
        )}
      </div>
    </div>
  );
}
