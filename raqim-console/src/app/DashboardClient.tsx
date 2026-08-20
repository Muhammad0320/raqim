'use client';

import { MainLayout } from '../components/Layout/MainLayout';
import { useSwarmStore } from '../lib/store/useSwarmStore';
import { useSwarmStream } from '../lib/hooks/useSwarmStream';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { DashboardCardsData } from '../lib/api';
import { useHardwareVitals } from '../lib/hooks/useHardwareVitals';
import { LiveSemanticStream } from '../components/LiveSemanticStream';
import styled from 'styled-components';

const ProgressBar = styled.div<{ $width: string }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: ${props => props.$width};
  background-color: #00f3ff;
  box-shadow: 0 0 8px rgba(0, 243, 255, 0.8), 0 0 15px rgba(0, 243, 255, 0.4);
  transition: width 0.3s ease-out;
`;

interface DashboardClientProps {
  initialCards: DashboardCardsData | null;
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export function DashboardClient({ initialCards }: DashboardClientProps) {
  useSwarmStream();
  const currentTps = useSwarmStore(state => state.currentTps);
  const vitalsHistory = useSwarmStore(state => state.vitalsHistory);
  const daemonOnline = useSwarmStore(state => state.daemonOnline);
  const vitals = useHardwareVitals();

  return (
    <MainLayout title="Overview // Glass">
      <div className="flex flex-col h-full overflow-y-auto p-8 gap-6">

        {/* ── Top Metrics ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          {/* Card 1: TOTAL SYSTEM TRANSACTIONS */}
          <div className="bg-surface-container p-5 rounded-lg border-l-2 border-primary relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-[0.2em] font-bold">Total Operations</span>
              <span className="material-symbols-outlined text-outline text-sm">swap_horiz</span>
            </div>
            <div className="font-headline text-4xl font-black text-white relative z-10 tracking-tight">
              {initialCards ? formatNumber(initialCards.global_transactions) : (
                <span className="font-mono text-sm tracking-widest text-outline-variant animate-pulse">[ STANDALONE ]</span>
              )}
            </div>
            <div className="font-mono text-[10px] text-primary mt-2 flex items-center gap-1.5 relative z-10">
              <span className="material-symbols-outlined text-[12px]">database</span> Lifetime WAL + LanceDB Tx
            </div>
          </div>

          {/* Card 2: ACTIVE AGENTS */}
          <div className="bg-surface-container p-5 rounded-lg border-l-2 border-secondary relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-[0.2em] font-bold">Active Enclaves</span>
              <span className="material-symbols-outlined text-outline text-sm">smart_toy</span>
            </div>
            <div className="font-headline text-4xl font-black text-white relative z-10 tracking-tight">
              {initialCards ? initialCards.active_agents : 0}
            </div>
            <div className="font-mono text-[10px] text-secondary mt-2 flex items-center gap-1.5 relative z-10">
              <span className={`w-1.5 h-1.5 rounded-full ${daemonOnline ? 'bg-secondary animate-pulse' : 'bg-[#ff003c]'}`}></span>
              {daemonOnline ? 'Live Swarm Agents' : 'Daemon Offline'}
            </div>
          </div>

          {/* Card 3: REAL-TIME VELOCITY */}
          <div className="bg-surface-container p-5 rounded-lg border-l-2 border-tertiary relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-tertiary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-[0.2em] font-bold">Throughput</span>
              <span className="material-symbols-outlined text-outline text-sm">speed</span>
            </div>
            <div className="font-headline text-4xl font-black text-white relative z-10 tracking-tight flex items-baseline gap-2">
              {currentTps}
              <span className="font-mono text-xs font-normal text-on-surface-variant tracking-widest">TPS</span>
            </div>
            <div className="font-mono text-[10px] text-tertiary mt-2 flex items-center gap-1.5 relative z-10">
              <span className="material-symbols-outlined text-[12px]">bolt</span> 1-Second Rolling Window
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
              {initialCards ? formatNumber(initialCards.vault_capacity) : (
                <span className="font-mono text-sm tracking-widest text-outline-variant animate-pulse">[ STANDALONE ]</span>
              )}
            </div>
            <div className="font-mono text-[10px] text-tertiary mt-2 flex items-center gap-1.5 relative z-10">
              <span className="material-symbols-outlined text-[12px]">memory</span> LanceDB Vectors
            </div>
          </div>
        </div>

        {/* ── Main Content: Table + Sidebar ── */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">

          {/* 2. Live Semantic Stream Table */}
          <div className="col-span-2 min-h-0">
            <LiveSemanticStream />
          </div>

          {/* 3. Sidebar: Hardware Vitals & Velocity Graph */}
          <div className="col-span-1 flex flex-col gap-6 min-h-0">
            
            <div className="bg-surface-container-lowest border border-outline-variant/15 flex flex-col overflow-hidden h-[240px] shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <div className="px-4 py-3 border-b border-outline-variant/15 flex items-center justify-between bg-surface-container-high">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-outline text-sm">show_chart</span>
                  <h3 className="font-mono text-[11px] uppercase text-on-surface-variant tracking-[0.2em] font-bold">Hardware Telemetry (CPU Load)</h3>
                </div>
              </div>
              <div className="flex-1 p-4 pb-0 pl-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={vitalsHistory}>
                    <defs>
                      <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#00f3ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" hide={true} />
                    <YAxis domain={[0, 100]} hide={true} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1c1b1b', border: '1px solid #414754', borderRadius: '4px', fontFamily: 'Space Mono', fontSize: '10px' }}
                      itemStyle={{ color: '#00f3ff' }}
                      labelFormatter={() => ''}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cpu_load_percent" 
                      name="CPU Load %"
                      stroke="#00f3ff" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorCpu)" 
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
                <span className={`px-2 py-0.5 rounded-sm font-mono text-[9px] uppercase tracking-widest ${
                  daemonOnline ? 'bg-secondary/10 text-secondary border border-secondary/30' : 'bg-[#ff003c]/10 text-[#ff003c] border border-[#ff003c]/30'
                }`}>
                  {daemonOnline ? 'Nominal' : 'Offline'}
                </span>
              </div>
              
              <div className="p-5 space-y-6 flex-1 bg-[#0a0a0a]">
                {/* CPU Meter */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">CPU Allocation</span>
                    <span className="font-mono text-[10px] text-white">
                      {vitals ? `${vitals.cpu_percent.toFixed(1)}%` : <span className="animate-pulse">[ STANDBY ]</span>}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container-highest relative overflow-hidden rounded-sm">
                    <ProgressBar $width={vitals ? `${Math.min(vitals.cpu_percent, 100)}%` : '0%'} />
                  </div>
                </div>

                {/* WASM Memory Meter */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">WASM Memory</span>
                    <span className="font-mono text-[10px] text-white">
                      {vitals ? `${vitals.wasm_memory_gb.toFixed(1)}MB / ${vitals.wasm_memory_max_gb.toFixed(1)}GB` : <span className="animate-pulse">[ STANDBY ]</span>}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container-highest relative overflow-hidden rounded-sm">
                    <ProgressBar $width={vitals ? `${Math.min((vitals.wasm_memory_gb / (vitals.wasm_memory_max_gb * 1024)) * 100, 100)}%` : '0%'} />
                  </div>
                </div>

                {/* Latency Meter */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">Mesh Latency</span>
                    <span className="font-mono text-[10px] text-white">
                      {vitals ? `${vitals.mesh_latency_ms.toFixed(0)}ms` : <span className="animate-pulse">[ STANDBY ]</span>}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container-highest relative overflow-hidden rounded-sm">
                    <ProgressBar $width={vitals ? `${Math.min((vitals.mesh_latency_ms / 100) * 100, 100)}%` : '0%'} />
                  </div>
                </div>

                {/* Thermal Status */}
                <div className="pt-4 border-t border-outline-variant/15 flex justify-between items-center">
                   <div className="flex items-center gap-2">
                     <span className="material-symbols-outlined text-outline-variant text-sm">device_thermostat</span>
                     <span className="font-mono text-[10px] text-outline-variant uppercase tracking-widest">Core Temp</span>
                   </div>
                   <span className="font-mono text-[10px] text-tertiary">
                     {vitals ? `${vitals.core_temp_c.toFixed(1)}°C` : <span className="animate-pulse">[ STANDBY ]</span>}
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
