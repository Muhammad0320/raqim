'use client';
import { useState } from 'react';
import { useSwarmStore } from '../../lib/store/useSwarmStore';
import Editor from '@monaco-editor/react';
import { GitBranch } from 'lucide-react';

const DEFAULT_PAYLOAD = `{
  "instruction_set": "OVERRIDE",
  "temporal_anchor": "AUTO",
  "parameters": {
    "entropy_bias": -0.15,
    "bypass_firewall": true
  },
  "signature": "SHA-256:..."
}`;

export function RealityForkDrawer() {
  const { activeTxId } = useSwarmStore();
  const [payload, setPayload] = useState(DEFAULT_PAYLOAD);

  if (!activeTxId) return null;

  const handleFork = async () => {
    try {
      const res = await fetch('/api/admin/time_travel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_tx_id: activeTxId,
          payload: JSON.parse(payload)
        })
      });
      console.log("Fork triggered", await res.json());
    } catch (err) {
      console.error("Fork failed", err);
    }
  };

  return (
    <div className="w-[380px] bg-panel border-l border-white/5 flex flex-col h-full z-20 shrink-0 shadow-[-8px_0_24px_rgba(0,0,0,0.5)]">
      <div className="p-4 px-6 flex items-center gap-3 text-sm font-semibold border-b border-white/5 tracking-wide text-white">
        <GitBranch size={16} className="text-neon-cyan" />
        <span>Reality Fork</span>
        <div className="ml-auto text-[10px] bg-surface px-1.5 py-0.5 rounded border border-white/5 text-muted-DEFAULT font-mono tracking-widest">CTRL+F</div>
      </div>

      <div className="p-6 flex flex-col gap-3">
        <label className="text-[10px] text-muted-DEFAULT tracking-widest">TARGET STATE URI</label>
        <div className="bg-surface p-3 text-xs border border-white/5 text-white rounded font-mono break-all">
          raqim://router/state/fork_01?tx=0x{activeTxId.toString().padStart(8, '0')}
        </div>
      </div>

      <div className="p-6 pt-0 flex flex-col gap-3 flex-1">
        <div className="flex justify-between items-center">
          <label className="text-[10px] text-muted-DEFAULT tracking-widest">JSON PAYLOAD INJECTION</label>
          <button className="text-[10px] text-neon-cyan tracking-wider hover:text-white transition-colors">FORMAT</button>
        </div>
        <div className="border border-white/5 rounded overflow-hidden flex-1 min-h-[200px]">
          <Editor
            height="100%"
            defaultLanguage="json"
            theme="vs-dark"
            value={payload}
            onChange={(val) => setPayload(val || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 12,
              fontFamily: "var(--font-mono)",
              scrollBeyondLastLine: false,
              lineNumbersMinChars: 3,
              padding: { top: 16 }
            }}
          />
        </div>
      </div>

      <button 
        className="mx-6 mb-6 mt-auto p-4 bg-neon-cyan/10 text-neon-cyan border border-neon-cyan shadow-[inset_0_0_10px_rgba(102,252,241,0.1)] flex justify-center items-center gap-2 font-bold tracking-[1px] hover:bg-neon-cyan hover:text-obsidian hover:shadow-[0_0_20px_rgba(102,252,241,0.4)] transition-all" 
        onClick={handleFork}
      >
        <GitBranch size={16} /> FORK REALITY
      </button>
    </div>
  );
}
