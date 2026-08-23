'use client';

import React, { useState } from 'react';
import { useSwarmStore, formatTxIdHex } from '../../lib/store/useSwarmStore';
import { Activity, Copy, Check, Pause, Play, Server, Radio } from 'lucide-react';

export function GlobalStatusBar() {
  const daemonOnline = useSwarmStore((state) => state.daemonOnline);
  const currentTps = useSwarmStore((state) => state.currentTps);
  const latestTxIdHex = useSwarmStore((state) => state.latestTxIdHex);
  const highestTxId = useSwarmStore((state) => state.highestTxId);
  const clusterInfo = useSwarmStore((state) => state.clusterInfo);
  const isPaused = useSwarmStore((state) => state.isPaused);
  const togglePause = useSwarmStore((state) => state.togglePause);
  const setIsPaused = useSwarmStore((state) => state.setIsPaused);

  const [copiedTx, setCopiedTx] = useState(false);
  const [copiedNode, setCopiedNode] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const displayTxHex =
    latestTxIdHex && latestTxIdHex !== '0x00000000000000000000000000000000'
      ? latestTxIdHex
      : highestTxId > 0
      ? formatTxIdHex(highestTxId)
      : '0x00000000000000000000000000000000';

  const rawNodeId = clusterInfo?.node_id || 'LOCAL-DAEMON';
  const truncatedNodeId = rawNodeId.length > 14 ? `${rawNodeId.slice(0, 12)}...` : rawNodeId;

  const handleCopyTx = () => {
    if (!displayTxHex) return;
    navigator.clipboard.writeText(displayTxHex);
    setCopiedTx(true);
    setTimeout(() => setCopiedTx(false), 2000);
  };

  const handleCopyNode = () => {
    navigator.clipboard.writeText(rawNodeId);
    setCopiedNode(true);
    setTimeout(() => setCopiedNode(false), 2000);
  };

  const handleToggleIngress = async () => {
    setIsToggling(true);
    try {
      const res = await fetch('http://127.0.0.1:8081/v1/admin/ingress/toggle', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.is_ingress_paused === 'boolean') {
          setIsPaused(data.is_ingress_paused);
          setIsToggling(false);
          return;
        }
      }
    } catch {
      // Local fallback if daemon endpoint is missing
    }
    togglePause();
    setIsToggling(false);
  };

  return (
    <header className="w-full bg-[#080C14] border-b border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 select-none">
      {/* Left: Connectivity Beacon & Node ID */}
      <div className="flex items-center gap-3">
        {/* Daemon Beacon */}
        <div
          className={`flex items-center gap-2 px-2.5 py-1 rounded-sm border font-mono text-[11px] uppercase tracking-wider font-semibold transition-all ${
            daemonOnline
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
              : 'bg-rose-950/60 border-rose-500/60 text-rose-400 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.25)]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              daemonOnline
                ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse'
                : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
            }`}
          />
          {daemonOnline ? (
            <span>● DAEMON ONLINE [127.0.0.1:8081]</span>
          ) : (
            <span>🔴 DAEMON DISCONNECTED — AWAITING 127.0.0.1:8081</span>
          )}
        </div>

        {/* Node ID Badge */}
        <button
          onClick={handleCopyNode}
          title={`Node ID: ${rawNodeId} (Click to copy)`}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors font-mono text-[11px]"
        >
          <Server className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 font-sans text-[10px] uppercase tracking-wider">NODE:</span>
          <span className="text-cyan-400 font-bold">{truncatedNodeId}</span>
          {copiedNode ? (
            <Check className="w-3 h-3 text-emerald-400 ml-0.5" />
          ) : (
            <Copy className="w-3 h-3 text-slate-400 opacity-60 hover:opacity-100 ml-0.5" />
          )}
        </button>
      </div>

      {/* Center/Right: Velocity Meter, Latest TxID, Pause Lever */}
      <div className="flex items-center gap-3">
        {/* Velocity Meter */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-slate-900/90 border border-slate-800 font-mono text-[11px]">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-slate-400 font-sans text-[10px] uppercase tracking-wider">VELOCITY:</span>
          <span className="text-white font-bold tracking-tight">
            {currentTps.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })}
          </span>
          <span className="text-cyan-400 text-[10px]">TPS</span>
        </div>

        {/* Latest TxID Beacon */}
        <button
          onClick={handleCopyTx}
          title={`Latest Committed Transaction UUIDv7: ${displayTxHex} (Click to copy)`}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 text-slate-300 transition-colors font-mono text-[11px] group"
        >
          <Radio className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400 font-sans text-[10px] uppercase tracking-wider">LATEST TX:</span>
          <span className="text-cyan-400 font-bold group-hover:text-cyan-300">
            {displayTxHex.length > 18
              ? `${displayTxHex.slice(0, 8)}...${displayTxHex.slice(-6)}`
              : displayTxHex}
          </span>
          {copiedTx ? (
            <Check className="w-3 h-3 text-emerald-400 ml-0.5" />
          ) : (
            <Copy className="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100 ml-0.5" />
          )}
        </button>

        {/* Ingress Pause/Resume Lever */}
        <button
          onClick={handleToggleIngress}
          disabled={isToggling}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-sm border font-mono text-[11px] uppercase tracking-wider font-bold transition-all cursor-pointer ${
            isPaused
              ? 'bg-amber-950/70 border-amber-500/80 text-amber-300 hover:bg-amber-900/80 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
              : 'bg-slate-900 hover:bg-slate-800/80 border-cyan-500/40 text-cyan-300 hover:text-white'
          }`}
        >
          {isPaused ? (
            <>
              <Play className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>RESUME INGRESS</span>
            </>
          ) : (
            <>
              <Pause className="w-3 h-3 text-cyan-400" />
              <span>PAUSE INGRESS</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
