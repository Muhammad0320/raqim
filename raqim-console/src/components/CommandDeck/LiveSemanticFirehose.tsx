'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSwarmStore, UiThought, formatTxIdHex } from '../../lib/store/useSwarmStore';
import {
  Search,
  Filter,
  Trash2,
  Lock,
  Unlock,
  Copy,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Terminal,
} from 'lucide-react';

const getAgentColor = (hex: string) => {
  let hash = 0;
  for (let i = 0; i < hex.length; i++) {
    hash = hex.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    'bg-cyan-950/60 text-cyan-300 border-cyan-700/60',
    'bg-emerald-950/60 text-emerald-300 border-emerald-700/60',
    'bg-indigo-950/60 text-indigo-300 border-indigo-700/60',
    'bg-purple-950/60 text-purple-300 border-purple-700/60',
    'bg-amber-950/60 text-amber-300 border-amber-700/60',
    'bg-sky-950/60 text-sky-300 border-sky-700/60',
  ];
  return colors[Math.abs(hash) % colors.length];
};

const formatTimeWithMicros = (timestamp?: number) => {
  const date = timestamp ? new Date(timestamp) : new Date();
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
};

export function LiveSemanticFirehose() {
  const router = useRouter();
  const thoughts = useSwarmStore((state) => state.thoughts);
  const thoughtOrder = useSwarmStore((state) => state.thoughtOrder);
  const namespaces = useSwarmStore((state) => state.namespaces);
  const agentAliases = useSwarmStore((state) => state.agentAliases);
  const clearStream = useSwarmStore((state) => state.clearStream);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNamespace, setSelectedNamespace] = useState('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const [selectedThought, setSelectedThought] = useState<UiThought | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedDrawerTx, setCopiedDrawerTx] = useState(false);

  const tableBottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Convert map to sorted array
  const allThoughts = useMemo(() => {
    return thoughtOrder.map((id) => thoughts[id]).filter(Boolean);
  }, [thoughts, thoughtOrder]);

  // Filtered thoughts
  const filteredThoughts = useMemo(() => {
    let list = allThoughts;

    if (selectedNamespace !== 'ALL') {
      list = list.filter((t) => t.intent_path === selectedNamespace || t.intent_path.startsWith(selectedNamespace));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((t) => {
        const hex = t.tx_id_hex || formatTxIdHex(t.tx_id);
        const alias = (agentAliases[t.agent_hex] || '').toLowerCase();
        return (
          t.text.toLowerCase().includes(q) ||
          hex.toLowerCase().includes(q) ||
          t.agent_hex.toLowerCase().includes(q) ||
          alias.includes(q) ||
          t.intent_path.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [allThoughts, selectedNamespace, searchQuery, agentAliases]);

  // Handle auto-scrolling to bottom on new thoughts
  useEffect(() => {
    if (autoScroll && tableBottomRef.current) {
      tableBottomRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [filteredThoughts.length, autoScroll]);

  // User manually scrolls up -> disable autoscroll if scrolled up significantly
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    if (!isAtBottom && autoScroll) {
      setAutoScroll(false);
    } else if (isAtBottom && !autoScroll) {
      setAutoScroll(true);
    }
  };

  const handleCopyTx = (e: React.MouseEvent, txHex: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(txHex);
    setCopiedId(txHex);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDrawerVerifyInVault = (txIdHex: string) => {
    router.push(`/vault?tx_id=${encodeURIComponent(txIdHex)}`);
  };

  const getStatusBadge = (status: UiThought['status']) => {
    switch (status) {
      case 'REASONING':
        return 'bg-cyan-950/70 border-cyan-700/60 text-cyan-300';
      case 'TOOL_EXEC':
        return 'bg-amber-950/70 border-amber-700/60 text-amber-300';
      case 'HALTED':
      case 'REJECTED':
        return 'bg-rose-950/70 border-rose-700/60 text-rose-300';
      case 'FORKED':
        return 'bg-purple-950/70 border-purple-700/60 text-purple-300';
      case 'IDLE':
        return 'bg-slate-900 border-slate-700 text-slate-400';
      case 'COMMITTED':
      default:
        return 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300';
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0D1322] border border-slate-800 rounded-sm overflow-hidden relative shadow-lg">
      {/* ── Controls Bar ── */}
      <div className="bg-[#080C14] border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0 select-none">
        {/* Left: Section Title & Thought Count */}
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-sans text-xs uppercase tracking-wider font-bold text-slate-300">
            Semantic Firehose
          </span>
          <span className="px-1.5 py-0.5 rounded-xs bg-slate-900 border border-slate-800 font-mono text-[10px] text-cyan-400">
            {filteredThoughts.length.toLocaleString()} ROWS
          </span>
        </div>

        {/* Right: Search, Namespace, Autoscroll, Clear */}
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter text, TxID, Agent..."
              className="pl-6.5 pr-2 py-1 bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded-xs text-[11px] font-mono text-slate-200 placeholder:text-slate-400 outline-none w-48 transition-colors"
            />
          </div>

          {/* Namespace Filter */}
          <div className="relative flex items-center">
            <Filter className="w-3 h-3 text-slate-400 absolute left-2 pointer-events-none" />
            <select
              value={selectedNamespace}
              onChange={(e) => setSelectedNamespace(e.target.value)}
              className="pl-6 pr-6 py-1 bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded-xs text-[11px] font-mono text-slate-300 outline-none cursor-pointer appearance-none"
            >
              <option value="ALL">ALL NAMESPACES</option>
              {namespaces.map((ns) => (
                <option key={ns} value={ns}>
                  {ns}
                </option>
              ))}
            </select>
          </div>

          {/* Auto-Scroll Toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            title={autoScroll ? 'Auto-scroll is ON' : 'Auto-scroll is OFF'}
            className={`flex items-center gap-1 px-2 py-1 rounded-xs border font-mono text-[10px] uppercase tracking-wider font-semibold transition-colors ${
              autoScroll
                ? 'bg-cyan-950/60 border-cyan-700/60 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
            }`}
          >
            {autoScroll ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            <span>{autoScroll ? 'AUTOSCROLL: ON' : 'AUTOSCROLL: OFF'}</span>
          </button>

          {/* Clear Stream Button */}
          <button
            onClick={clearStream}
            title="Clear Stream Buffer"
            className="flex items-center gap-1 px-2 py-1 rounded-xs bg-slate-900 border border-slate-800 hover:border-rose-900 text-slate-400 hover:text-rose-400 font-mono text-[10px] uppercase tracking-wider transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>CLEAR</span>
          </button>
        </div>
      </div>

      {/* ── Table Container ── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0 bg-[#080C14]"
      >
        <table className="w-full text-left border-collapse font-mono text-[11px]">
          <thead className="sticky top-0 z-10 bg-[#0B101B] border-b border-slate-800 text-slate-400 font-sans text-[10px] uppercase tracking-wider select-none">
            <tr>
              <th className="py-1.5 px-3 w-24">TIME</th>
              <th className="py-1.5 px-3 w-32">TX ID</th>
              <th className="py-1.5 px-3 w-36">AGENT</th>
              <th className="py-1.5 px-3 w-40">NAMESPACE</th>
              <th className="py-1.5 px-3 w-28">STATUS</th>
              <th className="py-1.5 px-3">THOUGHT PAYLOAD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {filteredThoughts.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-slate-400 font-mono text-xs uppercase tracking-widest">
                  [ STREAM QUIET — AWAITING LIVE THOUGHTS FROM 127.0.0.1:8081 ]
                </td>
              </tr>
            ) : (
              filteredThoughts.map((t) => {
                const txHex = t.tx_id_hex || formatTxIdHex(t.tx_id);
                const truncatedTx = txHex.length > 14 ? `${txHex.slice(0, 6)}...${txHex.slice(-4)}` : txHex;
                const agentAlias = agentAliases[t.agent_hex] || (t.agent_hex.length > 10 ? t.agent_hex.slice(0, 8) : t.agent_hex);
                const isSelected = selectedThought?.tx_id === t.tx_id;

                return (
                  <tr
                    key={`${t.tx_id}-${t.agent_hex}`}
                    onClick={() => setSelectedThought(t)}
                    className={`hover:bg-slate-900/80 cursor-pointer transition-colors ${
                      isSelected ? 'bg-slate-800/70 border-l-2 border-cyan-400' : ''
                    }`}
                  >
                    {/* Time */}
                    <td className="py-1.5 px-3 text-slate-400 whitespace-nowrap">
                      {formatTimeWithMicros(t.timestamp)}
                    </td>

                    {/* Tx ID with Copy Tooltip */}
                    <td className="py-1.5 px-3 whitespace-nowrap">
                      <button
                        onClick={(e) => handleCopyTx(e, txHex)}
                        title={`Copy full TxID: ${txHex}`}
                        className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors group"
                      >
                        <span className="font-bold">{truncatedTx}</span>
                        {copiedId === txHex ? (
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    </td>

                    {/* Agent */}
                    <td className="py-1.5 px-3 whitespace-nowrap">
                      <span className={`inline-block px-1.5 py-0.5 rounded-xs border text-[10px] font-bold ${getAgentColor(t.agent_hex)}`}>
                        [{agentAlias}]
                      </span>
                    </td>

                    {/* Namespace */}
                    <td className="py-1.5 px-3 whitespace-nowrap text-slate-300">
                      <span className="text-slate-400">{t.intent_path}</span>
                    </td>

                    {/* Status */}
                    <td className="py-1.5 px-3 whitespace-nowrap">
                      <span className={`inline-block px-1.5 py-0.5 rounded-xs border text-[9px] font-bold uppercase tracking-wider ${getStatusBadge(t.status)}`}>
                        {t.status || 'COMMITTED'}
                      </span>
                    </td>

                    {/* Payload Preview */}
                    <td className="py-1.5 px-3 text-slate-200 truncate max-w-xs xl:max-w-md">
                      <span title={t.text}>{t.text}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div ref={tableBottomRef} />
      </div>

      {/* ── Forensic Drawer Inspector ── */}
      {selectedThought && (
        <aside className="absolute top-0 right-0 bottom-0 w-full sm:w-[460px] bg-[#070B12] border-l border-slate-800 shadow-2xl z-30 flex flex-col animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="bg-[#0B101B] border-b border-slate-800 p-3 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span className="font-sans text-xs uppercase tracking-wider font-bold text-white">
                Forensic Thought Inspector
              </span>
            </div>
            <button
              onClick={() => setSelectedThought(null)}
              className="p-1 text-slate-400 hover:text-white rounded-xs hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
            {/* TxID Full Block */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-sans tracking-wider">
                <span>Transaction ID (UUIDv7 Hex)</span>
                <button
                  onClick={() => {
                    const hex = selectedThought.tx_id_hex || formatTxIdHex(selectedThought.tx_id);
                    navigator.clipboard.writeText(hex);
                    setCopiedDrawerTx(true);
                    setTimeout(() => setCopiedDrawerTx(false), 2000);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                >
                  {copiedDrawerTx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>COPY HEX</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xs border border-slate-800 text-cyan-400 font-bold break-all">
                {selectedThought.tx_id_hex || formatTxIdHex(selectedThought.tx_id)}
              </div>
            </div>

            {/* Agent Details */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-sans tracking-wider block">
                  Agent Alias
                </span>
                <div className="bg-slate-950 p-2 rounded-xs border border-slate-800 text-white font-bold truncate">
                  {agentAliases[selectedThought.agent_hex] || 'UNALIASED'}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-sans tracking-wider block">
                  Execution Status
                </span>
                <div className="bg-slate-950 p-2 rounded-xs border border-slate-800">
                  <span className={`inline-block px-1.5 py-0.5 rounded-xs border text-[10px] font-bold uppercase ${getStatusBadge(selectedThought.status)}`}>
                    {selectedThought.status || 'COMMITTED'}
                  </span>
                </div>
              </div>
            </div>

            {/* Agent Hex Public Key */}
            <div className="space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-sans tracking-wider block">
                Agent Hex / Public Key
              </span>
              <div className="bg-slate-950 p-2.5 rounded-xs border border-slate-800 text-slate-300 break-all text-[11px]">
                {selectedThought.agent_hex}
              </div>
            </div>

            {/* Intent Path / Namespace */}
            <div className="space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-sans tracking-wider block">
                Target Namespace / Intent Path
              </span>
              <div className="bg-slate-950 p-2 rounded-xs border border-slate-800 text-emerald-400 font-semibold truncate">
                {selectedThought.intent_path}
              </div>
            </div>

            {/* Raw Thought Payload */}
            <div className="space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-sans tracking-wider block">
                Semantic Thought Payload
              </span>
              <pre className="bg-slate-950 p-3 rounded-xs border border-slate-800 text-slate-200 whitespace-pre-wrap break-words text-[11px] leading-relaxed max-h-60 overflow-y-auto">
                {selectedThought.text}
              </pre>
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="bg-[#0B101B] border-t border-slate-800 p-3 flex items-center justify-between shrink-0">
            <button
              onClick={() => setSelectedThought(null)}
              className="px-3 py-1.5 rounded-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-sans text-xs font-semibold transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => handleDrawerVerifyInVault(selectedThought.tx_id_hex || formatTxIdHex(selectedThought.tx_id))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/70 text-cyan-300 font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-[0_0_10px_rgba(6,182,212,0.2)]"
            >
              <span>[VERIFY INCLUSION PROOF IN VAULT]</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
