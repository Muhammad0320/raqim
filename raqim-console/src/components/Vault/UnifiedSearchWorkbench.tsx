'use client';

import React, { useState } from 'react';
import { VaultSearchResult, formatTxIdHex } from '../../lib/api';
import { Search, Database, Zap, Copy, Check, Filter, ChevronRight, ShieldCheck } from 'lucide-react';

interface UnifiedSearchWorkbenchProps {
  results: VaultSearchResult[];
  onSearch: (query: string, namespace: string, includeWal: boolean) => void;
  onSelectTxId: (txIdHex: string) => void;
  selectedTxIdHex: string | null;
  isLoading: boolean;
  namespaces: string[];
}

const getScoreColor = (score: number) => {
  if (score >= 0.85) {
    return {
      text: 'text-emerald-400',
      bg: 'bg-emerald-950/80 border-emerald-800/80',
      bar: 'bg-emerald-500 shadow-[0_0_8px_#10b981]',
    };
  }
  if (score >= 0.70) {
    return {
      text: 'text-amber-400',
      bg: 'bg-amber-950/80 border-amber-800/80',
      bar: 'bg-amber-500 shadow-[0_0_8px_#f59e0b]',
    };
  }
  return {
    text: 'text-slate-400',
    bg: 'bg-slate-900 border-slate-800',
    bar: 'bg-slate-500',
  };
};

