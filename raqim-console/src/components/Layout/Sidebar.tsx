import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', icon: 'dashboard', label: 'Dashboard' },
    { href: '/topology', icon: 'hub', label: 'Topology' },
    { href: '/firewall', icon: 'security', label: 'Aegis Firewall' },
    { href: '/vault', icon: 'database', label: 'Audit Vault' },
    { href: '/router', icon: 'timeline', label: 'Memory Router' },
  ];

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col bg-zinc-950 z-40 border-r border-zinc-900 hidden md:flex h-full">
      
      {/* The Logo Area */}
      <div className="px-6 py-6 border-b border-zinc-900 flex items-center gap-4 shrink-0">
        <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#00f3ff] drop-shadow-[0_0_8px_rgba(0,243,255,0.6)]">
          <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" stroke="currentColor" strokeWidth="4" fill="none" />
          <path d="M50 25 L75 38 L75 62 L50 75 L25 62 L25 38 Z" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="50" cy="50" r="6" fill="currentColor" />
          <line x1="50" y1="5" x2="50" y2="25" stroke="currentColor" strokeWidth="2" />
          <line x1="10" y1="25" x2="25" y2="38" stroke="currentColor" strokeWidth="2" />
          <line x1="90" y1="25" x2="75" y2="38" stroke="currentColor" strokeWidth="2" />
          <line x1="10" y1="75" x2="25" y2="62" stroke="currentColor" strokeWidth="2" />
          <line x1="90" y1="75" x2="75" y2="62" stroke="currentColor" strokeWidth="2" />
          <line x1="50" y1="95" x2="50" y2="75" stroke="currentColor" strokeWidth="2" />
        </svg>
        <span className="font-mono text-lg font-black tracking-[0.2em] text-white">RAQIM<span className="text-[#00f3ff] ml-1">CONSOLE</span></span>
      </div>

      <div className="flex flex-col h-full overflow-hidden">
        
        {/* The Identity Plate */}
        <div className="px-6 py-6 mb-2 shrink-0 bg-zinc-900/20 border-b border-zinc-900">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-10 rounded-full border border-[#00f3ff]/50 bg-zinc-950 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,243,255,0.2)]">
              <span className="font-mono font-bold text-[#00f3ff] text-lg">J</span>
            </div>
            <div className="flex flex-col">
              <h2 className="font-mono text-xs font-bold text-white uppercase tracking-widest leading-tight">JPM_CHASE_PROD</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 bg-zinc-950 px-2 py-1 border border-zinc-800 w-max">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_#22c55e]"></span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-400">SECURE_ENCLAVE</span>
          </div>
        </div>

        {/* The Navigation Links */}
        <nav className="flex flex-col flex-1 overflow-y-auto py-4">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href}
                href={link.href} 
                className={`px-6 py-4 flex items-center gap-4 group ${isActive ? 'bg-zinc-900 border-l-2 border-[#00f3ff]' : 'border-l-2 border-transparent hover:bg-zinc-900 hover:border-[#00f3ff]'}`}
              >
                <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-[#00f3ff] drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]' : 'text-zinc-500 group-hover:text-[#00f3ff] group-hover:drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]'}`}>
                  {link.icon}
                </span>
                <span className={`font-mono text-xs uppercase tracking-widest mt-0.5 ${isActive ? 'text-white font-bold drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : 'text-zinc-400 group-hover:text-white group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]'}`}>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </nav>
        
        {/* The Bottom Action Button */}
        <div className="p-6 border-t border-zinc-900 shrink-0">
          <button className="w-full bg-zinc-900 border border-zinc-700 hover:border-[#00f3ff] hover:text-[#00f3ff] text-zinc-400 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-colors">
            <span className="material-symbols-outlined text-[16px]">key</span>
            MANAGE SWARM KEYS
          </button>
        </div>
      </div>
    </aside>
  );
}
