'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Server, Activity } from 'lucide-react';

export const KernelNode = memo(function KernelNode({ data }: NodeProps) {
  const nodeId = (data?.nodeId as string) || 'RAQIM-CORE';
  const truncatedId = nodeId.length > 12 ? `${nodeId.slice(0, 10)}...` : nodeId;
  const bufferLoad = (data?.bufferLoad as number) ?? 0;

  return (
    <div className="relative group select-none">
      {/* Handles for all 4 cardinal directions */}
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-cyan-400 !border-slate-900" />
      <Handle type="source" position={Position.Top} className="!w-2 !h-2 !bg-cyan-400 !border-slate-900" />
      <Handle type="target" position={Position.Bottom} className="!w-2 !h-2 !bg-cyan-400 !border-slate-900" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-cyan-400 !border-slate-900" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-cyan-400 !border-slate-900" />
      <Handle type="source" position={Position.Left} className="!w-2 !h-2 !bg-cyan-400 !border-slate-900" />
      <Handle type="target" position={Position.Right} className="!w-2 !h-2 !bg-cyan-400 !border-slate-900" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-cyan-400 !border-slate-900" />

      {/* Hexagonal / Circular Core Card */}
      <div className="w-36 h-36 rounded-full bg-[#050914] border-2 border-cyan-400 shadow-[0_0_30px_rgba(0,243,255,0.35)] flex flex-col items-center justify-center p-3 text-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_40px_rgba(0,243,255,0.5)]">
        {/* Pulsing ring animation */}
        <div className="absolute inset-0 rounded-full border border-cyan-400/40 animate-ping pointer-events-none opacity-20" />
        
        <Server className="w-5 h-5 text-cyan-400 mb-1" />
        <span className="font-mono text-[10px] font-black text-white uppercase tracking-widest leading-tight">
          RAQIM CORE
        </span>
        <span className="font-mono text-[8px] text-cyan-300 font-bold tracking-wider uppercase mb-1">
          KERNEL APEX
        </span>
        
        <div className="px-2 py-0.5 rounded-xs bg-slate-900/90 border border-slate-700 text-cyan-400 font-mono text-[9px] font-bold truncate max-w-[110px]">
          {truncatedId}
        </div>

        <div className="flex items-center gap-1 mt-1 text-[8px] font-mono text-slate-400">
          <Activity className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
          <span>BUFFER: {bufferLoad}</span>
        </div>
      </div>
    </div>
  );
});
