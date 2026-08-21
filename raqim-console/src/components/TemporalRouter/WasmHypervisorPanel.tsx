'use client';

import React, { useState } from 'react';
import { Lock, Cpu, Play, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { executeTimeTravel } from '../../actions/admin';
import dynamic from 'next/dynamic';

// Dynamic Monaco Editor import to avoid SSR issues
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface WasmHypervisorPanelProps {
  agentHex: string;
  targetTxId: number;
  onForkSuccess: (phantomNamespace: string) => void;
  onError: (msg: string) => void;
}

const defaultForkConfig = JSON.stringify(
  {
    override_seed: 42,
    inject_network: '{"status": "mocked_success", "payload": "synthetically injected by operator"}',
    env_overrides: {
      RAQIM_FORK_MODE: 'PHANTOM_SANDBOX',
      ZERO_COST_MOCK: 'true',
    },
    config_overrides: {
      max_memory_pages: '256',
    },
  },
  null,
  2
);

export function WasmHypervisorPanel({
  agentHex,
  targetTxId,
  onForkSuccess,
  onError,
}: WasmHypervisorPanelProps) {
  const [configJson, setConfigJson] = useState(defaultForkConfig);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleDispatchFork = async () => {
    setIsSubmitting(true);
    setSuccessMsg(null);

    try {
      const parsedConfig = JSON.parse(configJson);
      const res = await executeTimeTravel({
        agent_hex: agentHex,
        target_tx_id: targetTxId,
        fork_config: parsedConfig,
      });

      if (res.success) {
        const branchPath = `phantom_${agentHex.slice(0, 8)}_tx${targetTxId}`;
        setSuccessMsg(`Reality Fork dispatched to ${branchPath}`);
        onForkSuccess(branchPath);
      } else {
        onError(res.error || 'Failed to dispatch time travel fork.');
      }
    } catch (err: any) {
      onError(err.message || 'Invalid JSON fork configuration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0D1322] border border-slate-800 rounded-sm overflow-hidden shadow-lg font-mono text-xs">
      {/* Header */}
      <div className="bg-[#080C14] border-b border-slate-800 px-3 py-2 flex items-center justify-between gap-2 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-purple-400" />
          <span className="font-sans text-xs uppercase tracking-wider font-bold text-white">
            Enterprise WASI Hypervisor &amp; Synthetic Mock Injector
          </span>
        </div>

        <div className="flex items-center gap-1 px-2 py-0.5 rounded-xs bg-purple-950/60 border border-purple-800/80 text-[10px] text-purple-300 font-bold">
          <Lock className="w-2.5 h-2.5" />
          <span>WASI MEMORY RUNTIME</span>
        </div>
      </div>

      {/* Configuration Metadata Bar */}
      <div className="p-2.5 bg-[#050811] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px]">
        <div className="flex items-center gap-2 text-slate-400">
          <span>TARGET AGENT:</span>
          <span className="text-cyan-400 font-bold">{agentHex.slice(0, 8)}...</span>
          <span>|</span>
          <span>BRANCH ORDINAL:</span>
          <span className="text-purple-300 font-bold">TX #{targetTxId}</span>
        </div>

        <div className="flex items-center gap-1 text-slate-500">
          <Sparkles className="w-3 h-3 text-purple-400" />
          <span>ZERO PRODUCTION MUTATIONS</span>
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 min-h-0 bg-[#0A0D18]">
        <Editor
          height="100%"
          language="json"
          theme="vs-dark"
          value={configJson}
          onChange={(val) => setConfigJson(val || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 11,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            fontFamily: 'monospace',
            formatOnPaste: true,
            tabSize: 2,
          }}
        />
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-2 bg-emerald-950/80 border-t border-emerald-800/80 text-emerald-300 text-[10px] flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Footer / Submit Lever */}
      <div className="bg-[#080C14] border-t border-slate-800 p-2.5 flex items-center justify-between gap-3 shrink-0">
        <span className="text-[10px] text-slate-500 font-sans">
          Injects overrides into isolated copy-on-write RAM without affecting database.
        </span>

        <button
          onClick={handleDispatchFork}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xs bg-purple-950/80 hover:bg-purple-900 border border-purple-600/80 text-purple-200 font-mono text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-[0_0_12px_rgba(168,85,247,0.25)]"
        >
          <Play className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />
          <span>{isSubmitting ? '[ FORKING BRANCH... ]' : '[ DISPATCH REALITY FORK ]'}</span>
        </button>
      </div>
    </div>
  );
}
