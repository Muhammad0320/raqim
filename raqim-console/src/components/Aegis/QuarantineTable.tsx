'use client';

import React, { useState, useMemo } from 'react';
import { QuarantineRecord } from '../../lib/api';
import { ShieldCheck, Copy, Check, RefreshCw, Search, ShieldAlert, Zap } from 'lucide-react';

interface QuarantineTableProps {
  quarantineList: QuarantineRecord[];
  onSelectAgent: (record: QuarantineRecord) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

const getViolationBadgeStyle = (type: string) => {
  switch (type) {
    case 'CRYPTO_SPOOF':
      return 'bg-rose-950/80 text-rose-400 border-rose-800';
    case 'NAMESPACE_BREACH':
      return 'bg-amber-950/80 text-amber-400 border-amber-800';
    case 'RATE_LIMIT_EXCEEDED':
      return 'bg-purple-950/80 text-purple-400 border-purple-800';
    case 'REPLAY_ATTACK':
      return 'bg-red-950/80 text-red-400 border-red-800';
    default:
      return 'bg-rose-950/80 text-rose-300 border-rose-700';
  }
};

const formatTimestamps = (timestamp: number) => {
  const date = new Date(timestamp > 1e12 ? timestamp : timestamp * 1000);
  const utc = date.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  
  const now = Date.now();
  const diffSec = Math.floor((now - date.getTime()) / 1000);

  let relative = 'just now';
  if (diffSec >= 60 && diffSec < 3600) {
    relative = `${Math.floor(diffSec / 60)}m ago`;
  } else if (diffSec >= 3600 && diffSec < 86400) {
    relative = `${Math.floor(diffSec / 3600)}h ago`;
  } else if (diffSec >= 86400) {
    relative = `${Math.floor(diffSec / 86400)}d ago`;
  }

  return { utc, relative };
};

export function QuarantineTable({
  quarantineList,
  onSelectAgent,
  onRefresh,
  isLoading,
}: QuarantineTableProps) {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');

  const handleCopyHex = (e: React.MouseEvent, hex: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const filteredList = useMemo(() => {
    if (!filterQuery.trim()) return quarantineList;
    const q = filterQuery.toLowerCase().trim();
    return quarantineList.filter(
      (r) =>
        r.agent_hex.toLowerCase().includes(q) ||
        r.violation_type.toLowerCase().includes(q) ||
        r.attempted_path.toLowerCase().includes(q) ||
        r.payload_preview.toLowerCase().includes(q)
    );
  }, [quarantineList, filterQuery]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0D1322] border border-slate-800 rounded-sm overflow-hidden shadow-lg">
      {/* Table Controls Header */}
      <div className="bg-[#080C14] border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          <span className="font-sans text-xs uppercase tracking-wider font-bold text-slate-300">
            Quarantine Isolation Matrix
          </span>
          <span className="px-1.5 py-0.5 rounded-xs bg-slate-900 border border-slate-800 font-mono text-[10px] text-rose-400 font-bold">
            {quarantineList.length} ISOLATED
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Filter */}
          <div className="relative">
            <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter agent or target..."
              className="pl-6.5 pr-2 py-1 bg-slate-950 border border-slate-800 focus:border-rose-500/60 rounded-xs text-[11px] font-mono text-slate-200 placeholder:text-slate-400 outline-none w-44 transition-colors"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh active quarantine list"
            className="flex items-center gap-1 px-2.5 py-1 rounded-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-mono text-[10px] uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
            <span>REFRESH</span>
          </button>
        </div>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-[#080C14]">
        <table className="w-full text-left border-collapse font-mono text-[11px]">
          <thead className="sticky top-0 z-10 bg-[#0B101B] border-b border-slate-800 text-slate-400 font-sans text-[10px] uppercase tracking-wider select-none">
            <tr>
              <th className="py-2 px-3 w-40">AGENT IDENTITY</th>
              <th className="py-2 px-3 w-44">VIOLATION</th>
              <th className="py-2 px-3">ATTEMPTED TARGET</th>
              <th className="py-2 px-3 w-44">TIMESTAMP</th>
              <th className="py-2 px-3 w-44 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {quarantineList.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-20 text-slate-400 font-mono text-xs uppercase tracking-widest">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <span>🟢 ALL GATES SECURE — ZERO ACTIVE INTERDICTIONS</span>
                    </div>
                    <span className="text-slate-400 text-[11px] normal-case">
                      No compromised enclaves currently isolated by Aegis.
                    </span>
                  </div>
                </td>
              </tr>
            ) : filteredList.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-400 font-mono text-xs uppercase tracking-widest">
                  NO QUARANTINED RECORDS MATCH FILTER &quot;{filterQuery}&quot;
                </td>
              </tr>
            ) : (
              filteredList.map((record) => {
                const hex = record.agent_hex;
                const truncatedHex = hex.length > 14 ? `${hex.slice(0, 8)}...${hex.slice(-6)}` : hex;
                const { utc, relative } = formatTimestamps(record.timestamp);

                return (
                  <tr
                    key={record.agent_hex}
                    className="hover:bg-slate-900/80 transition-colors group"
                  >
                    {/* Agent Identity */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <button
                        onClick={(e) => handleCopyHex(e, hex)}
                        title={`Copy full Agent Hex: ${hex}`}
                        className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
                      >
                        <span>{truncatedHex}</span>
                        {copiedHex === hex ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    </td>

                    {/* Violation Type */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded-xs border text-[10px] font-bold uppercase tracking-wider ${getViolationBadgeStyle(record.violation_type)}`}>
                        {record.violation_type}
                      </span>
                    </td>

                    {/* Attempted Target */}
                    <td className="py-2 px-3 text-slate-200 truncate max-w-xs">
                      <span className="text-amber-400 font-medium" title={record.attempted_path}>
                        {record.attempted_path}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td className="py-2 px-3 whitespace-nowrap text-slate-400 text-[10px]">
                      <div className="flex flex-col">
                        <span className="text-slate-300">{relative}</span>
                        <span className="text-slate-400 text-[9px]">{utc}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-3 whitespace-nowrap text-right">
                      <button
                        onClick={() => onSelectAgent(record)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-rose-900/40 hover:bg-rose-900/70 text-rose-300 hover:text-rose-100 border border-rose-700 text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-[0_0_8px_rgba(244,63,94,0.15)]"
                      >
                        <Zap className="w-3 h-3 text-rose-400" />
                        <span>[LIFT &amp; RESEED CONTEXT]</span>
                      </button>
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