const renderPayloadWithTags = (text: string) => {
  const parts = text.split(/(\[[A-Z_]+\])/g);
  return parts.map((part, i) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      let tagStyle = 'bg-cyan-950/80 text-cyan-300 border-cyan-800';
      if (part.includes('REASONING')) tagStyle = 'bg-purple-950/80 text-purple-300 border-purple-800';
      if (part.includes('TOOL')) tagStyle = 'bg-amber-950/80 text-amber-300 border-amber-800';
      if (part.includes('INJECT') || part.includes('EVICTION')) tagStyle = 'bg-rose-950/80 text-rose-300 border-rose-800';
      if (part.includes('COMMITTED') || part.includes('RESOLVED')) tagStyle = 'bg-emerald-950/80 text-emerald-300 border-emerald-800';

      return (
        <span
          key={i}
          className={`inline-block px-1 py-0.5 rounded-xs border text-[10px] font-mono font-bold mr-1.5 ${tagStyle}`}
        >
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

export function UnifiedSearchWorkbench({
  results,
  onSearch,
  onSelectTxId,
  selectedTxIdHex,
  isLoading,
  namespaces,
}: UnifiedSearchWorkbenchProps) {
  const [query, setQuery] = useState('');
  const [namespace, setNamespace] = useState('ALL');
  const [includeWal, setIncludeWal] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query.trim(), namespace, includeWal);
  };

  const handleCopyHex = (e: React.MouseEvent, hex: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hex);
    setCopiedId(hex);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0D1322] border border-slate-800 rounded-sm overflow-hidden shadow-lg">
      {/* Search Controls Header */}
      <form
        onSubmit={handleFormSubmit}
        className="bg-[#080C14] border-b border-slate-800 p-3 space-y-2.5 shrink-0 select-none"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-sans text-xs uppercase tracking-wider font-bold text-white">
              Unified RAG &amp; Forensic Vault Search
            </span>
          </div>
          <span className="font-mono text-[10px] text-cyan-400 font-bold">
            HYBRID COSINE + LEXICAL
          </span>
        </div>

        {/* Query Input Bar */}
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter semantic concept, SQL query, or exact keyword..."
            disabled={isLoading}
            className="w-full pl-3 pr-32 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500/80 rounded-xs text-xs font-mono text-slate-100 placeholder:text-slate-400 outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-500/70 text-cyan-200 rounded-xs font-mono text-[11px] font-bold uppercase tracking-wider transition-all disabled:opacity-40"
          >
            {isLoading ? 'SEARCHING...' : 'EXECUTE SEARCH'}
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono pt-1">
          {/* Namespace Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3 h-3 text-slate-400" />
            <span className="text-slate-400 text-[10px] uppercase font-sans">Namespace:</span>
            <select
              value={namespace}
              onChange={(e) => setNamespace(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xs px-2 py-0.5 text-[11px] text-slate-200 outline-none cursor-pointer"
            >
              <option value="ALL">ALL NAMESPACES</option>
              {namespaces.map((ns) => (
                <option key={ns} value={ns}>
                  {ns}
                </option>
              ))}
            </select>
          </div>

          {/* Hot WAL Toggle Switch */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-slate-400 text-[10px] uppercase font-sans">Include Hot WAL Buffer:</span>
            <button
              type="button"
              onClick={() => setIncludeWal(!includeWal)}
              className={`w-9 h-4.5 rounded-full transition-colors relative p-0.5 ${
                includeWal ? 'bg-amber-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-slate-950 transition-transform ${
                  includeWal ? 'translate-x-4.5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-[10px] font-bold ${includeWal ? 'text-amber-400' : 'text-slate-400'}`}>
              {includeWal ? 'ON' : 'OFF'}
            </span>
          </label>
        </div>
      </form>

      {/* Search Results Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#080C14]">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400 font-mono text-xs">
            <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span>SCATTER-GATHERING LANCEDB &amp; WAL BUFFERS...</span>
          </div>
        ) : results.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400 font-mono text-xs uppercase tracking-wider text-center">
            <Database className="w-8 h-8 text-slate-700" />
            <span>ENTER A QUERY TO SEARCH THE VECTOR AUDIT VAULT</span>
            <span className="text-[10px] text-slate-400 normal-case">
              Targeting LanceDB embeddings with FastEmbed BGE-Small (384-dim).
            </span>
          </div>
        ) : (
          results.map((item, idx) => {
            const txHex = formatTxIdHex(item.tx_id);
            const isSelected = selectedTxIdHex === txHex;
            const score = item.similarity_score;
            const scoreColor = getScoreColor(score);
            const isHotWal = item.source === 'HOT_WAL';

            return (
              <div
                key={`${item.tx_id}-${idx}`}
                onClick={() => onSelectTxId(txHex)}
                className={`bg-[#0B101B] border rounded-sm p-3 space-y-2 cursor-pointer transition-all duration-150 group ${
                  isSelected
                    ? 'border-cyan-400 ring-1 ring-cyan-400/50 bg-slate-900 shadow-[0_0_15px_rgba(0,243,255,0.2)]'
                    : 'border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                {/* Result Header: Score + Source + Namespace */}
                <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                  <div className="flex items-center gap-2">
                    {/* Score Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs border font-bold ${scoreColor.bg} ${scoreColor.text}`}
                    >
                      <span>{(score * 100).toFixed(1)}%</span>
                      <span className="text-[9px] uppercase font-sans">SIMILARITY</span>
                    </span>

                    {/* Source Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs border text-[10px] font-bold ${
                        isHotWal
                          ? 'bg-amber-950/70 border-amber-800/70 text-amber-300'
                          : 'bg-emerald-950/70 border-emerald-800/70 text-emerald-300'
                      }`}
                    >
                      {isHotWal ? <Zap className="w-3 h-3" /> : <Database className="w-3 h-3" />}
                      <span>{isHotWal ? 'HOT WAL' : 'COLD LANCEDB'}</span>
                    </span>
                  </div>

                  {/* Namespace */}
                  <span className="text-emerald-400 font-bold truncate max-w-xs" title={item.namespace}>
                    {item.namespace}
                  </span>
                </div>

                {/* Payload Preview */}
                <div className="text-slate-200 text-xs font-mono leading-relaxed bg-slate-950/60 p-2 rounded-xs border border-slate-900">
                  {renderPayloadWithTags(item.payload)}
                </div>

                {/* Result Footer: TxID + Timestamp + Inspect Prompt */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 font-mono text-[10px] text-slate-400">
                  <div className="flex items-center gap-3">
                    {/* TxID copy */}
                    <button
                      onClick={(e) => handleCopyHex(e, txHex)}
                      className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
                      title={`Copy TxID: ${txHex}`}
                    >
                      <span>TX: {txHex.slice(0, 8)}...{txHex.slice(-6)}</span>
                      {copiedId === txHex ? (
                        <Check className="w-2.5 h-2.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-2.5 h-2.5 text-slate-400" />
                      )}
                    </button>

                    <span>AGENT: {item.agent_hex.slice(0, 6)}...</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-cyan-300 transition-colors">
                    <ShieldCheck className="w-3 h-3 text-cyan-400" />
                    <span>INSPECT MERKLE PROOF</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
