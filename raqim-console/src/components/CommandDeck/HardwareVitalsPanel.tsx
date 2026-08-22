'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSwarmStore } from '../../lib/store/useSwarmStore';
import { useHardwareVitals } from '../../lib/hooks/useHardwareVitals';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Cpu, HardDrive, Shield, Activity, ArrowUpRight, Flame } from 'lucide-react';

export function HardwareVitalsPanel() {
  const vitalsHistory = useSwarmStore((state) => state.vitalsHistory);
  const clusterInfo = useSwarmStore((state) => state.clusterInfo);
  const quarantinedAgents = useSwarmStore((state) => state.quarantinedAgents);
  const aegisAlerts = useSwarmStore((state) => state.aegisAlerts);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const vitals = useHardwareVitals();

  const maxMemoryMb = 16384; // 16GB ceiling
  const currentRamMb = vitals?.ram_mb ?? 0;
  const ramPercent = Math.min((currentRamMb / maxMemoryMb) * 100, 100);

  const walBytes = clusterInfo?.wal_bytes ?? 0;
  const walMb = (walBytes / (1024 * 1024)).toFixed(1);
  const bufferLoad = clusterInfo?.buffer_load ?? 0;

  const totalQuarantined = quarantinedAgents.length;
  const hasInterdictions = totalQuarantined > 0 || aegisAlerts.length > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
      {/* ── 1. CPU Load Area Chart (60s) ── */}
      <div className="bg-[#0D1322] border border-slate-800 rounded-sm p-3 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider font-semibold">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>CPU Allocation (60s)</span>
          </div>
          <span className="font-mono text-xs font-bold text-cyan-400">
            {vitals ? `${vitals.cpu_percent.toFixed(1)}%` : '--%'}
          </span>
        </div>

        <div className="flex-1 w-full min-h-[90px] h-[90px] min-w-0 relative mt-1">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={80}>
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
                    backgroundColor: '#090E1A',
                    borderColor: '#1E293B',
                    borderRadius: '2px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                  }}
                  itemStyle={{ color: '#00f3ff' }}
                  labelStyle={{ color: '#94a3b8' }}
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
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-950/40 rounded-xs border border-slate-900 font-mono text-[9px] text-slate-600">
              [ SAMPLING KERNEL TELEMETRY ]
            </div>
          )}
        </div>
      </div>

      {/* ── 2. RAM Heap & Ceiling Gauge ── */}
      <div className="bg-[#0D1322] border border-slate-800 rounded-sm p-3 flex flex-col gap-2 shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider font-semibold">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>Process Heap / Ceiling</span>
          </div>
          <span className="font-mono text-xs text-indigo-300 font-bold">
            {vitals ? `${(vitals.ram_mb / 1024).toFixed(2)} GB` : '-- GB'}
          </span>
        </div>

        <div className="space-y-1.5 my-auto">
          <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
            <span>ALLOCATED: {currentRamMb.toFixed(0)} MB</span>
            <span>CEILING: 16.0 GB</span>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-xs overflow-hidden border border-slate-800">
            <div
              className="h-full bg-indigo-500 shadow-[0_0_8px_#6366f1] transition-all duration-300"
              style={{ width: `${ramPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 font-mono text-[10px] text-slate-500">
          <span>HEAP UTILIZATION</span>
          <span className="text-indigo-400 font-semibold">{ramPercent.toFixed(1)}%</span>
        </div>
      </div>

      {/* ── 3. WAL NVMe Footprint ── */}
      <div className="bg-[#0D1322] border border-slate-800 rounded-sm p-3 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider font-semibold">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span>WAL NVMe Footprint</span>
          </div>
          <span className="font-mono text-[10px] text-emerald-400/80 uppercase">GROUP COMMIT</span>
        </div>

        <div className="my-1 flex items-baseline justify-between">
          <span className="font-mono text-xl font-bold text-white tracking-tight">
            {walMb} <span className="text-xs font-normal text-slate-400">MB</span>
          </span>
          <span className="font-mono text-xs text-emerald-400">
            {bufferLoad} BUFFER
          </span>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 font-mono text-[10px] text-slate-400">
          <span>ZERO-COPY RING</span>
          <span className="text-emerald-400 font-semibold">O_DIRECT SYNC</span>
        </div>
      </div>

      {/* ── 4. Aegis Security Perimeter Status ── */}
      <div className="bg-[#0D1322] border border-slate-800 rounded-sm p-3 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider font-semibold">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Aegis Security Perimeter</span>
          </div>
          <Link
            href="/aegis"
            className="flex items-center gap-0.5 text-cyan-400 hover:text-cyan-300 font-mono text-[10px] uppercase font-bold"
          >
            <span>SOC</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="my-1">
          <span
            className={`font-mono text-xs font-bold px-2 py-0.5 rounded-xs border inline-flex items-center gap-1.5 ${
              hasInterdictions
                ? 'bg-rose-950/80 text-rose-400 border-rose-800'
                : 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
            }`}
          >
            {hasInterdictions ? (
              <>
                <Flame className="w-3 h-3 text-rose-400" />
                <span>INTERDICTIONS DETECTED ({totalQuarantined})</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ALL GATES SECURE</span>
              </>
            )}
          </span>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 font-mono text-[10px] text-slate-400">
          <span>QUARANTINE JAIL</span>
          <span className={totalQuarantined > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
            {totalQuarantined} ENCLAVES
          </span>
        </div>
      </div>
    </div>
  );
}
