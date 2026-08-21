'use client';

import React, { useState, useMemo } from 'react';
import { useSwarmStore } from '../../lib/store/useSwarmStore';
import { Bot, Search, Copy, Check, ShieldAlert } from 'lucide-react';

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

export function AgentProcessTable() {
  const agentAliases = useSwarmStore((state) => state.agentAliases);
  const quarantinedAgents = useSwarmStore((state) => state.quarantinedAgents);
  const agentLastSeen = useSwarmStore((state) => state.agentLastSeen);
  const thoughts = useSwarmStore((state) => state.thoughts);
  const thoughtOrder = useSwarmStore((state) => state.thoughtOrder);

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Map known agents with home shard
  const agentList = useMemo(() => {
    const map = new Map<string, { hex: string; alias: string; namespace: string; lastSeen: number; txCount: number }>();

    // From aliases map
    for (const [hex, alias] of Object.entries(agentAliases)) {
      map.set(hex, {
        hex,
        alias,
        namespace: '/default',
        lastSeen: agentLastSeen[hex] || 0,
        txCount: 0,
      });
    }

    // From thoughts stream
    for (const id of thoughtOrder) {
      const t = thoughts[id];
      if (t) {
        const existing = map.get(t.agent_hex);
        if (existing) {
          existing.namespace = t.intent_path;
          existing.txCount++;
          if (t.timestamp && t.timestamp > existing.lastSeen) {
            existing.lastSeen = t.timestamp;
          }
        } else {
          map.set(t.agent_hex, {
            hex: t.agent_hex,
            alias: agentAliases[t.agent_hex] || `agent_${t.agent_hex.slice(0, 6)}`,
            namespace: t.intent_path,
            lastSeen: t.timestamp || agentLastSeen[t.agent_hex] || Date.now(),
            txCount: 1,
          });
        }
      }
    }

    return Array.from(map.values());
  }, [agentAliases, agentLastSeen, thoughts, thoughtOrder]);

  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) return agentList;
    const q = searchQuery.toLowerCase().trim();
    return agentList.filter(
      (a) =>
        a.alias.toLowerCase().includes(q) ||
        a.hex.toLowerCase().includes(q) ||
        a.namespace.toLowerCase().includes(q)
    );
  }, [agentList, searchQuery]);

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedId(hex);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-[#0D1322] border border-slate-800 rounded-sm overflow-hidden flex flex-col shadow-lg">
      {/* Header & Filter */}
      <div className="bg-[#080C14] border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <Bot className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-sans text-xs uppercase tracking-wider font-bold text-slate-300">
            Swarm Enclave Matrix &amp; CRDT Peer Processes
          </span>
          <span className="px-1.5 py-0.5 rounded-xs bg-slate-900 border border-slate-800 font-mono text-[10px] text-cyan-400">
            {agentList.length} PEERS
          </span>
        </div>

        {/* Search Box */}
        <div className="relative">
          <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter alias, hex ID, shard..."
            className="pl-6.5 pr-2 py-1 bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded-xs text-[11px] font-mono text-slate-200 placeholder:text-slate-400 outline-none w-52 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-56 overflow-y-auto bg-[#080C14]">
        <table className="w-full text-left border-collapse font-mono text-[11px]">
          <thead className="sticky top-0 z-10 bg-[#0B101B] border-b border-slate-800 text-slate-400 font-sans text-[10px] uppercase tracking-wider select-none">
            <tr>
              <th className="py-2 px-3 w-40">AGENT ALIAS</th>
              <th className="py-2 px-3 w-48">IDENTITY HEX</th>
              <th className="py-2 px-3">HOME CRDT SHARD</th>
              <th className="py-2 px-3 w-32">COMMITTED TX</th>
              <th className="py-2 px-3 w-32 text-right">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {filteredAgents.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400 text-xs font-mono uppercase">
                  {agentList.length === 0
                    ? '[ ZERO AGENT ENCLAVES DEPLOYED ]'
                    : `NO AGENTS MATCH FILTER "${searchQuery}"`}
                </td>
              </tr>
            ) : (
              filteredAgents.map((ag, index) => {
                const isQuarantined = quarantinedAgents.includes(ag.hex);
                const isLive = Date.now() - ag.lastSeen < 60000;
                const badgeColor = getAgentColor(ag.hex);

                return (
                  <tr key={ag.hex} className="hover:bg-slate-900/70 transition-colors">
                    {/* Alias */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className={`inline-block px-1.5 py-0.5 rounded-xs border text-[10px] font-bold ${badgeColor}`}>
                        [{ag.alias}]
                      </span>
                    </td>

                    {/* Identity Hex */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <button
                        onClick={() => handleCopyHex(ag.hex)}
                        title={`Copy Hex ID: ${ag.hex}`}
                        className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-bold"
                      >
                        <span>{ag.hex.slice(0, 8)}...{ag.hex.slice(-4)}</span>
                        {copiedId === ag.hex ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400" />
                        )}
                      </button>
                    </td>

                    {/* Home Shard */}
                    <td className="py-2 px-3 whitespace-nowrap text-emerald-400 font-medium">
                      {ag.namespace}
                    </td>

                    {/* Timeline Position */}
                    <td className="py-2 px-3 whitespace-nowrap text-slate-300">
                      #{index + 1} ({ag.txCount} TX)
                    </td>

                    {/* Status */}
                    <td className="py-2 px-3 whitespace-nowrap text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs border text-[9px] font-bold uppercase ${
                          isQuarantined
                            ? 'bg-rose-950/70 border-rose-700/60 text-rose-300'
                            : isLive
                            ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300'
                            : 'bg-slate-900 border-slate-700 text-slate-400'
                        }`}
                      >
                        {isQuarantined ? (
                          <>
                            <ShieldAlert className="w-2.5 h-2.5 text-rose-400" />
                            <span>Quarantined</span>
                          </>
                        ) : isLive ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                            <span>Idle</span>
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
