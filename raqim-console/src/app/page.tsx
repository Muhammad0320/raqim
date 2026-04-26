'use client';
import { MainLayout } from '../components/Layout/MainLayout';
import { useSwarmStore } from '../lib/store/useSwarmStore';
import { useSwarmStream } from '../lib/hooks/useSwarmStream';

export default function DashboardPage() {
  useSwarmStream();
  const thoughts = useSwarmStore(state => state.thoughts);
  const thoughtOrder = useSwarmStore(state => state.thoughtOrder);

  const totalThoughts = thoughtOrder.length;
  const rejectedCount = Object.values(thoughts).filter(t => t.status === 'REJECTED').length;
  const forkedCount = Object.values(thoughts).filter(t => t.status === 'FORKED').length;
  const recentThoughts = thoughtOrder.slice(-6).reverse().map(id => thoughts[id]).filter(Boolean);

  return (
    <MainLayout title="Dashboard">
      <div className="flex-1 flex flex-col gap-6 px-8 pb-8 overflow-y-auto">

        {/* ── Hero Metrics Row ── */}
        <div className="grid grid-cols-4 gap-4 flex-shrink-0">
          {/* TPS */}
          <div className="bg-surface-container p-5 rounded-lg ghost-border relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-primary-container/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <span className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">Transactions</span>
              <span className="material-symbols-outlined text-outline">speed</span>
            </div>
            <div className="font-headline text-4xl font-bold text-on-surface relative z-10">{totalThoughts.toLocaleString()}</div>
            <div className="font-mono text-[10px] text-secondary mt-2 flex items-center gap-1 relative z-10">
              <span className="material-symbols-outlined text-[12px]">trending_up</span> Live from SSE firehose
            </div>
          </div>

          {/* Agents */}
          <div className="bg-surface-container p-5 rounded-lg ghost-border relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <span className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">Active Agents</span>
              <span className="material-symbols-outlined text-outline">hub</span>
            </div>
            <div className="font-headline text-4xl font-bold text-on-surface">{new Set(Object.values(thoughts).map(t => t.agent_hex)).size}</div>
            <div className="font-mono text-[10px] text-on-surface-variant mt-2 flex items-center gap-1">
              Unique agent_hex identifiers
            </div>
          </div>

          {/* Quarantined */}
          <div className="bg-surface-container p-5 rounded-lg ghost-border relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-error/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <span className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">Rejected</span>
              <span className="material-symbols-outlined text-error">gpp_bad</span>
            </div>
            <div className="font-headline text-4xl font-bold text-error relative z-10">{rejectedCount}</div>
            <div className="font-mono text-[10px] text-error mt-2 flex items-center gap-1 relative z-10">
              {rejectedCount > 0 ? <><span className="material-symbols-outlined text-[12px]">warning</span> Aegis intervention required</> : <><span className="material-symbols-outlined text-[12px]">check_circle</span> All clear</>}
            </div>
          </div>

          {/* Forked */}
          <div className="bg-surface-container p-5 rounded-lg ghost-border relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <span className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">Reality Forks</span>
              <span className="material-symbols-outlined text-tertiary">alt_route</span>
            </div>
            <div className="font-headline text-4xl font-bold text-on-surface">{forkedCount}</div>
            <div className="font-mono text-[10px] text-tertiary mt-2 flex items-center gap-1">
              Alternate timelines branched
            </div>
          </div>
        </div>

        {/* ── Main Content: Two Columns ── */}
        <div className="flex-1 grid grid-cols-3 gap-6 min-h-0">

          {/* Recent Activity Feed */}
          <div className="col-span-2 bg-surface-container-lowest rounded-lg ghost-border flex flex-col overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-container/50 to-transparent"></div>
            <div className="bg-surface-container-high px-6 py-4 border-b border-outline-variant/20 flex-shrink-0 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant text-sm">list_alt</span>
                <span className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">Recent Swarm Activity</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {recentThoughts.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-4xl text-outline-variant mb-2 block">hourglass_empty</span>
                    <p className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">Awaiting swarm data...</p>
                    <p className="font-mono text-[10px] text-outline mt-1">Connect SSE firehose to populate</p>
                  </div>
                </div>
              ) : (
                recentThoughts.map((thought) => {
                  let statusColor = 'text-secondary';
                  let statusBg = 'bg-secondary/10';
                  let statusLabel = 'OK';
                  let rowBg = '';

                  if (thought.status === 'REJECTED') {
                    statusColor = 'text-error'; statusBg = 'bg-error/10'; statusLabel = 'REJECT'; rowBg = 'bg-error/5';
                  } else if (thought.status === 'FORKED') {
                    statusColor = 'text-tertiary'; statusBg = 'bg-tertiary/10'; statusLabel = 'FORK';
                  } else if (thought.status === 'PENDING') {
                    statusColor = 'text-outline'; statusBg = 'bg-outline-variant/20'; statusLabel = 'SYNC';
                  }

                  return (
                    <div key={thought.tx_id} className={`grid grid-cols-12 gap-4 items-center px-6 py-3 hover:bg-surface-container-low transition-colors border-b border-outline-variant/10 ${rowBg}`}>
                      <div className="col-span-2 font-mono text-xs text-primary-fixed-dim">0x{thought.tx_id.toString().padStart(6, '0').toUpperCase()}</div>
                      <div className="col-span-3 font-mono text-sm text-on-surface truncate">{thought.agent_hex}</div>
                      <div className="col-span-4 font-mono text-xs text-on-surface-variant truncate">{thought.intent_path}</div>
                      <div className="col-span-1 text-center">
                        <span className={`${statusBg} ${statusColor} px-2 py-0.5 rounded-sm text-[10px] font-mono`}>{statusLabel}</span>
                      </div>
                      <div className="col-span-2 font-mono text-[10px] text-outline truncate text-right">{thought.text.slice(0, 30)}...</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* System Status Panel */}
          <div className="col-span-1 flex flex-col gap-4">
            {/* Swarm Health */}
            <div className="bg-surface-container rounded-lg p-5 ghost-border flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-container-high/50 pointer-events-none"></div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <h3 className="text-xs font-label uppercase tracking-[0.05rem] text-on-surface-variant flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">monitoring</span> Swarm Health
                </h3>
                <span className="bg-secondary/20 text-secondary px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span> Nominal
                </span>
              </div>
              <div className="space-y-3 relative z-10">
                <div className="flex justify-between items-center border-b border-outline-variant/15 pb-2">
                  <span className="font-mono text-xs text-on-surface-variant">CPU Load</span>
                  <span className="font-mono text-xs text-on-surface">14.2%</span>
                </div>
                <div className="flex justify-between items-center border-b border-outline-variant/15 pb-2">
                  <span className="font-mono text-xs text-on-surface-variant">WASM Memory</span>
                  <span className="font-mono text-xs text-on-surface">1.2GB / 4.0GB</span>
                </div>
                <div className="flex justify-between items-center border-b border-outline-variant/15 pb-2">
                  <span className="font-mono text-xs text-on-surface-variant">Latency</span>
                  <span className="font-mono text-xs text-secondary">12ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs text-on-surface-variant">Core Temp</span>
                  <span className="font-mono text-xs text-on-surface">42°C</span>
                </div>
              </div>
            </div>

            {/* TCP Firehose */}
            <div className="bg-surface-container rounded-lg ghost-border flex flex-col overflow-hidden flex-1">
              <div className="px-4 py-3 border-b border-outline-variant/15 flex items-center justify-between">
                <h3 className="font-headline text-xs uppercase text-on-surface-variant tracking-widest font-semibold">TCP Firehose</h3>
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              </div>
              <div className="flex-1 p-3 overflow-y-auto font-mono text-[10px] text-on-surface-variant space-y-1 bg-surface-container-lowest">
                <div className="text-secondary opacity-80">&gt; msg_rcv: 0x9f4a (sz: 1.2kb)</div>
                <div className="text-secondary opacity-60">&gt; msg_rcv: 0x9f4b (sz: 0.8kb)</div>
                <div className="text-error opacity-90">&gt; err: socket_timeout [AUTH]</div>
                <div className="text-secondary opacity-40">&gt; msg_rcv: 0x9f4c (sz: 4.1kb)</div>
                <div className="text-secondary opacity-30">&gt; msg_rcv: 0x9f4d (sz: 0.2kb)</div>
                <div className="text-tertiary opacity-70">&gt; warn: high_entropy 8.442</div>
                <div className="text-secondary opacity-20">&gt; msg_rcv: 0x9f4e (sz: 0.1kb)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
