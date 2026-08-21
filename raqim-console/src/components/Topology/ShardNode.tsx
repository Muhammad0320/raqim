'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Database, Layers, Activity, ChevronRight } from 'lucide-react';

export const ShardNode = memo(function ShardNode({ data, selected }: NodeProps) {
  const namespace = (data?.namespace as string) || (data?.label as string) || '/unnamed_shard';
  const timelines = (data?.active_timelines as number) || 0;
  const operations = (data?.total_crdt_operations as number) ?? (data?.total_crdt_operation as number) ?? 0;

  return (
    <div
      className={`w-64 bg-[#090E1A] border rounded-sm p-3 shadow-xl select-none cursor-pointer transition-all duration-200 group ${
        selected
          ? 'border-emerald-400 ring-2 ring-emerald-400/30 shadow-[0_0_25px_rgba(16,185,129,0.3)]'
          : 'border-slate-800 hover:border-slate-700 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]'
      }`}
    >
      {/* Cardinal Handles */}
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-emerald-400 !border-slate-900" />
      <Handle type="source" position={Position.Top} className="!w-2 !h-2 !bg-emerald-400 !border-slate-900" />
      <Handle type="target" position={Position.Bottom} className="!w-2 !h-2 !bg-emerald-400 !border-slate-900" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-emerald-400 !border-slate-900" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-emerald-400 !border-slate-900" />
      <Handle type="source" position={Position.Left} className="!w-2 !h-2 !bg-emerald-400 !border-slate-900" />
      <Handle type="target" position={Position.Right} className="!w-2 !h-2 !bg-emerald-400 !border-slate-900" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-emerald-400 !border-slate-900" />

      {/* Header */}
      <div className="flex items-center justify-between gap-1 pb-2 border-b border-slate-800/80 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-mono text-xs font-bold text-emerald-400 truncate" title={namespace}>
            {namespace}
          </span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors shrink-0" />
      </div>

      {/* Body: Timelines and CRDT Operations */}
      <div className="grid grid-cols-2 gap-2 my-2 font-mono text-[10px]">
        <div className="bg-slate-950/80 p-1.5 rounded-xs border border-slate-800 flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-cyan-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-white font-bold">{timelines}</span>
            <span className="text-slate-400 text-[8px] uppercase">TIMELINES</span>
          </div>
        </div>

        <div className="bg-slate-950/80 p-1.5 rounded-xs border border-slate-800 flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-purple-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-white font-bold">{operations.toLocaleString()}</span>
            <span className="text-slate-400 text-[8px] uppercase">CRDT OPS</span>
          </div>
        </div>
      </div>

      {/* Status Pill */}
      <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between font-mono text-[9px]">
        <span className="text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
          <span>IN-MEMORY CRDT</span>
        </span>
        <span className="text-slate-400 uppercase tracking-widest text-[8px]">
          CLICK TO INSPECT
        </span>
      </div>
    </div>
  );
});
