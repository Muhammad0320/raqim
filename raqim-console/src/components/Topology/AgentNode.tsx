'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Bot, ShieldAlert, Zap } from 'lucide-react';

const getAgentColor = (hex: string) => {
  let hash = 0;
  for (let i = 0; i < hex.length; i++) {
    hash = hex.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    'border-cyan-500/70 bg-cyan-950/80 text-cyan-300',
    'border-emerald-500/70 bg-emerald-950/80 text-emerald-300',
    'border-indigo-500/70 bg-indigo-950/80 text-indigo-300',
    'border-purple-500/70 bg-purple-950/80 text-purple-300',
    'border-amber-500/70 bg-amber-950/80 text-amber-300',
    'border-sky-500/70 bg-sky-950/80 text-sky-300',
  ];
  return colors[Math.abs(hash) % colors.length];
};

export const AgentNode = memo(function AgentNode({ data, selected }: NodeProps) {
  const agentHex = (data?.agent_hex as string) || (data?.agentId as string) || '0xUNKNOWN';
  const alias = (data?.alias as string) || `agent_${agentHex.slice(0, 6)}`;
  const truncatedHex = agentHex.length > 10 ? `${agentHex.slice(0, 6)}...${agentHex.slice(-4)}` : agentHex;
  const isQuarantined = Boolean(data?.isQuarantined);
  const isPulsing = Boolean(data?.pulseTimestamp);

  const status = isQuarantined
    ? 'Quarantined'
    : isPulsing
    ? 'Active'
    : 'Idle';

  const badgeTheme = getAgentColor(agentHex);

  return (
    <div
      className={`w-44 bg-[#070B14] border rounded-sm p-2.5 shadow-lg select-none transition-all duration-200 ${
        isQuarantined
          ? 'border-rose-600/80 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
          : selected
          ? 'border-cyan-400 ring-2 ring-cyan-400/30'
          : isPulsing
          ? 'border-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.4)] animate-pulse'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Cardinal Handles */}
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-cyan-400 !border-slate-900" />
      <Handle type="source" position={Position.Top} className="!w-2 !h-2 !bg-cyan-400 !border-slate-900" />
      <Handle type="target" position={Position.Bottom} className="!w-2 !h-2 !bg-cyan-400 !border-slate-900" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-cyan-400 !border-slate-900" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-cyan-400 !border-slate-900" />
      <Handle type="source" position={Position.Left} className="!w-2 !h-2 !bg-cyan-400 !border-slate-900" />
      <Handle type="target" position={Position.Right} className="!w-2 !h-2 !bg-cyan-400 !border-slate-900" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-cyan-400 !border-slate-900" />

      {/* Agent Header */}
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {isQuarantined ? (
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          ) : (
            <Bot className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          )}
          <span
            className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-xs border truncate max-w-[100px] ${badgeTheme}`}
            title={alias}
          >
            [{alias}]
          </span>
        </div>

        {/* Live Pulse Indicator */}
        {isPulsing && <Zap className="w-3 h-3 text-cyan-400 animate-bounce shrink-0" />}
      </div>

      {/* Identity Hex */}
      <div className="font-mono text-[9px] text-slate-400 truncate mb-1.5" title={agentHex}>
        ID: <span className="text-slate-300 font-semibold">{truncatedHex}</span>
      </div>

      {/* Status Pill */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 font-mono text-[9px]">
        <span
          className={`flex items-center gap-1 font-semibold ${
            isQuarantined
              ? 'text-rose-400'
              : status === 'Active'
              ? 'text-emerald-400'
              : 'text-slate-400'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isQuarantined
                ? 'bg-rose-500'
                : status === 'Active'
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-slate-400'
            }`}
          />
          <span>{status}</span>
        </span>
        <span className="text-slate-400 text-[8px]">ENCLAVE</span>
      </div>
    </div>
  );
});
