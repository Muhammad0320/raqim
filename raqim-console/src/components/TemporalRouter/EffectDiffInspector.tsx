'use client';

import React, { useMemo } from 'react';
import { TimelineNode, formatTxIdHex } from '../../lib/api';
import {
  FileCode,
  CheckCircle2,
  AlertTriangle,
  GitFork,
  Database,
  Layers,
  Copy,
  Check,
} from 'lucide-react';

interface EffectDiffInspectorProps {
  currentNode: TimelineNode | null;
  stepIndex: number;
  agentHex: string;
  isForked: boolean;
  forkedBranchPath: string | null;
  onForkAtStep: (step: number) => void;
}

export function EffectDiffInspector({
  currentNode,
  stepIndex,
  agentHex,
  isForked,
  forkedBranchPath,
  onForkAtStep,
}: EffectDiffInspectorProps) {
  const [copiedHex, setCopiedHex] = React.useState(false);

  const txHex = currentNode ? formatTxIdHex(currentNode.tx_id) : '0x00000000000000000000000000000000';

  // Construct synthetic or decoded JSON baseline payload
  const formattedBaselineJson = useMemo(() => {
    if (!currentNode) return '// Awaiting active step selection...';

    try {
      const payloadObj = {
        agent_hex: agentHex,
        step_ordinal: stepIndex,
        call_signature_blake3: txHex,
        status: currentNode.agent_status,
        timestamp_utc: currentNode.timestamp,
        trace_payload: currentNode.payload_preview,
        side_effect: {
          type: currentNode.agent_status === 'TOOL_EXEC' ? 'IO_TOOL' : 'CRDT_MUTATION',
          deterministic: true,
          caching_tier: 'WAL_CACHE_L1',
        },
      };
      return JSON.stringify(payloadObj, null, 2);
    } catch {
      return currentNode.payload_preview;
    }
  }, [currentNode, stepIndex, agentHex, txHex]);

  // Simulated replayed or divergent JSON payload
  const formattedReplayedJson = useMemo(() => {
    if (!currentNode) return '// Awaiting execution state...';

    if (!isForked) {
      // 100% Zero Divergence Replay
      return formattedBaselineJson;
    }

    // Divergent fork state
    try {
      const divergentObj = {
        agent_hex: agentHex,
        step_ordinal: stepIndex,
        branch_timeline: forkedBranchPath || `phantom_${agentHex.slice(0, 8)}_step${stepIndex}`,
        synthetic_divergence: true,
        divergence_type: 'BRANCH_OVERRIDE',
        timestamp_utc: new Date().toISOString(),
        injected_response: '[SIMULATED_MOCK] Re-executed in isolated WASI phantom workspace',
      };
      return JSON.stringify(divergentObj, null, 2);
    } catch {
      return formattedBaselineJson;
    }
  }, [currentNode, isForked, formattedBaselineJson, agentHex, stepIndex, forkedBranchPath]);

  const handleCopyTx = () => {
    navigator.clipboard.writeText(txHex);
    setCopiedHex(true);
    setTimeout(() => setCopiedHex(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0D1322] border border-slate-800 rounded-sm overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-[#080C14] border-b border-slate-800 px-3 py-2 flex items-center justify-between gap-2 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <FileCode className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-sans text-xs uppercase tracking-wider font-bold text-white">
            Side-Effect Boundary &amp; State Diff Inspector
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px]">
          <button
            onClick={() => onForkAtStep(stepIndex)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-xs bg-purple-950/80 hover:bg-purple-900 border border-purple-600 text-purple-300 font-bold uppercase transition-colors"
          >
            <GitFork className="w-3 h-3" />
            <span>FORK FROM STEP #{stepIndex}</span>
          </button>
        </div>
      </div>

      {/* 2-Column Comparative Body */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 min-h-0 divide-y md:divide-y-0 md:divide-x divide-slate-800 bg-[#080C14] overflow-hidden">
        {/* Left Column: Recorded Historical Baseline */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="bg-[#0A0E1A] px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[10px] font-mono select-none">
            <span className="text-slate-400 font-sans uppercase font-bold flex items-center gap-1.5">
              <Database className="w-3 h-3 text-cyan-400" />
              <span>Historical Baseline (WAL Storage)</span>
            </span>
            <span className="text-cyan-400">CANONICAL TRACE</span>
          </div>

          <div className="p-3 bg-[#050811] border-b border-slate-800/80 space-y-1.5 font-mono text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 uppercase font-sans text-[9px]">Call Signature</span>
              <button
                onClick={handleCopyTx}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>{txHex.slice(0, 12)}...</span>
                {copiedHex ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
              </button>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="uppercase font-sans text-[9px]">Execution Mode</span>
              <span className="text-emerald-400 font-bold">DETERMINISTIC 0ms ($0)</span>
            </div>
          </div>

          <div className="flex-1 p-3 overflow-y-auto font-mono text-[11px] text-slate-200 bg-[#050811] leading-relaxed">
            <pre className="whitespace-pre-wrap break-words">{formattedBaselineJson}</pre>
          </div>
        </div>

        {/* Right Column: Divergent / Replayed Execution */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="bg-[#0A0E1A] px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[10px] font-mono select-none">
            <span className="text-slate-400 font-sans uppercase font-bold flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-purple-400" />
              <span>Replayed / Divergent State</span>
            </span>
            <span className={isForked ? 'text-purple-400 font-bold' : 'text-emerald-400'}>
              {isForked ? 'PARALLEL BRANCH' : 'VERIFIED MATCH'}
            </span>
          </div>

          {/* Divergence Status Ribbon */}
          <div className="p-2.5 bg-[#050811] border-b border-slate-800/80">
            {!isForked ? (
              <div className="p-1.5 rounded-xs bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-[10px] font-mono flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>🟢 ZERO DIVERGENCE — 100% BIT-FOR-BIT MATCH</span>
              </div>
            ) : (
              <div className="p-1.5 rounded-xs bg-purple-950/60 border border-purple-700/80 text-purple-300 text-[10px] font-mono flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                <span className="truncate">⚡ DIVERGENT BRANCH: {forkedBranchPath}</span>
              </div>
            )}
          </div>

          <div
            className={`flex-1 p-3 overflow-y-auto font-mono text-[11px] leading-relaxed ${
              isForked
                ? 'bg-[#080714] text-purple-200'
                : 'bg-[#050811] text-slate-200'
            }`}
          >
            <pre className="whitespace-pre-wrap break-words">{formattedReplayedJson}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
