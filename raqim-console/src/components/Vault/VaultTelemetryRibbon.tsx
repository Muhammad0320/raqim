'use client';

import React from 'react';
import { VaultTelemetry } from '../../lib/api';
import { Database, HardDrive, Zap, Layers } from 'lucide-react';

interface VaultTelemetryRibbonProps {
  telemetry: VaultTelemetry | null;
}

export function VaultTelemetryRibbon({ telemetry }: VaultTelemetryRibbonProps) {
  const totalVectors = telemetry?.total_vectors ?? 0;
  const indexSizeMb = telemetry?.index_size_mb ?? 0;
  const walPending = telemetry?.wal_pending_count ?? 0;
  const densestNamespace = telemetry?.densest_namespace ?? '/rqm_finance/ledger (48.2%)';

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full shrink-0">
      {/* 1. Total Indexed Vectors */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-sm p-3 flex flex-col justify-between relative overflow-hidden group hover:border-cyan-800/80 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <div className="flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider font-semibold">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Indexed Vectors</span>
          </div>
          <span className="font-mono text-[10px] text-cyan-400/80">EMBEDDINGS</span>
        </div>

        <div className="my-1">
          <span className="font-mono text-xl font-bold text-cyan-400 tracking-tight">
            {totalVectors.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 font-mono text-[10px] text-slate-400">
          <span>FASTEMBED BGE-SMALL</span>
          <span className="text-cyan-300">384-DIM</span>
        </div>
      </div>

      {/* 2. Cold Storage Footprint */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-sm p-3 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-800/80 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <div className="flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider font-semibold">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cold Storage Size</span>
          </div>
          <span className="font-mono text-[10px] text-emerald-400/80">PARQUET</span>
        </div>

        <div className="my-1 flex items-baseline justify-between">
          <span className="font-mono text-xl font-bold text-emerald-400 tracking-tight">
            {indexSizeMb.toFixed(2)} MB
          </span>
          <span className="px-1.5 py-0.5 rounded-xs bg-slate-950 border border-emerald-800/60 font-mono text-[9px] text-emerald-300">
            LANCEDB
          </span>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 font-mono text-[10px] text-slate-400">
          <span>ON-DISK SEGMENTS</span>
          <span className="text-emerald-300">OPTIMIZED</span>
        </div>
      </div>

      {/* 3. Pending Hot Buffer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-sm p-3 flex flex-col justify-between relative overflow-hidden group hover:border-amber-800/80 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <div className="flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider font-semibold">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Hot WAL Buffer</span>
          </div>
          <span className="font-mono text-[10px] text-amber-400/80">IN-MEMORY</span>
        </div>

        <div className="my-1">
          <span className="font-mono text-xl font-bold text-amber-400 tracking-tight">
            {walPending.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 font-mono text-[10px] text-slate-400">
          <span>UNCOMPACTED FRAMES</span>
          <span className={walPending > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
            {walPending > 0 ? 'SYNCING TO DISK' : 'CLEAN'}
          </span>
        </div>
      </div>

      {/* 4. Densest Namespace */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-sm p-3 flex flex-col justify-between relative overflow-hidden group hover:border-purple-800/80 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <div className="flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider font-semibold">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Densest Partition</span>
          </div>
          <span className="font-mono text-[10px] text-purple-400/80">CONCENTRATION</span>
        </div>

        <div className="my-1">
          <span className="font-mono text-sm font-bold text-purple-300 tracking-tight truncate block" title={densestNamespace}>
            {densestNamespace}
          </span>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 font-mono text-[10px] text-slate-400">
          <span>ACTIVE INDEX REGION</span>
          <span className="text-purple-300">SHARD #0</span>
        </div>
      </div>
    </section>
  );
}
