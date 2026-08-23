'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSwarmStore, formatTxIdHex } from '../../lib/store/useSwarmStore';
import { Database, Bot, Layers, Radio, ArrowUpRight, Copy, Check } from 'lucide-react';

interface MetricCardsGridProps {
  initialCards?: {
    global_transactions: number;
    active_agents: number;
    vault_capacity: number;
    cold_count?: number;
    hot_wal_count?: number;
    embedder_dims?: number;
    embedder_model?: string;
  } | null;
  initialVaultTelemetry?: {
    total_vectors: number;
    index_size_mb: number;
    wal_pending_count: number;
    densest_namespace: string;
  } | null;
}

export function MetricCardsGrid({
  initialCards,
  initialVaultTelemetry,
}: MetricCardsGridProps) {
  const storeDashboardCards = useSwarmStore((state) => state.dashboardCards);
  const storeVaultTelemetry = useSwarmStore((state) => state.vaultTelemetry);
  const agentLastSeen = useSwarmStore((state) => state.agentLastSeen);
  const latestTxIdHex = useSwarmStore((state) => state.latestTxIdHex);
  const highestTxId = useSwarmStore((state) => state.highestTxId);

  const [copiedTx, setCopiedTx] = useState(false);

  // Reconcile live store values with server pre-rendered values
  const cards = storeDashboardCards || initialCards;
  const vault = storeVaultTelemetry || initialVaultTelemetry;

  const coldCount = vault?.total_vectors ?? cards?.vault_capacity ?? 0;
  const hotCount = vault?.wal_pending_count ?? 0;

  // Accurate lifetime ingestion: strictly from backend data (or fallback to highestTxId)
  const lifetimeVolume =
    (cards?.global_transactions ?? 0) > 0
      ? cards!.global_transactions
      : Math.max(highestTxId, coldCount + hotCount);

  const activeAgentsCount = Math.max(
    cards?.active_agents ?? 0,
    Object.keys(agentLastSeen).length
  );

  const indexSizeMb = vault?.index_size_mb ?? (coldCount > 0 ? (coldCount * 0.0015).toFixed(1) : '0.0');
  const embedderDims = (cards as any)?.embedder_dims || 384;
  const embedderModel = (cards as any)?.embedder_model || 'FastEmbed BGE-Small';

  const displayTxHex =
    latestTxIdHex && latestTxIdHex !== '0x00000000000000000000000000000000'
      ? latestTxIdHex
      : highestTxId > 0
      ? formatTxIdHex(highestTxId)
      : '0x00000000000000000000000000000000';

  const handleCopyTx = () => {
    if (!displayTxHex) return;
    navigator.clipboard.writeText(displayTxHex);
    setCopiedTx(true);
    setTimeout(() => setCopiedTx(false), 2000);
  };

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full shrink-0 select-none">
      {/* CARD 1: Lifetime Ingestion Volume */}
      <div className="bg-[#090D16] border border-[#1E293B] rounded-lg p-3 flex flex-col justify-between relative overflow-hidden group hover:border-slate-700 transition-colors shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <div className="flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider font-semibold">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Lifetime Ingestion</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500">TOTAL TX</span>
        </div>

        <div className="my-1">
          <span className="font-mono text-2xl font-bold text-cyan-400 tracking-tight">
            {lifetimeVolume.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-2 pt-1.5 border-t border-slate-800/80 font-mono text-[10px] text-slate-400 truncate">
          <span className="text-cyan-400/90 font-medium">
            [COLD: {coldCount.toLocaleString()}]
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400/90 font-medium">
            [HOT: {hotCount.toLocaleString()}]
          </span>
        </div>
      </div>

      {/* CARD 2: Active Swarm Agents */}
      <div className="bg-[#090D16] border border-[#1E293B] rounded-lg p-3 flex flex-col justify-between relative overflow-hidden group hover:border-slate-700 transition-colors shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <div className="flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider font-semibold">
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
            <span>Active Enclaves</span>
          </div>
          <span className="font-mono text-[10px] text-emerald-400/80">60S WINDOW</span>
        </div>

        <div className="my-1 flex items-baseline justify-between">
          <span className="font-mono text-2xl font-bold text-white tracking-tight">
            {activeAgentsCount.toLocaleString()}
          </span>
          <span className="font-mono text-xs text-slate-500">CONCURRENT</span>
        </div>

        <div className="pt-1.5 border-t border-slate-800/80 font-mono text-[10px]">
          <Link
            href="/topology"
            className="text-emerald-400 hover:text-emerald-300 flex items-center justify-between group-hover:underline transition-colors"
          >
            <span>[Inspect Topology -&gt;]</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* CARD 3: Memory Vector Vault Capacity */}
      <div className="bg-[#090D16] border border-[#1E293B] rounded-lg p-3 flex flex-col justify-between relative overflow-hidden group hover:border-slate-700 transition-colors shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <div className="flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider font-semibold">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Vault Vectors</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500">LANCEDB</span>
        </div>

        <div className="my-1">
          <div className="font-mono text-2xl font-bold text-white tracking-tight flex items-baseline gap-1.5">
            <span>{coldCount.toLocaleString()}</span>
            <span className="text-xs font-normal text-slate-400">
              | {typeof indexSizeMb === 'number' ? indexSizeMb.toFixed(1) : indexSizeMb} MB
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 font-mono text-[10px] text-indigo-300/80 truncate">
          <span>{embedderModel} ({embedderDims}-dim)</span>
        </div>
      </div>

      {/* CARD 4: Latest Committed Transaction ID */}
      <div className="bg-[#090D16] border border-[#1E293B] rounded-lg p-3 flex flex-col justify-between relative overflow-hidden group hover:border-slate-700 transition-colors shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <div className="flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider font-semibold">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>Latest Tx Beacon</span>
          </div>
          <span className="font-mono text-[10px] text-cyan-400/80">UUIDv7</span>
        </div>

        <div className="my-1 flex items-center justify-between">
          <span className="font-mono text-sm font-bold text-cyan-300 truncate" title={displayTxHex}>
            {displayTxHex.length > 20
              ? `${displayTxHex.slice(0, 10)}...${displayTxHex.slice(-8)}`
              : displayTxHex}
          </span>
          <button
            onClick={handleCopyTx}
            title="Copy TxID"
            className="p-1 rounded-xs bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-white transition-colors"
          >
            {copiedTx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 font-mono text-[10px] text-slate-500">
          <span>MERKLE ANCHOR</span>
          <span className="text-cyan-400/80 font-mono text-[9px]">O(1) LORO CRDT</span>
        </div>
      </div>
    </section>
  );
}
