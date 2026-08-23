'use client';

import React, { useMemo } from 'react';
import { useSwarmStore } from '../../lib/store/useSwarmStore';
import { useHardwareVitals } from '../../lib/hooks/useHardwareVitals';
import { Zap, Cpu, HardDrive, Shield, Activity } from 'lucide-react';

export function HardwareVitalsPanel() {
  const currentTps = useSwarmStore((state) => state.currentTps);
  const tpsHistory = useSwarmStore((state) => state.tpsHistory);
  const clusterInfo = useSwarmStore((state) => state.clusterInfo);
  const quarantinedAgents = useSwarmStore((state) => state.quarantinedAgents);
  const aegisAlerts = useSwarmStore((state) => state.aegisAlerts);

  const vitals = useHardwareVitals();

  // Dynamic memory & CPU calculations
  const cpuUsage = vitals?.cpu_percent ?? 0;
  const processRssMb = vitals?.ram_mb ?? (clusterInfo ? Math.round(clusterInfo.wal_bytes / (1024 * 1024 * 2)) : 124);
  const totalRamGb = (vitals as any)?.total_ram_gb ?? 24.0;

  const walBytes = clusterInfo?.wal_bytes ?? 0;
  const walMb = (walBytes / (1024 * 1024)).toFixed(1);

  const totalQuarantined = quarantinedAgents.length + aegisAlerts.length;
  const isAllSecure = totalQuarantined === 0;

  // Build SVG sparkline path from last 30 data points of TPS history
  const sparklineData = useMemo(() => {
    const points = tpsHistory.slice(-30);
    if (points.length < 2) return '';

    const width = 280;
    const height = 32;
    const maxTps = Math.max(...points.map((p) => p.tps), 10);
    const minTps = 0;

    const coords = points.map((pt, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - ((pt.tps - minTps) / (maxTps - minTps)) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return coords.join(' ');
  }, [tpsHistory]);

  const peakTps = Math.max(...tpsHistory.map((p) => p.tps), 0);

  return (
    <div className="flex flex-col gap-3 w-full h-full select-none">
      {/* ── 1. Ingress Velocity Card (Rolling 1s + Sparkline) ── */}
      <div className="bg-[#090D16] border border-[#1E293B] rounded-lg p-3.5 flex flex-col justify-between shrink-0 shadow-sm">
        <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5">
          <span className="font-mono text-cyan-400 flex items-center gap-1 font-bold text-xs">
            <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
            <span>INGRESS VELOCITY</span>
          </span>
          <span className="font-mono text-[10px] text-slate-500">ROLLING 1S</span>
        </div>

        <div className="flex items-baseline justify-between my-1">
          <div className="text-2xl font-mono text-amber-400 font-bold tracking-tight">
            {currentTps.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })}{' '}
            <span className="text-xs text-slate-500 font-normal">TPS</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            PEAK: <strong className="text-amber-300">{peakTps.toFixed(0)}</strong> TPS
          </span>
        </div>

        {/* Dynamic SVG Sparkline */}
        <div className="h-8 mt-1 w-full bg-slate-950/60 border border-slate-800/80 rounded-xs p-1 flex items-center justify-center overflow-hidden">
          {sparklineData ? (
            <svg viewBox="0 0 280 32" className="w-full h-full preserve-3d">
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={sparklineData}
              />
            </svg>
          ) : (
            <span className="font-mono text-[9px] text-slate-600 tracking-widest">[ AWAITING INGRESS FRAMES ]</span>
          )}
        </div>
      </div>

      {/* ── 2. 2x2 Grid for Health & Footprint Metrics ── */}
      <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
        {/* CPU Card */}
        <div className="bg-[#090D16] border border-[#1E293B] rounded-lg p-3 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <Cpu className="w-3 h-3 text-cyan-400" />
              <span>CPU USAGE</span>
            </span>
          </div>

          <div className="text-lg font-mono text-cyan-300 font-bold my-1">
            {cpuUsage.toFixed(1)}%
          </div>

          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-cyan-400 h-full transition-all duration-300 shadow-[0_0_6px_#22d3ee]"
              style={{ width: `${Math.min(cpuUsage, 100)}%` }}
            />
          </div>
        </div>

        {/* Memory RSS Card */}
        <div className="bg-[#090D16] border border-[#1E293B] rounded-lg p-3 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <Activity className="w-3 h-3 text-indigo-400" />
              <span>PROCESS RSS</span>
            </span>
          </div>

          <div className="text-lg font-mono text-indigo-300 font-bold my-1">
            {processRssMb.toFixed(0)} <span className="text-xs font-normal text-slate-400">MB</span>
          </div>

          <span className="text-[9px] text-slate-500 font-mono truncate">
            HOST: <strong className="text-slate-300">{totalRamGb.toFixed(0)} GB</strong>
          </span>
        </div>

        {/* WAL NVMe Footprint Card */}
        <div className="bg-[#090D16] border border-[#1E293B] rounded-lg p-3 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-emerald-400" />
              <span>WAL FOOTPRINT</span>
            </span>
          </div>

          <div className="text-lg font-mono text-emerald-400 font-bold my-1">
            {walMb} <span className="text-xs font-normal text-slate-400">MB</span>
          </div>

          <span className="text-[9px] text-emerald-500 font-mono font-medium">
            NVMe DIRECT SYNC
          </span>
        </div>

        {/* Aegis Perimeter Status Card */}
        <div className="bg-[#090D16] border border-[#1E293B] rounded-lg p-3 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <Shield className="w-3 h-3 text-cyan-400" />
              <span>AEGIS STATUS</span>
            </span>
          </div>

          <div className="my-1 flex items-center gap-1.5 font-mono text-xs font-bold">
            {isAllSecure ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                <span>ALL SECURE</span>
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span>INTERDICTIONS</span>
              </span>
            )}
          </div>

          <span className="text-[9px] text-slate-500 font-mono">
            {totalQuarantined} INTERDICTIONS
          </span>
        </div>
      </div>
    </div>
  );
}
