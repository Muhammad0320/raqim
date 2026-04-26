'use client';
import { Sidebar } from './Sidebar';

export function MainLayout({ children, title }: { children: React.ReactNode, title: string }) {
  return (
    <div className="flex h-screen w-screen bg-obsidian text-white overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Topbar */}
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-header shrink-0 justify-between">
          <div className="flex items-center gap-8">
            <div className="text-xl font-bold tracking-[2px] font-sans flex items-center gap-2">
               RAQIM <span className="text-white/50">OS</span>
            </div>
            <nav className="flex gap-6 text-xs font-semibold tracking-wider text-muted-DEFAULT">
               <span className="hover:text-white cursor-pointer">SDK</span>
               <span className="hover:text-white cursor-pointer">PRICING</span>
               <span className="hover:text-white cursor-pointer">DOCS</span>
               <span className="text-white border-b-2 border-neon-cyan pb-1">TELEMETRY</span>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
             <button className="bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 px-4 py-1.5 text-xs font-mono font-bold hover:bg-neon-cyan hover:text-obsidian transition-colors drop-shadow-[0_0_8px_rgba(102,252,241,0.3)]">
                Deploy Agent
             </button>
          </div>
        </header>

        <div className="px-8 py-4 border-b border-white/5 flex items-center gap-4 bg-obsidian z-10 shrink-0">
           <h1 className="text-2xl font-bold tracking-wide flex items-center gap-3">
              {/* Optional Icon could go here depending on title */}
              {title}
           </h1>
           <span className="px-2 py-1 bg-green-500/10 text-green-500 border border-green-500/20 text-[10px] rounded-sm font-mono tracking-wider ml-2">
             ● HEALTHY
           </span>
        </div>

        <div className="flex-1 overflow-hidden relative bg-obsidian">
          {children}
        </div>
      </main>
    </div>
  );
}
