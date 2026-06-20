import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-zinc-300 font-mono px-6">
      <div className="max-w-2xl border border-zinc-800 bg-zinc-950 p-8 md:p-12 shadow-2xl relative">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-red-500 via-cyan-500 to-red-500"></div>
        
        <h1 className="text-2xl md:text-3xl font-extrabold text-red-500 tracking-tight uppercase mb-4">
          404 | EXCEPTION: KERNEL_PANIC_ROUTE_NOT_FOUND
        </h1>
        
        <div className="space-y-4 mb-8 text-zinc-400 text-sm leading-relaxed border-t border-b border-zinc-900 py-6">
          <p>
            [EIP: 0x0000000000000000] Virtual routing table traversal failed. 
            The requested resource is unmapped or quarantined by Aegis Firewall.
          </p>
          <p className="text-zinc-600">
            Stack trace:
            <br />
            &gt; raqim_router::resolve_path() - ERR_NOT_FOUND
            <br />
            &gt; raqim_cloud::app::middleware() - PANIC
          </p>
        </div>

        <Link 
          href="/" 
          className="inline-block bg-black text-white hover:text-[#00E5FF] border border-zinc-800 hover:border-[#00E5FF] px-6 py-3 font-mono text-sm tracking-widest uppercase transition-all duration-200"
        >
          [ Return to Terminal ]
        </Link>
      </div>
    </div>
  );
}
