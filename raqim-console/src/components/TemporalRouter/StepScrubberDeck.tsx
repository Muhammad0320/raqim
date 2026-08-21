'use client';

import React, { useRef, useEffect } from 'react';
import { TimelineNode, formatTxIdHex } from '../../lib/api';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  GitCommit,
  Cpu,
  Database,
  Terminal,
  Zap,
} from 'lucide-react';

interface StepScrubberDeckProps {
  timeline: TimelineNode[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  isLoading: boolean;
  divergentIndex: number | null;
}

const parseEffectType = (payload: string, status: string) => {
  if (payload.includes('[TOOL_EXEC]') || status === 'TOOL_EXEC') {
    return { label: 'Tool Execution', icon: Cpu, color: 'text-amber-400 border-amber-800 bg-amber-950/60' };
  }
  if (payload.includes('[SQL') || payload.toLowerCase().includes('select') || payload.toLowerCase().includes('query')) {
    return { label: 'Database Query', icon: Database, color: 'text-emerald-400 border-emerald-800 bg-emerald-950/60' };
  }
  if (payload.includes('[REASONING]') || status === 'REASONING') {
    return { label: 'LLM Completion', icon: Terminal, color: 'text-purple-400 border-purple-800 bg-purple-950/60' };
  }
  return { label: 'State Mutation', icon: GitCommit, color: 'text-cyan-400 border-cyan-800 bg-cyan-950/60' };
};

export function StepScrubberDeck({
  timeline,
  selectedIndex,
  onSelectIndex,
  isLoading,
  divergentIndex,
}: StepScrubberDeckProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active card into view
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.querySelector('[data-active="true"]') as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedIndex]);

  const handlePrev = () => {
    if (selectedIndex > 0) onSelectIndex(selectedIndex - 1);
  };

  const handleNext = () => {
    if (selectedIndex < timeline.length - 1) onSelectIndex(selectedIndex + 1);
  };

  const handleFirst = () => onSelectIndex(0);
  const handleLast = () => onSelectIndex(Math.max(timeline.length - 1, 0));

  return (
    <div className="bg-[#0D1322] border border-slate-800 rounded-sm overflow-hidden flex flex-col shrink-0 shadow-lg select-none">
      {/* Scrubber Controls Bar */}
      <div className="bg-[#080C14] border-b border-slate-800 px-3 py-1.5 flex items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <GitCommit className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-sans text-xs uppercase tracking-wider font-bold text-slate-300">
            Causal Execution Timeline &amp; Step Scrubber
          </span>
          <span className="px-1.5 py-0.2 rounded-xs bg-slate-900 border border-slate-800 text-[10px] text-cyan-400 font-bold">
            {timeline.length} CAUSAL STEPS
          </span>
        </div>

        {/* Step Navigation Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleFirst}
            disabled={selectedIndex <= 0 || timeline.length === 0}
            title="First Step (Ordinal #0)"
            className="p-1 rounded-xs bg-slate-950 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handlePrev}
            disabled={selectedIndex <= 0 || timeline.length === 0}
            title="Step Back"
            className="p-1 rounded-xs bg-slate-950 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="px-2 font-bold text-white text-[11px]">
            STEP #{timeline.length > 0 ? selectedIndex : 0} / {Math.max(timeline.length - 1, 0)}
          </span>

          <button
            onClick={handleNext}
            disabled={selectedIndex >= timeline.length - 1 || timeline.length === 0}
            title="Step Forward"
            className="p-1 rounded-xs bg-slate-950 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleLast}
            disabled={selectedIndex >= timeline.length - 1 || timeline.length === 0}
            title="Head Step"
            className="p-1 rounded-xs bg-slate-950 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Horizontal Scrubber Strip */}
      <div
        ref={scrollContainerRef}
        className="p-2.5 overflow-x-auto flex items-stretch gap-2.5 min-h-[100px] bg-[#050811] scrollbar-thin scrollbar-thumb-slate-800"
      >
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-6 text-slate-400 font-mono text-xs gap-2">
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span>FETCHING CAUSAL TIMELINE FROM LANCEDB + WAL...</span>
          </div>
        ) : timeline.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-6 text-slate-400 font-mono text-xs uppercase">
            [ ZERO RECORDED STEPS FOR THIS ENCLAVE ]
          </div>
        ) : (
          timeline.map((node, index) => {
            const isSelected = index === selectedIndex;
            const isDivergent = divergentIndex !== null && index >= divergentIndex;
            const txHex = formatTxIdHex(node.tx_id);
            const { label, icon: Icon, color } = parseEffectType(node.payload_preview, node.agent_status);

            return (
              <div
                key={`${node.tx_id}-${index}`}
                data-active={isSelected}
                onClick={() => onSelectIndex(index)}
                className={`w-60 shrink-0 p-2.5 rounded-sm border cursor-pointer transition-all duration-150 flex flex-col justify-between group ${
                  isSelected
                    ? isDivergent
                      ? 'bg-purple-950/60 border-purple-400 ring-2 ring-purple-400/40 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                      : 'bg-slate-900 border-cyan-400 ring-2 ring-cyan-400/40 shadow-[0_0_15px_rgba(0,243,255,0.3)]'
                    : isDivergent
                    ? 'bg-[#0B0A17] border-purple-900/60 hover:border-purple-600'
                    : 'bg-[#0A0F1D] border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/50'
                }`}
              >
                {/* Step Index & Type */}
                <div className="flex items-center justify-between gap-1 mb-1 font-mono text-[10px]">
                  <span className={`font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    Step #{index}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs border text-[9px] font-bold ${color}`}>
                    <Icon className="w-2.5 h-2.5" />
                    <span>{label}</span>
                  </span>
                </div>

                {/* Payload Snippet */}
                <p className="text-slate-300 text-[10px] font-mono line-clamp-2 leading-snug my-1">
                  {node.payload_preview || '[State Transition Committed]'}
                </p>

                {/* Step Footer: Hash & Status Badge */}
                <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between font-mono text-[9px]">
                  <span className="text-slate-400 truncate max-w-[90px]" title={txHex}>
                    sig: {txHex.slice(0, 6)}...
                  </span>

                  <span
                    className={`px-1 py-0.2 rounded-xs border font-bold uppercase tracking-tight text-[8px] ${
                      isDivergent
                        ? 'bg-purple-950 text-purple-300 border-purple-700'
                        : isSelected
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {isDivergent ? '⚡ FORKED' : isSelected ? '🟢 REPLAYED' : '🔵 RECORDED'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
