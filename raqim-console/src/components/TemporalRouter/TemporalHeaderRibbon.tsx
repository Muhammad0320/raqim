'use client';

import React, { useState } from 'react';
import { formatTxIdHex } from '../../lib/api';
import {
  Bot,
  GitFork,
  Radio,
  Play,
  RotateCcw,
  Copy,
  Check,
  Zap,
} from 'lucide-react';

interface TemporalHeaderRibbonProps {
  agentAliases: Record<string, string>;
  selectedAgentHex: string;
  onSelectAgent: (hex: string) => void;
  mode: 'RECORD' | 'REPLAY' | 'FORK';
  activeTxIdHex: string | null;
  onOpenForkModal: () => void;
  onStepForward: () => void;
  onResetToHead: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export function TemporalHeaderRibbon({
  agentAliases,
  selectedAgentHex,
  onSelectAgent,
  mode,
  activeTxIdHex,
  onOpenForkModal,
  onStepForward,
  onResetToHead,
  isPlaying,
  onTogglePlay,
}: TemporalHeaderRibbonProps) {
  const [copiedTx, setCopiedTx] = useState(false);

  const rawTxHex = activeTxIdHex || '0x00000000000000000000000000000000';
  const truncatedTx = rawTxHex.length > 14 ? `${rawTxHex.slice(0, 8)}...${rawTxHex.slice(-6)}` : rawTxHex;

  const handleCopyTx = () => {
    navigator.clipboard.writeText(rawTxHex);
    setCopiedTx(true);
    setTimeout(() => setCopiedTx(false), 2000);
  };

  const agentEntries = Object.entries(agentAliases);

  return (
    <header className="bg-slate-900/90 border border-slate-800 rounded-sm p-3 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-lg select-none">
      {/* Left: Agent Picker & Status Indicator */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Agent Selector */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xs px-2.5 py-1.5">
          <Bot className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-[10px] font-sans uppercase font-bold text-slate-400">Target Agent:</span>
          <select
            value={selectedAgentHex}
            onChange={(e) => onSelectAgent(e.target.value)}
            className="bg-transparent text-xs font-mono font-bold text-cyan-300 outline-none cursor-pointer"
          >
            {agentEntries.length === 0 ? (
              <option value="096da8e8a1b2c3d4e5f60718293a4b5c">
                096da8e8... [default_agent]
              </option>
            ) : (
              agentEntries.map(([hex, alias]) => (
                <option key={hex} value={hex} className="bg-slate-950 text-white">
                  [{alias}] {hex.slice(0, 8)}...
                </option>
              ))
            )}
          </select>
        </div>

        {/* Active Mode Badge */}
        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold">
          {mode === 'RECORD' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>RECORD MODE (PRODUCTION INGRESS)</span>
            </div>
          )}
          {mode === 'REPLAY' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-amber-950/80 border border-amber-700/80 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
              <Radio className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>REPLAY MODE ($0 API COST)</span>
            </div>
          )}
          {mode === 'FORK' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-purple-950/80 border border-purple-700/80 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.25)]">
              <GitFork className="w-3.5 h-3.5 text-purple-400" />
              <span>PARALLEL UNIVERSE FORK (BRANCH ACTIVE)</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Causal TxID Pill & Quick Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Latest Causal TxID Pill */}
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xs px-2.5 py-1 font-mono text-[11px]">
          <span className="text-slate-400 text-[10px] uppercase font-sans">CAUSAL TX:</span>
          <button
            onClick={handleCopyTx}
            title={`Copy TxID: ${rawTxHex}`}
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
          >
            <span>{truncatedTx}</span>
            {copiedTx ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3 text-slate-400" />
            )}
          </button>
        </div>

        {/* Replay Controls */}
        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-0.5 rounded-xs font-mono text-xs">
          <button
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause Replay' : 'Auto-Play Replay'}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xs font-bold transition-colors ${
              isPlaying
                ? 'bg-amber-950 border border-amber-600 text-amber-300'
                : 'hover:bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Play className={`w-3 h-3 ${isPlaying ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
          </button>

          <button
            onClick={onStepForward}
            title="Step Forward (1 Ordinal)"
            className="px-2 py-1 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 rounded-xs font-bold transition-colors"
          >
            STEP &gt;
          </button>

          <button
            onClick={onResetToHead}
            title="Reset to Head Timeline"
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Fork Reality Action Lever */}
        <button
          onClick={onOpenForkModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-purple-950/80 hover:bg-purple-900 border border-purple-600/80 text-purple-200 font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(168,85,247,0.25)]"
        >
          <Zap className="w-3.5 h-3.5 text-purple-400" />
          <span>[ FORK REALITY ]</span>
        </button>
      </div>
    </header>
  );
}
