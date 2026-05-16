'use client';
import { MainLayout } from '../components/Layout/MainLayout';
import { useSwarmStore } from '../lib/store/useSwarmStore';
import { useSwarmStream } from '../lib/hooks/useSwarmStream';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useEffect, useRef } from 'react';
import { DashboardCardsData } from '../../actions/dashboard';
import { useHardwareVitals } from '../lib/hooks/useHardwareVitals';

const getAgentColor = (hex: string) => {
  let hash = 0;
  for (let i = 0; i < hex.length; i++) {
    hash = hex.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hues = [180, 300, 120, 45, 210];
  const hue = hues[Math.abs(hash) % hues.length];
  return `hsl(${hue}, 100%, 65%)`;
};

interface DashboardClientProps {
  initialCards: DashboardCardsData | null;
  token: string;
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export function DashboardClient({ initialCards, token }: DashboardClientProps) {
  useSwarmStream();
  const thoughts = useSwarmStore(state => state.thoughts);
  const thoughtOrder = useSwarmStore(state => state.thoughtOrder);
  const currentTps = useSwarmStore(state => state.currentTps);
  const tpsHistory = useSwarmStore(state => state.tpsHistory);
  const highestTxId = useSwarmStore(state => state.highestTxId);

  const vitals = useHardwareVitals(token);

  const recentThoughts = thoughtOrder.slice(-50).map(id => thoughts[id]).filter(Boolean);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thoughtOrder.length]);

  return (
    <MainLayout title="Dashboard">
      <div className="flex-1 flex flex-col gap-6 px-8 pb-8 overflow-hidden h-full">

        {/* ── 1. The 4 Metric Cards (Top Row) ── */}
        <div className="grid grid-cols-4 gap-4 flex-shrink-0">
          
          {/* Card 1: GLOBAL TRANSACTIONS */}
          <div className="bg-surface-container p-5 rounded-lg border-l-2 border-primary-container relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-primary-container/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-[0.2em] font-bold">Global Transactions</span>
              <span className="material-symbols-outlined text-outline text-sm">public</span>
            </div>
            <div className="font-headline text-4xl font-black text-white relative z-10 tracking-tight">
              {initialCards ? initialCards.global_transactions.toLocaleString() : <span className="font-mono text-sm tracking-widest text-outline-variant animate-pulse">[ PENDING... ]</span>}
            </div>
            <div className="font-mono text-[10px] text-primary-fixed-dim mt-2 flex items-center gap-1.5 relative z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span> Highest TX_ID tracked
            </div>
          </div>

          {/* Card 2: ACTIVE AGENTS */}
          <div className="bg-surface-container p-5 rounded-lg border-l-2 border-secondary relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-[0.2em] font-bold">Active Agents</span>
              <span className="material-symbols-outlined text-outline text-sm">hub</span>
            </div>
            <div className="font-headline text-4xl font-black text-white relative z-10 tracking-tight">
              {initialCards ? initialCards.active_agents : <span className="font-mono text-sm tracking-widest text-outline-variant animate-pulse">[ PENDING... ]</span>}
            </div>
            <div className="font-mono text-[10px] text-secondary mt-2 flex items-center gap-1.5 relative z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Unique 60s rolling window
            </div>
          </div>

          {/* Card 3: SWARM VELOCITY (TPS) */}
          <div className="bg-surface-container p-5 rounded-lg border-l-2 border-[#00f3ff] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-[#00f3ff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-[0.2em] font-bold">Swarm Velocity</span>
              <span className="material-symbols-outlined text-outline text-sm">speed</span>
            </div>
            <div className={`font-headline text-4xl font-black relative z-10 tracking-tight transition-colors duration-200 ${currentTps > 0 ? 'text-[#00f3ff] drop-shadow-[0_0_8px_rgba(0,243,255,0.4)]' : 'text-white'}`}>
              0 <span className="text-sm text-outline-variant font-mono">TPS</span>
            </div>
            <div className="font-mono text-[10px] text-[#00f3ff] mt-2 flex items-center gap-1.5 relative z-10 opacity-80">
              <span className="material-symbols-outlined text-[12px]">bolt</span> Real-time network throughput
            </div>
          </div>

          {/* Card 4: VAULT CAPACITY */}
          <div className="bg-surface-container p-5 rounded-lg border-l-2 border-tertiary relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-tertiary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-[0.2em] font-bold">Vault Capacity</span>
              <span className="material-symbols-outlined text-outline text-sm">database</span>
            </div>
            <div className="font-headline text-4xl font-black text-white relative z-10 tracking-tight">
              {initialCards ? formatNumber(initialCards.vault_capacity) : <span className="font-mono text-sm tracking-widest text-outline-variant animate-pulse">[ PENDING... ]</span>}
            </div>
            <div className="font-mono text-[10px] text-tertiary mt-2 flex items-center gap-1.5 relative z-10">
              <span className="material-symbols-outlined text-[12px]">memory</span> LanceDB Vectors (Static)
            </div>
          </div>
        </div>

        {/* ── Main Content: Table + Sidebar ── */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">

          {/* 2. Live Semantic Stream Table */}
          <div className="col-span-2 bg-surface-container-lowest border border-outline-variant/15 flex flex-col overflow-hidden relative shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="bg-surface-container-high px-6 py-3 flex-shrink-0 flex justify-between items-center border-b border-outline-variant/20">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant text-sm">data_array</span>
                <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-[0.2em] font-bold">Live Semantic Stream</span>
              </div>
              <span className="bg-[#00f3ff]/10 text-[#00f3ff] border border-[#00f3ff]/30 px-2 py-0.5 rounded-sm font-mono text-[9px] uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00f3ff] animate-pulse"></span> Buffered
              </span>
            </div>
            
            <div className="grid grid-cols-12 gap-4 px-6 py-2 bg-surface-container border-b border-outline-variant/10 font-mono text-[9px] uppercase tracking-widest text-outline">
              <div className="col-span-2">TX_ID</div>
              <div className="col-span-3">AGENT</div>
              <div className="col-span-3">NAMESPACE</div>
              <div className="col-span-4">PAYLOAD</div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[#0a0a0a] scroll-smooth pb-4">
              {recentThoughts.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <span className="font-mono text-xs text-outline-variant uppercase tracking-widest animate-pulse">Awaiting semantic ingress...</span>
                </div>
              ) : (
                recentThoughts.map((thought) => (
                  <div key={thought.tx_id} className="grid grid-cols-12 gap-4 px-6 py-2 border-b border-outline-variant/5 hover:bg-surface-container-low transition-colors items-center font-mono text-xs group">
                    <div className="col-span-2 text-outline-variant opacity-60 group-hover:opacity-100 transition-opacity">
                      {thought.tx_id.toString().padStart(6, '0')}
                    </div>
                    <div className="col-span-3 flex items-center gap-2 truncate">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getAgentColor(thought.agent_hex) }}></span>
                      <span style={{ color: getAgentColor(thought.agent_hex) }}>{thought.agent_hex}</span>
                    </div>
                    <div className="col-span-3 text-tertiary truncate opacity-90">
                      {thought.intent_path}
                    </div>
                    <div className="col-span-4 text-on-surface-variant truncate opacity-80">
                      {thought.text}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 3. Sidebar: Hardware Vitals & Velocity Graph */}
          <div className="col-span-1 flex flex-col gap-6 min-h-0">
            
            <div className="bg-surface-container-lowest border border-outline-variant/15 flex flex-col overflow-hidden h-[240px] shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <div className="px-4 py-3 border-b border-outline-variant/15 flex items-center justify-between bg-surface-container-high">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline text-sm">show_chart</span>
                  <h3 className="font-mono text-[11px] uppercase text-on-surface-variant tracking-[0.2em] font-bold">Velocity Graph</h3>
                </div>
              </div>
              <div className="flex-1 p-4 pb-0 pl-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tpsHistory}>
                    <defs>
                      <linearGradient id="colorTps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#00f3ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" hide={true} />
                    <YAxis domain={['auto', 'auto']} hide={true} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1c1b1b', border: '1px solid #414754', borderRadius: '4px', fontFamily: 'Space Mono', fontSize: '10px' }}
                      itemStyle={{ color: '#00f3ff' }}
                      labelFormatter={() => ''}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="tps" 
                      stroke="#00f3ff" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorTps)" 
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Hardware Vitals */}
            <div className="bg-surface-container-lowest border border-outline-variant/15 flex flex-col overflow-hidden flex-1 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <div className="px-4 py-3 border-b border-outline-variant/15 flex items-center justify-between bg-surface-container-high">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline text-sm">memory</span>
                  <h3 className="font-mono text-[11px] uppercase text-on-surface-variant tracking-[0.2em] font-bold">Hardware Vitals</h3>
                </div>
                <span className="bg-secondary/10 text-secondary border border-secondary/30 px-2 py-0.5 rounded-sm font-mono text-[9px] uppercase tracking-widest">
                  Nominal
                </span>
              </div>
              
              <div className="p-5 space-y-6 flex-1 bg-[#0a0a0a]">
                {/* CPU Meter */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">CPU Allocation</span>
                    <span className="font-mono text-[10px] text-white">
                      {vitals ? `${vitals.cpu_percent.toFixed(1)}%` : <span className="animate-pulse">[ PENDING... ]</span>}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container-highest relative overflow-hidden rounded-sm">
                    <div 
                      className="absolute top-0 left-0 h-full bg-secondary"
                      style={{ 
                        width: vitals ? `${Math.min(vitals.cpu_percent, 100)}%` : '0%',
                        transition: 'width 0.3s ease-out'
                      }}
                    />
                  </div>
                </div>

                {/* WASM Memory Meter */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">WASM Memory</span>
                    <span className="font-mono text-[10px] text-white">
                      {vitals ? `${vitals.wasm_memory_gb.toFixed(1)}GB / ${vitals.wasm_memory_max_gb.toFixed(1)}GB` : <span className="animate-pulse">[ PENDING... ]</span>}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container-highest relative overflow-hidden rounded-sm">
                    <div 
                      className="absolute top-0 left-0 h-full bg-[#00f3ff]"
                      style={{ 
                        width: vitals ? `${Math.min((vitals.wasm_memory_gb / vitals.wasm_memory_max_gb) * 100, 100)}%` : '0%',
                        transition: 'width 0.3s ease-out'
                      }}
                    />
                  </div>
                </div>

                {/* Latency Meter */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">Mesh Latency</span>
                    <span className="font-mono text-[10px] text-white">
                      {vitals ? `${vitals.mesh_latency_ms.toFixed(0)}ms` : <span className="animate-pulse">[ PENDING... ]</span>}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container-highest relative overflow-hidden rounded-sm">
                    <div 
                      className="absolute top-0 left-0 h-full bg-secondary"
                      style={{ 
                        width: vitals ? `${Math.min((vitals.mesh_latency_ms / 100) * 100, 100)}%` : '0%', // Assume 100ms is max for bar width
                        transition: 'width 0.3s ease-out'
                      }}
                    />
                  </div>
                </div>

                {/* Thermal Status */}
                <div className="pt-4 border-t border-outline-variant/15 flex justify-between items-center">
                   <div className="flex items-center gap-2">
                     <span className="material-symbols-outlined text-outline-variant text-sm">device_thermostat</span>
                     <span className="font-mono text-[10px] text-outline-variant uppercase tracking-widest">Core Temp</span>
                   </div>
                   <span className="font-mono text-[10px] text-tertiary">
                     {vitals ? `${vitals.core_temp_c.toFixed(1)}°C` : <span className="animate-pulse">[ PENDING... ]</span>}
                   </span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </MainLayout>
  );
}
