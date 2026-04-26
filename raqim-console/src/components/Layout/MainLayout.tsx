'use client';
import { Sidebar } from './Sidebar';
import { usePathname } from 'next/navigation';

export function MainLayout({ children, title }: { children: React.ReactNode, title: string }) {
  const pathname = usePathname();
  const isTopology = pathname === '/topology' || pathname === '/';

  return (
    <div className="bg-surface text-on-surface antialiased h-screen w-screen overflow-hidden flex flex-col selection:bg-primary-container/30">
      <nav className="docked full-width top-0 z-50 bg-zinc-950/80 backdrop-blur-xl flex justify-between items-center w-full px-6 py-3 h-16 shrink-0 border-b border-zinc-900/50">
        <div className="flex items-center gap-8">
          <span className="text-xl font-black tracking-widest text-white font-headline">RAQIM OS</span>
          <div className="hidden md:flex gap-6">
            <a className="text-zinc-500 hover:text-zinc-300 font-headline tracking-tight uppercase font-bold text-sm transition-all duration-200 ease-in-out hover:bg-zinc-800/50 px-2 py-1 rounded" href="#">SDK</a>
            <a className="text-zinc-500 hover:text-zinc-300 font-headline tracking-tight uppercase font-bold text-sm transition-all duration-200 ease-in-out hover:bg-zinc-800/50 px-2 py-1 rounded" href="#">Pricing</a>
            <a className="text-zinc-500 hover:text-zinc-300 font-headline tracking-tight uppercase font-bold text-sm transition-all duration-200 ease-in-out hover:bg-zinc-800/50 px-2 py-1 rounded" href="#">Docs</a>
            <a className="text-white border-b-2 border-blue-600 pb-1 font-headline tracking-tight uppercase font-bold text-sm transition-all duration-200 ease-in-out hover:bg-zinc-800/50 px-2 py-1 rounded" href="#">Telemetry</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button className="text-zinc-400 hover:text-white p-2 rounded scale-95 transition-transform duration-150"><span className="material-symbols-outlined text-lg">notifications</span></button>
            <button className="text-zinc-400 hover:text-white p-2 rounded scale-95 transition-transform duration-150"><span class="material-symbols-outlined text-lg">settings</span></button>
          </div>
          <button className="bg-primary-container text-on-primary-container px-4 py-1.5 rounded text-sm font-bold tracking-wide scale-95 transition-transform duration-150">Deploy Agent</button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        
        {/* Render different container background logic based on page to match original HTML logic */}
        {isTopology ? (
           <main className="flex-1 ml-64 p-8 overflow-y-auto bg-surface relative">
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
