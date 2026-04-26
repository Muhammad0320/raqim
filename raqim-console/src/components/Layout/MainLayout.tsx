'use client';
import { Sidebar } from './Sidebar';
import { usePathname } from 'next/navigation';

export function MainLayout({ children, title }: { children: React.ReactNode, title: string }) {
  const pathname = usePathname();
  const isTopology = pathname === '/topology';

  return (
    <div className="bg-surface text-on-surface antialiased h-screen w-screen overflow-hidden flex flex-col selection:bg-primary-container/30">
      <nav className="docked full-width top-0 z-50 bg-zinc-950/80 backdrop-blur-xl flex justify-between items-center w-full px-6 py-3 h-16 shrink-0 border-b border-zinc-900/50">
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
            <button className="text-zinc-400 hover:text-white p-2 rounded scale-95 transition-transform duration-150"><span className="material-symbols-outlined text-lg">notifications</span></button>
            <button className="text-zinc-400 hover:text-white p-2 rounded scale-95 transition-transform duration-150"><span className="material-symbols-outlined text-lg">settings</span></button>
          </div>
          <button className="bg-primary-container text-on-primary-container px-4 py-1.5 rounded text-sm font-bold tracking-wide scale-95 transition-transform duration-150">Deploy Agent</button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        
        {/* Render different container background logic based on page to match original HTML logic */}
        {isTopology ? (
           <main className="flex-1 ml-64 flex flex-col bg-surface relative overflow-hidden">
              {children}
           </main>
        ) : (
           <main className="ml-64 flex-1 flex flex-col bg-surface-container-low h-full overflow-hidden relative">
             {/* If not topology, top app bar is inside main */}
             <header className="flex justify-between items-center w-full px-8 py-6 bg-surface z-30">
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
                        <input className="bg-surface-container-lowest border border-outline-variant/30 text-on-surface font-mono text-xs px-4 py-2 rounded-sm focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/20 w-64 transition-all" placeholder="QUERY AGENT ID..." type="text"/>
                        <span className="material-symbols-outlined absolute right-3 top-2 text-on-surface-variant text-sm">search</span>
                      </div>
                      <button className="text-on-surface-variant hover:text-on-surface transition-colors p-2 bg-surface-container-low rounded-sm outline outline-1 outline-outline-variant/15 outline-offset-[-1px]">
                         <span className="material-symbols-outlined">tune</span>
                      </button>
                     </>
                   )}
                </div>
             </header>
             {children}
           </main>
        )}
      </div>

      {!isTopology && (
        <footer className="docked full-width bottom-0 w-full flex justify-between items-center px-8 py-3 bg-zinc-950 border-t border-zinc-900 shrink-0 z-30 relative">
          <span className="font-mono text-[10px] tracking-tighter uppercase font-bold text-white opacity-80 hover:opacity-100 transition-opacity">© 2024 RAQIM OS. DETERMINISTIC INDUSTRIAL INTERFACE.</span>
          <div className="flex gap-4">
            <a className="text-zinc-600 font-mono text-[10px] tracking-tighter uppercase hover:text-zinc-300 opacity-80 hover:opacity-100 transition-opacity" href="#">Security</a>
            <a className="text-zinc-600 font-mono text-[10px] tracking-tighter uppercase hover:text-zinc-300 opacity-80 hover:opacity-100 transition-opacity" href="#">Privacy</a>
            <a className="text-zinc-600 font-mono text-[10px] tracking-tighter uppercase hover:text-zinc-300 opacity-80 hover:opacity-100 transition-opacity" href="#">Terms</a>
            <a className="text-zinc-600 font-mono text-[10px] tracking-tighter uppercase hover:text-zinc-300 opacity-80 hover:opacity-100 transition-opacity" href="#">API Status</a>
          </div>
        </footer>
      )}
    </div>
  );
}
