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
      
      {/* The Logo Area - Pure Mathematical Geometry */}
      <div className="px-6 py-6 border-b border-zinc-900 flex items-center gap-4 shrink-0">
        <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#00f3ff]">
          <path d="M50 5 L95 27.5 L95 72.5 L50 95 L5 72.5 L5 27.5 Z" stroke="currentColor" strokeWidth="4" fill="none" />
          <path d="M50 5 L50 50 M95 27.5 L50 50 M95 72.5 L50 50 M50 95 L50 50 M5 72.5 L50 50 M5 27.5 L50 50" stroke="currentColor" strokeWidth="2" opacity="0.5" />
          <circle cx="50" cy="50" r="10" fill="currentColor" />
          <circle cx="50" cy="50" r="4" fill="#09090b" />
        </svg>
        <span className="font-mono text-lg font-black tracking-[0.2em] text-white">RAQIM OS</span>
      </div>

      <div className="flex flex-col h-full overflow-hidden">
        
        {/* The Identity Plate - Sleek Dark Box */}
        <div className="px-6 py-6 mb-2 shrink-0 bg-[#0c0c0e] border-b border-zinc-900">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0 shadow-inner">
               <span className="font-mono text-sm font-bold text-zinc-300 tracking-widest">JC</span>
            </div>
            <div className="flex flex-col">
              <h2 className="font-mono text-xs font-bold text-white tracking-widest leading-tight">TENANT: JPM_CHASE</h2>
            </div>
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
          <button className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-white text-zinc-500 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-colors">
            MANAGE SWARM KEYS
          </button>
        </div>
      </div>
    </aside>
  );
}
