export default function TopologyPage() {
  return (
    <div className="flex h-full w-full">
      {/* Swarm Topology Canvas */}
      <section className="flex-1 bg-surface-container-lowest relative overflow-hidden flex flex-col bg-grid-pattern" style={{ backgroundSize: '32px 32px' }}>
        {/* Canvas Header Toolbar */}
        <div className="h-14 border-b border-outline-variant/15 bg-surface-container/80 backdrop-blur-md flex items-center justify-between px-6 z-10 absolute top-0 w-full">
          <div className="flex items-center gap-4">
            <h1 className="font-headline font-bold text-on-surface tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-outline" data-icon="share">share</span>
              SWARM TOPOLOGY
            </h1>
            <div className="h-4 w-[1px] bg-outline-variant/30"></div>
            <div className="flex items-center gap-2 bg-surface-container-highest px-2 py-1 rounded text-[10px] font-mono text-secondary uppercase tracking-wider border border-outline-variant/15">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              Network Healthy
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-on-surface-variant">Nodes: 04</span>
            <span className="text-xs font-mono text-on-surface-variant">TPS: 1,402</span>
            <div className="h-4 w-[1px] bg-outline-variant/30 mx-2"></div>
            <button className="text-outline hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined" data-icon="filter_list">filter_list</span>
            </button>
            <button className="text-outline hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined" data-icon="fullscreen">fullscreen</span>
            </button>
          </div>
        </div>

        {/* Canvas SVG Connectors (Underneath Nodes) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 mt-14">
          <defs>
            <linearGradient id="line-glow" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#0070f3" stopOpacity="0.2"></stop>
              <stop offset="50%" stopColor="#0070f3" stopOpacity="0.8"></stop>
              <stop offset="100%" stopColor="#0070f3" stopOpacity="0.2"></stop>
            </linearGradient>
          </defs>
          {/* Central to Logistics */}
          <path d="M 350 250 Q 450 150 600 200" fill="none" opacity="0.5" stroke="#414754" strokeDasharray="4 4" strokeWidth="1.5"></path>
          <circle className="animate-ping" cx="475" cy="180" fill="#0070f3" r="3" style={{ animationDuration: '2s' }}></circle>
          {/* Central to Finance */}
          <path d="M 350 300 Q 400 450 550 450" fill="none" opacity="0.5" stroke="#414754" strokeDasharray="4 4" strokeWidth="1.5"></path>
          {/* Central to Auth */}
          <path d="M 250 280 L 150 280" fill="none" opacity="0.5" stroke="#414754" strokeDasharray="4 4" strokeWidth="1.5"></path>
          {/* Logistics to Finance */}
          <path d="M 650 250 L 600 400" fill="none" opacity="0.3" stroke="#4edea3" strokeWidth="1"></path>
        </svg>

        {/* Node Elements */}
        <div className="relative w-full h-full mt-14 z-10">
          {/* Central Orchestrator Node */}
          <div className="absolute top-[35%] left-[25%] glass-panel border border-primary-container/30 rounded p-4 w-64 shadow-[0_20px_40px_rgba(0,0,0,0.5)] agent-scan-line cursor-move hover:border-primary-container transition-colors">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container text-[20px]" data-icon="device_hub">device_hub</span>
                <div className="font-headline font-bold text-on-surface leading-tight text-sm">ORCH-CORE-01</div>
              </div>
              <div className="bg-primary-container/10 text-primary-container px-1.5 py-0.5 rounded text-[9px] font-mono border border-primary-container/20">MASTER</div>
            </div>
            <div className="space-y-1.5 border-t border-outline-variant/15 pt-3">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-outline">CPU_LOAD</span>
                <span className="text-on-surface">14.2%</span>
              </div>
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-outline">MEM_ALLOC</span>
                <span className="text-on-surface">1.2GB / 4.0GB</span>
              </div>
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-outline">A2A_QUEUED</span>
                <span className="text-secondary">0</span>
              </div>
            </div>
          </div>

          {/* Logistics Node */}
          <div className="absolute top-[20%] left-[55%] bg-surface-container-highest border border-outline-variant/20 rounded p-3 w-56 shadow-lg cursor-move hover:bg-surface-bright transition-colors">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-[18px]" data-icon="local_shipping">local_shipping</span>
                <div className="font-headline font-semibold text-on-surface text-sm">LOGIS-AGT-04</div>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
            </div>
            <div className="text-[10px] font-mono text-outline uppercase tracking-wider mb-2">Routing Protocol Active</div>
            <div className="h-1 w-full bg-surface-container rounded overflow-hidden">
              <div className="h-full bg-tertiary w-[75%]"></div>
            </div>
          </div>

          {/* Finance Node */}
          <div className="absolute top-[60%] left-[50%] bg-surface-container-highest border border-outline-variant/20 rounded p-3 w-56 shadow-lg cursor-move hover:bg-surface-bright transition-colors">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px]" data-icon="account_balance">account_balance</span>
                <div className="font-headline font-semibold text-on-surface text-sm">FIN-LEDGER-02</div>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            </div>
            <div className="text-[10px] font-mono text-outline uppercase tracking-wider">Sync: Block #849201</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-outline-variant/15 pt-2">
              <div>
                <div className="text-outline mb-0.5">TX/S</div>
                <div className="text-on-surface">342.1</div>
              </div>
              <div>
                <div className="text-outline mb-0.5">LATENCY</div>
                <div className="text-secondary">12ms</div>
              </div>
            </div>
          </div>

          {/* Auth Node */}
          <div className="absolute top-[40%] left-[5%] bg-surface-container-highest border border-outline-variant/20 rounded p-3 w-48 shadow-lg cursor-move hover:bg-surface-bright transition-colors opacity-60">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-outline text-[16px]" data-icon="key">key</span>
              <div className="font-headline font-semibold text-outline text-sm">AUTH-VAULT</div>
            </div>
            <div className="text-[10px] font-mono text-outline">IDLE_STATE</div>
          </div>
        </div>
      </section>

      {/* Right Sidebar: Agent Capabilities */}
      <aside className="w-80 bg-surface border-l border-outline-variant/15 flex flex-col h-full z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.2)]">
        {/* Header */}
        <div className="p-4 border-b border-outline-variant/15 bg-surface-container-low">
          <h2 className="text-[11px] font-mono uppercase tracking-[0.1em] text-outline mb-3">Active Capabilities</h2>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1.5 text-[16px] text-outline" data-icon="search">search</span>
            <input className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded text-xs py-1.5 pl-8 pr-3 text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/20 transition-all font-mono placeholder:text-outline-variant" placeholder="Filter capabilities..." type="text"/>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* Item 1: Finance Ledger */}
          <div className="group bg-surface-container hover:bg-surface-container-high border border-transparent hover:border-outline-variant/20 rounded p-2.5 cursor-pointer transition-all">
            <div className="flex justify-between items-start mb-1.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[14px]" data-icon="receipt_long">receipt_long</span>
                <span className="font-mono text-xs text-on-surface">rqm_finance/ledger</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_4px_#4edea3]"></span>
            </div>
            <div className="text-[10px] font-body text-on-surface-variant leading-tight pl-6">Handles real-time transaction validation and immutable record appending.</div>
            <div className="pl-6 mt-2 flex gap-2">
              <span className="bg-surface-container-lowest text-outline px-1.5 py-0.5 rounded text-[9px] font-mono border border-outline-variant/10">v1.4.2</span>
              <span className="bg-surface-container-lowest text-outline px-1.5 py-0.5 rounded text-[9px] font-mono border border-outline-variant/10">3 instances</span>
            </div>
          </div>

          {/* Item 2: Routing Protocol */}
          <div className="group bg-surface-container hover:bg-surface-container-high border border-transparent hover:border-outline-variant/20 rounded p-2.5 cursor-pointer transition-all">
            <div className="flex justify-between items-start mb-1.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-[14px]" data-icon="route">route</span>
                <span className="font-mono text-xs text-on-surface">rqm_logistics/routing</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
            </div>
            <div className="text-[10px] font-body text-on-surface-variant leading-tight pl-6">Dynamic pathfinding for physical supply chain assets. High load detected.</div>
            <div className="pl-6 mt-2 flex gap-2">
              <span className="bg-tertiary/10 text-tertiary px-1.5 py-0.5 rounded text-[9px] font-mono border border-tertiary/20">WARN_LATENCY</span>
            </div>
          </div>

          {/* Item 3: Auth Vault */}
          <div className="group bg-surface-container hover:bg-surface-container-high border border-transparent hover:border-outline-variant/20 rounded p-2.5 cursor-pointer transition-all">
            <div className="flex justify-between items-start mb-1.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-outline text-[14px]" data-icon="lock">lock</span>
                <span className="font-mono text-xs text-outline">rqm_auth/vault</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
            </div>
            <div className="text-[10px] font-body text-outline-variant leading-tight pl-6">Key management and signature verification. Currently idle.</div>
          </div>

          {/* Item 4: Telemetry */}
          <div className="group bg-surface-container hover:bg-surface-container-high border border-transparent hover:border-outline-variant/20 rounded p-2.5 cursor-pointer transition-all">
            <div className="flex justify-between items-start mb-1.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container text-[14px]" data-icon="query_stats">query_stats</span>
                <span className="font-mono text-xs text-on-surface">rqm_sys/telemetry</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
            </div>
            <div className="text-[10px] font-body text-on-surface-variant leading-tight pl-6">Aggregates agent health metrics and swarm performance data.</div>
          </div>
        </div>

        {/* Sidebar Footer / Detail Peek */}
        <div className="p-4 border-t border-outline-variant/15 bg-surface-container-lowest">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-outline">System Load</span>
            <span className="text-[10px] font-mono text-on-surface">24%</span>
          </div>
          <div className="w-full h-1 bg-surface-container rounded overflow-hidden">
            <div className="h-full bg-primary-container w-[24%]"></div>
          </div>
        </div>
      </aside>
    </div>
  );
}
