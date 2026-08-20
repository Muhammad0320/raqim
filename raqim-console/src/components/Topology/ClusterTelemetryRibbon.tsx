'use client';

import React, { useState } from 'react';
import { ClusterInfoData, ClusterShard } from '../../lib/api';
import { Server, Database, Activity, Layers, Copy, Check } from 'lucide-react';

interface ClusterTelemetryRibbonProps {
  clusterInfo: ClusterInfoData | null;
  shards: ClusterShard[];
  totalActiveAgents: number;
}

export function ClusterTelemetryRibbon({
  clusterInfo,
  shards,
  totalActiveAgents,
}: ClusterTelemetryRibbonProps) {
  const [copiedNode, setCopiedNode] = useState(false);

  const rawNodeId = clusterInfo?.node_id || 'LOCAL-DAEMON';
  const truncatedNodeId = rawNodeId.length > 14 ? `${rawNodeId.slice(0, 12)}...` : rawNodeId;

  // Calculate cumulative CRDT ops and active timelines
  const totalCrdtOps = shards.reduce((acc, s) => {
    const ops = s.total_crdt_operations ?? s.total_crdt_operation ?? 0;
    return acc + ops;
  }, 0);

  const totalTimelines = shards.reduce((acc, s) => acc + (s.active_timelines || 0), 0);

  const handleCopyNode = () => {
    navigator.clipboard.writeText(rawNodeId);
    setCopiedNode(true);
    setTimeout(() => setCopiedNode(false), 2000);
  };

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full shrink-0">
      {/* 1. Cluster Node ID */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-sm p-3 flex flex-col justify-between relative overflow-hidden group hover:border-cyan-800/80 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <div className="flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider font-semibold">
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sovereign Node ID</span>
          </div>
          <span className="font-mono text-[10px] text-cyan-400/80">CORE APEX</span>
        </div>

        <div className="my-1 flex items-center justify-between">
          <span className="font-mono text-sm font-bold text-cyan-400 tracking-tight truncate">
            {truncatedNodeId}
          </span>
          <button
            onClick={handleCopyNode}
            title={`Copy full Node ID: ${rawNodeId}`}
            className="p-1 text-slate-400 hover:text-white rounded-xs hover:bg-slate-800 transition-colors"
          >
            {copiedNode ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 font-mono text-[10px] text-slate-400">
          <span>WAL BUFFER: {clusterInfo?.buffer_load ?? 0}</span>
          <span className="text-emerald-400 font-medium">LIVE PEER</span>
        </div>
      </div>

      {/* 2. Allocated CRDT Shards */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-sm p-3 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-800/80 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <div className="flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider font-semibold">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Allocated Shards</span>
          </div>
          <span className="font-mono text-[10px] text-emerald-400/80">LORO CRDT</span>
        </div>

        <div className="my-1">
          <span className="font-mono text-xl font-bold text-emerald-400 tracking-tight">
            {shards.length.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 font-mono text-[10px] text-slate-400">
          <span>NAMESPACES IN RAM</span>
          <span className="text-emerald-300">ACTIVE</span>
        </div>
      </div>

      {/* 3. Cumulative CRDT Operations */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-sm p-3 flex flex-col justify-between relative overflow-hidden group hover:border-purple-800/80 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <div className="flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider font-semibold">
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            <span>Cumulative CRDT Ops</span>
          </div>
          <span className="font-mono text-[10px] text-purple-400/80">STATE DELTAS</span>
        </div>

        <div className="my-1">
          <span className="font-mono text-xl font-bold text-purple-400 tracking-tight">
            {totalCrdtOps.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 font-mono text-[10px] text-slate-400">
          <span>DOC OPERATION LOG</span>
          <span className="text-purple-300">VERIFIED</span>
        </div>
      </div>

      {/* 4. Active Peer Timelines */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-sm p-3 flex flex-col justify-between relative overflow-hidden group hover:border-cyan-800/80 transition-colors">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <div className="flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider font-semibold">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Active Timelines</span>
          </div>
          <span className="font-mono text-[10px] text-cyan-400/80">CONCURRENT</span>
        </div>

        <div className="my-1 flex items-baseline justify-between">
          <span className="font-mono text-xl font-bold text-white tracking-tight">
            {Math.max(totalTimelines, totalActiveAgents).toLocaleString()}
          </span>
          <span className="font-mono text-xs text-slate-400">
            {totalActiveAgents} AGENTS
          </span>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 font-mono text-[10px] text-slate-400">
          <span>BRANCH TRACKING</span>
          <span className="text-cyan-300 font-medium">IN-MEMORY</span>
        </div>
      </div>
    </section>
  );
}
