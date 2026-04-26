import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col pt-16 w-64 bg-zinc-950 z-40 border-r border-zinc-900 hidden md:flex">
      <div className="flex flex-col h-full justify-between">
        <div>
          <div className="px-6 py-6 mb-4 border-b border-zinc-900/50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-surface-container-highest rounded-sm flex items-center justify-center outline outline-1 outline-outline-variant/15 outline-offset-[-1px]">
                <span className="material-symbols-outlined text-primary-fixed-dim">shield_person</span>
              </div>
              <div>
                <h2 className="font-mono text-sm font-bold text-on-surface uppercase tracking-wider">ROOT_USER</h2>
                <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest mt-0.5">Sovereign Node</p>
              </div>
            </div>
          </div>
          <nav className="flex flex-col gap-1 px-3">
            <Link 
              href="/" 
              className={`px-4 py-3 flex items-center gap-3 transition-colors duration-200 rounded-sm ${pathname === '/' ? 'bg-zinc-900 text-blue-400 border-l-4 border-blue-600' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}`}
            >
              <span className="material-symbols-outlined text-lg">dashboard</span>
              <span className={`font-mono text-xs uppercase tracking-widest mt-0.5 ${pathname === '/' ? 'font-bold' : ''}`}>Dashboard</span>
            </Link>

            <Link 
              href="/topology" 
              className={`px-4 py-3 flex items-center gap-3 transition-colors duration-200 rounded-sm ${pathname === '/topology' ? 'bg-zinc-900 text-blue-400 border-l-4 border-blue-600' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}`}
            >
              <span className="material-symbols-outlined text-lg">hub</span>
              <span className={`font-mono text-xs uppercase tracking-widest mt-0.5 ${pathname === '/topology' ? 'font-bold' : ''}`}>Topology</span>
            </Link>
            
            <Link 
              href="/firewall" 
              className={`px-4 py-3 flex items-center gap-3 transition-colors duration-200 rounded-sm ${pathname === '/firewall' ? 'bg-zinc-900 text-blue-400 border-l-4 border-blue-600' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}`}
            >
              <span className="material-symbols-outlined text-lg">security</span>
              <span className={`font-mono text-xs uppercase tracking-widest mt-0.5 ${pathname === '/firewall' ? 'font-bold' : ''}`}>Firewall</span>
            </Link>
            
            <Link 
              href="/vault" 
              className={`px-4 py-3 flex items-center gap-3 transition-colors duration-200 rounded-sm ${pathname === '/vault' ? 'bg-zinc-900 text-blue-400 border-l-4 border-blue-600' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}`}
            >
              <span className="material-symbols-outlined text-lg">database</span>
              <span className={`font-mono text-xs uppercase tracking-widest mt-0.5 ${pathname === '/vault' ? 'font-bold' : ''}`}>Vault</span>
            </Link>
            
            <Link 
              href="/router" 
              className={`px-4 py-3 flex items-center gap-3 transition-colors duration-200 rounded-sm ${pathname === '/router' ? 'bg-zinc-900 text-blue-400 border-l-4 border-blue-600' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}`}
            >
              <span className="material-symbols-outlined text-lg">timeline</span>
              <span className={`font-mono text-xs uppercase tracking-widest mt-0.5 ${pathname === '/router' ? 'font-bold' : ''}`}>Router</span>
            </Link>
          </nav>
        </div>
        
        <div className="p-4 border-t border-zinc-900">
          <button className="w-full bg-primary-container text-on-primary-container hover:bg-primary-container/90 rounded-sm py-2 px-4 font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all">
            <span className="material-symbols-outlined text-[16px]">add</span>
            New Instance
          </button>
          <div className="mt-4 flex justify-between px-2">
            <a href="#" className="text-zinc-500 hover:text-zinc-300 transition-colors">
              <span className="material-symbols-outlined text-sm">help</span>
            </a>
            <a href="#" className="text-zinc-500 hover:text-zinc-300 transition-colors">
              <span className="material-symbols-outlined text-sm">contact_support</span>
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
