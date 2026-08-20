'use client';

import React from 'react';
import Link from 'next/link';
import { useSwarmStore } from '../../lib/store/useSwarmStore';
import { useHardwareVitals } from '../../lib/hooks/useHardwareVitals';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Cpu, HardDrive, Shield, Activity, ArrowUpRight, Flame } from 'lucide-react';

export function HardwareVitalsPanel() {
  const vitalsHistory = useSwarmStore((state) => state.vitalsHistory);
  const clusterInfo = useSwarmStore((state) => state.clusterInfo);
  const vaultTelemetry = useSwarmStore((state) => state.vaultTelemetry);
  const quarantinedAgents = useSwarmStore((state) => state.quarantinedAgents);
  const aegisAlerts = useSwarmStore((state) => state.aegisAlerts);
  const daemonOnline = useSwarmStore((state) => state.daemonOnline);

  const vitals = useHardwareVitals();

  // Compute WAL footprint
  const walBytes = clusterInfo?.wal_bytes ?? (vaultTelemetry?.wal_pending_count ? vaultTelemetry.wal_pending_count * 256 : 0);
  const walSizeMb = (walBytes / (1024 * 1024)).toFixed(2);

  const ramUsedMb = vitals?.wasm_memory_gb ? (vitals.wasm_memory_gb > 500 ? vitals.wasm_memory_gb : vitals.wasm_memory_gb * 1024) : 0;
  const ramMaxMb = 16384; // 16 GB Max Memory Ceiling
  const ramPercent = Math.min((ramUsedMb / ramMaxMb) * 100, 100);

  const interdictionCount = quarantinedAgents.length + aegisAlerts.length;

  return (
    <aside className="w-full h-full flex flex-col gap-3 shrink-0 overflow-y-auto">
      {/* ── 1. CPU Utilization Area Chart ── */}
      <div className="bg-[#0D1322] border border-slate-800 rounded-sm p-3 flex flex-col h-48 relative overflow-hidden shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1 shrink-0">
          <div className="flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider font-semibold">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>CPU Allocation (60s)</span>
          </div>
          <span className="font-mono text-xs font-bold text-cyan-400">
            {vitals ? `${vitals.cpu_percent.toFixed(1)}%` : '--%'}
          </span>
        </div>

        <div className="flex-1 w-full min-h-0 relative mt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={vitalsHistory}>
              <defs>
                <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" hide />
              <YAxis domain={[0, 100]} hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#070B12',
                  border: '1px solid #1e293b',
                  borderRadius: '2px',
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  padding: '4px 8px',
                }}
                itemStyle={{ color: '#22d3ee' }}
                labelFormatter={() => ''}
                formatter={(val: any) => [`${Number(val).toFixed(1)}%`, 'CPU Load']}
              />
              <Area
                type="monotone"
                dataKey="cpu_load_percent"
                name="CPU Load"
                stroke="#06b6d4"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#cpuGradient)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 2. RAM Heap & Ceiling Gauge ── */}
      <div className="bg-[#0D1322] border border-slate-800 rounded-sm p-3 flex flex-col gap-2 shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider font-semibold">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>Process Heap / Ceiling</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">16 GB CEILING</span>
        </div>

        <div className="flex items-baseline justify-between font-mono text-xs">
          <span className="font-bold text-white">
            {vitals ? `${ramUsedMb.toFixed(1)} MB` : '-- MB'}
          </span>
          <span className="text-slate-400">
            {vitals ? `${ramPercent.toFixed(1)}% ALLOCATED` : '0%'}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-slate-950 rounded-xs overflow-hidden border border-slate-800/80">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
            style={{ width: `${ramPercent}%` }}
          />
        </div>
      </div>

      {/* ── 3. WAL NVMe Disk Footprint ── */}
      <div className="bg-[#0D1322] border border-slate-800 rounded-sm p-3 flex flex-col gap-2 shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider font-semibold">
            <HardDrive className="w-3.5 h-3.5 text-amber-400" />
            <span>WAL NVMe Footprint</span>
          </div>
          <span className="font-mono text-[10px] text-amber-400/90 font-medium">
            ATOMIC GROUP COMMIT
          </span>
        </div>

        <div className="flex items-baseline justify-between font-mono">
          <span className="text-lg font-bold text-white tracking-tight">
            {walSizeMb} <span className="text-xs text-slate-400 font-normal">MB</span>
          </span>
          <span className="text-[10px] text-slate-400">
            BUFFER: {clusterInfo?.buffer_load ?? vaultTelemetry?.wal_pending_count ?? 0} PENDING
          </span>
        </div>

        <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between font-mono text-[10px] text-slate-400">
          <span>O_DIRECT SYNC</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ZERO-COPY RING
          </span>
        </div>
      </div>

      {/* ── 4. Aegis Security Status ── */}
      <div className="bg-[#0D1322] border border-slate-800 rounded-sm p-3 flex flex-col gap-2 shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider font-semibold">
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            <span>Aegis Security Perimeter</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">ZERO-TRUST</span>
        </div>

        <div className="my-0.5">
          {interdictionCount === 0 ? (
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <span>ALL GATES SECURE</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-rose-400 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
              <span>INTERDICTIONS DETECTED ({interdictionCount})</span>
            </div>
          )}
        </div>

        <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between font-mono text-[10px]">
          <span className="text-slate-400">JAIL BLOCKS: {quarantinedAgents.length}</span>
          <Link
            href="/firewall"
            className="text-rose-400 hover:text-rose-300 flex items-center gap-0.5 hover:underline transition-colors"
          >
            <span>[Manage Firewall -&gt;]</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ── 5. Mesh & Thermal Diagnostics ── */}
      <div className="bg-[#0D1322] border border-slate-800 rounded-sm p-3 flex items-center justify-between font-mono text-xs text-slate-400 shadow-sm mt-auto">
        <div className="flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-sans text-[10px] uppercase tracking-wider text-slate-400">CORE TEMP:</span>
          <span className="text-white font-bold">
            {vitals?.core_temp_c ? `${vitals.core_temp_c.toFixed(1)}°C` : 'NOMINAL'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-sans text-[10px] uppercase tracking-wider text-slate-400">MESH RTT:</span>
          <span className="text-cyan-400 font-bold">
            {vitals?.mesh_latency_ms ? `${vitals.mesh_latency_ms}ms` : '12ms'}
          </span>
        </div>
      </div>
    </aside>
  );
}
