'use client';

import React from 'react';
import { AegisMetricsData } from '../../lib/api';
import { ShieldAlert, Flame, KeyRound, Lock } from 'lucide-react';

interface AegisMetricsRibbonProps {
  metrics: AegisMetricsData | null;
  activeQuarantinedCount: number;
}

export function AegisMetricsRibbon({
  metrics,
  activeQuarantinedCount,
}: AegisMetricsRibbonProps) {
  const totalQuarantined = metrics?.total_quarantined ?? activeQuarantinedCount;
  const recentInterdictions = metrics?.recent_interdictions ?? 0;
  const signatureSpoofs = metrics?.signarure_spoofs ?? metrics?.signature_spoofs ?? 0;
  const namespaceBreaches = metrics?.namespace_breaches ?? 0;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full shrink-0">
      {/* 1. Active Quarantined Agents */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-sm p-3 flex flex-col justify-between relative overflow-hidden group hover:border-rose-800/80 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <div className="flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider font-semibold">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span>Active Quarantined</span>
          </div>
          <span className="font-mono text-[10px] text-rose-400/80">PERIMETER JAIL</span>
        </div>

        <div className="my-1">
          <span className="font-mono text-xl font-bold text-rose-500 tracking-tight">
            {totalQuarantined.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 font-mono text-[10px] text-slate-400">
          <span>ISOLATED ENCLAVES</span>
          <span className={totalQuarantined > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
            {totalQuarantined > 0 ? 'EVICTION REQUIRED' : 'ZERO BLOCKS'}
          </span>
        </div>
      </div>

      {/* 2. Recent Interdictions (10m) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-sm p-3 flex flex-col justify-between relative overflow-hidden group hover:border-amber-800/80 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <div className="flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider font-semibold">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Recent Interdictions</span>
          </div>
          <span className="font-mono text-[10px] text-amber-400/80">10-MIN TALLY</span>
        </div>

        <div className="my-1">
          <span className="font-mono text-xl font-bold text-amber-400 tracking-tight">
            {recentInterdictions.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 font-mono text-[10px] text-slate-400">
          <span>THREAT FREQUENCY</span>
          <span className="text-amber-400/80">KERNEL DROPS</span>
        </div>
      </div>

      {/* 3. Signature Spoof Blocks */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-sm p-3 flex flex-col justify-between relative overflow-hidden group hover:border-purple-800/80 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <div className="flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider font-semibold">
            <KeyRound className="w-3.5 h-3.5 text-purple-400" />
            <span>Signature Spoofs</span>
          </div>
          <span className="font-mono text-[10px] text-purple-400/80">ED25519 VERIFY</span>
        </div>

        <div className="my-1">
          <span className="font-mono text-xl font-bold text-purple-400 tracking-tight">
            {signatureSpoofs.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 font-mono text-[10px] text-slate-400">
          <span>FORGED PASSPORTS</span>
          <span className="text-purple-300">INTERCEPTED</span>
        </div>
      </div>

      {/* 4. Namespace Access Breaches */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-sm p-3 flex flex-col justify-between relative overflow-hidden group hover:border-cyan-800/80 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <div className="flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider font-semibold">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Namespace Breaches</span>
          </div>
          <span className="font-mono text-[10px] text-cyan-400/80">BOUNDARY ACL</span>
        </div>

        <div className="my-1">
          <span className="font-mono text-xl font-bold text-cyan-400 tracking-tight">
            {namespaceBreaches.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 font-mono text-[10px] text-slate-400">
          <span>UNAUTHORIZED DOMAINS</span>
          <span className="text-cyan-300">ENFORCED</span>
        </div>
      </div>
    </section>
  );
}
