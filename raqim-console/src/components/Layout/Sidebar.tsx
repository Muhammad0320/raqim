import Link from 'next/link';
import { Network, Shield, Database, Route, Terminal } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'TOPOLOGY', path: '/topology', icon: Network },
    { name: 'FIREWALL', path: '/firewall', icon: Shield },
    { name: 'VAULT', path: '/vault', icon: Database },
    { name: 'ROUTER', path: '/router', icon: Route },
    { name: 'KERNEL', path: '/kernel', icon: Terminal },
  ];

  return (
    <aside className="w-[260px] bg-panel border-r border-white/5 flex flex-col h-full shrink-0">
      <div className="p-6 flex items-center gap-4 border-b border-white/5">
        <div className="w-10 h-10 bg-surface border border-white/5 flex items-center justify-center rounded">
          <Shield size={18} className="text-neon-cyan drop-shadow-[0_0_10px_rgba(102,252,241,0.5)]" />
        </div>
        <div>
          <div className="text-[13px] text-white font-semibold tracking-wide font-mono">ROOT_USER</div>
          <div className="text-[10px] text-muted tracking-[1px] mt-1 uppercase">Sovereign Node</div>
        </div>
      </div>

      <nav className="flex-1 py-6 flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || (pathname === '/' && item.path === '/router');
          
          return (
            <Link 
              key={item.path} 
              href={item.path} 
              className={`px-6 py-3 flex items-center gap-4 text-xs font-semibold tracking-[1.5px] transition-colors
                ${isActive 
                  ? 'bg-neon-cyan/5 text-neon-cyan border-l-2 border-neon-cyan' 
                  : 'text-muted-DEFAULT hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                }
              `}
            >
              <Icon size={16} /> <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-white/5">
        <button className="w-full py-3 bg-transparent border border-white/5 text-white text-[11px] font-mono tracking-widest transition-all hover:bg-surface hover:border-neon-cyan hover:shadow-[0_0_10px_rgba(102,252,241,0.1)]">
          + NEW INSTANCE
        </button>
      </div>
    </aside>
  );
}
