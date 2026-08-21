'use client';

import React, { useMemo } from 'react';
import { ClusterShard } from '../../lib/api';
import { useSwarmStore, UiThought, formatTxIdHex } from '../../lib/store/useSwarmStore';
import {
  Database,
  X,
  Layers,
  Activity,
  HardDrive,
  Bot,
  Copy,
  Check,
  Terminal,
} from 'lucide-react';

interface ShardDetailDrawerProps {
  shard: ClusterShard | null;
  onClose: () => void;
}

export function ShardDetailDrawer({ shard, onClose }: ShardDetailDrawerProps) {
  const thoughts = useSwarmStore((state) => state.thoughts);
  const thoughtOrder = useSwarmStore((state) => state.thoughtOrder);
  const agentAliases = useSwarmStore((state) => state.agentAliases);
  const quarantinedAgents = useSwarmStore((state) => state.quarantinedAgents);
  const agentLastSeen = useSwarmStore((state) => state.agentLastSeen);

  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  if (!shard) return null;

  const namespace = shard.namespace;
  const timelines = shard.active_timelines || 0;
  const operations = shard.total_crdt_operations ?? shard.total_crdt_operation ?? 0;

  // Estimated memory heap footprint: ops * ~64 bytes + timelines * 1024 bytes
  const estBytes = operations * 64 + timelines * 1024;
  const estFormatted =
    estBytes > 1024 * 1024
      ? `${(estBytes / (1024 * 1024)).toFixed(2)} MB`
      : `${(estBytes / 1024).toFixed(1)} KB`;

  // Get recent thoughts for this namespace (latest 20)
  const namespaceThoughts = useMemo(() => {
    const matched: UiThought[] = [];
    for (let i = thoughtOrder.length - 1; i >= 0 && matched.length < 20; i--) {
      const t = thoughts[thoughtOrder[i]];
      if (t && (t.intent_path === namespace || t.intent_path.startsWith(namespace))) {
        matched.push(t);
      }
    }
    return matched;
  }, [thoughts, thoughtOrder, namespace]);

  // Find all agents that have interacted with this namespace
  const attachedAgents = useMemo(() => {
    const agentHexSet = new Set<string>();
    for (let i = thoughtOrder.length - 1; i >= 0; i--) {
      const t = thoughts[thoughtOrder[i]];
      if (t && (t.intent_path === namespace || t.intent_path.startsWith(namespace))) {
        agentHexSet.add(t.agent_hex);
      }
    }

    return Array.from(agentHexSet).map((hex) => {
      const isQuarantined = quarantinedAgents.includes(hex);
      const lastSeen = agentLastSeen[hex] || 0;
      const isLive = Date.now() - lastSeen < 60000;
      const alias = agentAliases[hex] || `agent_${hex.slice(0, 6)}`;
      return {
        hex,
        alias,
        isQuarantined,
        isLive,
      };
    });
  }, [thoughts, thoughtOrder, namespace, quarantinedAgents, agentLastSeen, agentAliases]);

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedId(hex);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <aside className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-[#070B12] border-l border-slate-800 shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="bg-[#0B101B] border-b border-slate-800 p-3.5 flex items-center justify-between select-none shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Database className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-sans text-xs uppercase tracking-wider font-bold text-white truncate">
            LORO CRDT SHARD: <span className="text-emerald-400">{namespace}</span>
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-xs hover:bg-slate-800 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
        {/* Memory Metrology Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xs p-3 space-y-2.5">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-sans uppercase font-bold tracking-wider">
            <span>Memory Partition Metrology</span>
            <span className="text-emerald-400">SYNCED</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div className="bg-slate-900 p-2 rounded-xs border border-slate-800">
              <div className="flex items-center gap-1 text-slate-400 text-[9px] uppercase font-sans mb-0.5">
                <Layers className="w-2.5 h-2.5 text-cyan-400" />
                <span>Timelines</span>
              </div>
              <span className="font-bold text-white text-sm">{timelines}</span>
            </div>

            <div className="bg-slate-900 p-2 rounded-xs border border-slate-800">
              <div className="flex items-center gap-1 text-slate-400 text-[9px] uppercase font-sans mb-0.5">
                <Activity className="w-2.5 h-2.5 text-purple-400" />
                <span>CRDT Ops</span>
              </div>
              <span className="font-bold text-purple-300 text-sm">{operations.toLocaleString()}</span>
            </div>

            <div className="bg-slate-900 p-2 rounded-xs border border-slate-800">
              <div className="flex items-center gap-1 text-slate-400 text-[9px] uppercase font-sans mb-0.5">
                <HardDrive className="w-2.5 h-2.5 text-amber-400" />
                <span>Est. RAM</span>
              </div>
              <span className="font-bold text-amber-300 text-sm">{estFormatted}</span>
            </div>
          </div>
        </div>

        {/* Attached Enclave Agents */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-sans uppercase font-bold tracking-wider">
            <div className="flex items-center gap-1.5">
              <Bot className="w-3 h-3 text-cyan-400" />
              <span>Active Attached Agents ({attachedAgents.length})</span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xs overflow-hidden max-h-44 overflow-y-auto">
            {attachedAgents.length === 0 ? (
              <div className="p-3 text-center text-slate-400 text-[10px]">
                NO ACTIVE AGENTS COMMITTED IN THIS SHARD
              </div>
            ) : (
              <table className="w-full text-left text-[10px]">
                <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-sans text-[9px] uppercase">
                  <tr>
                    <th className="py-1 px-2.5">ALIAS</th>
                    <th className="py-1 px-2.5">IDENTITY</th>
                    <th className="py-1 px-2.5 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {attachedAgents.map((ag) => (
                    <tr key={ag.hex} className="hover:bg-slate-900/50">
                      <td className="py-1.5 px-2.5 font-bold text-white truncate max-w-[120px]">
                        [{ag.alias}]
                      </td>
                      <td className="py-1.5 px-2.5">
                        <button
                          onClick={() => handleCopyHex(ag.hex)}
                          className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                        >
                          <span>{ag.hex.slice(0, 6)}...</span>
                          {copiedId === ag.hex ? (
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-2.5 h-2.5 text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="py-1.5 px-2.5 text-right">
                        <span
                          className={`font-semibold ${
                            ag.isQuarantined
                              ? 'text-rose-400'
                              : ag.isLive
                              ? 'text-emerald-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {ag.isQuarantined ? 'Quarantined' : ag.isLive ? 'Active' : 'Idle'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Namespace Thoughts Feed */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-sans uppercase font-bold tracking-wider">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3 h-3 text-cyan-400" />
              <span>Recent Partition Events (Last 20)</span>
            </div>
            <span className="text-cyan-400 font-mono text-[9px]">LIVE FEED</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xs p-2 space-y-1.5 max-h-60 overflow-y-auto">
            {namespaceThoughts.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-[10px]">
                AWAITING LIVE THOUGHTS IN {namespace}...
              </div>
            ) : (
              namespaceThoughts.map((t) => {
                const txHex = t.tx_id_hex || formatTxIdHex(t.tx_id);
                return (
                  <div
                    key={t.tx_id}
                    className="p-2 bg-slate-900/60 border border-slate-800/60 rounded-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[9px] text-slate-400">
                      <span className="text-cyan-400 font-bold">
                        TX: {txHex.slice(0, 8)}...
                      </span>
                      <span className="text-slate-400">
                        {t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : ''}
                      </span>
                    </div>
                    <p className="text-slate-200 text-[10px] truncate leading-tight">
                      {t.text}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#0B101B] border-t border-slate-800 p-3 flex justify-end shrink-0">
        <button
          onClick={onClose}
          className="px-3.5 py-1.5 rounded-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-sans text-xs font-semibold transition-colors"
        >
          Close Forensic View
        </button>
      </div>
    </aside>
  );
}
