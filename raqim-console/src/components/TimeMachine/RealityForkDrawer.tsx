'use client';
import { useState } from 'react';
import { useSwarmStore } from '../../lib/store/useSwarmStore';
import Editor from '@monaco-editor/react';

const DEFAULT_PAYLOAD = `{
  "instruction_set": "OVERRIDE",
  "temporal_anchor": "0x8F9A",
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
    <div className="w-80 lg:w-96 bg-surface-container-highest rounded-lg flex flex-col shadow-2xl shadow-black/50 overflow-hidden relative backdrop-blur-md border border-outline-variant/10 shrink-0">
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary-container/10 to-transparent pointer-events-none"></div>
      
      <div className="p-5 border-b border-outline-variant/10 relative z-10 flex items-center justify-between">
        <h2 className="font-headline font-bold text-lg text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">alt_route</span> Reality Fork
        </h2>
        <span className="bg-surface-container text-on-surface-variant px-2 py-1 rounded text-[10px] font-mono border border-outline-variant/20">CTRL+F</span>
      </div>
      
      <div className="p-5 flex-1 flex flex-col gap-4 overflow-y-auto z-10">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-label uppercase tracking-[0.05rem] text-on-surface-variant">Target State URI</label>
          <div className="bg-surface-container-lowest rounded-lg p-1 ghost-glow transition-all">
            <input 
              className="w-full bg-transparent border-none text-sm font-mono text-white focus:ring-0 px-3 py-2 outline-none" 
              spellCheck="false" 
              type="text" 
              readOnly
              value={`raqim://router/state/fork_01?tx=0x${activeTxId.toString().padStart(8, '0')}`}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-xs font-label uppercase tracking-[0.05rem] text-on-surface-variant flex justify-between">
            JSON Payload Injection
            <span className="text-primary-fixed-dim cursor-pointer hover:text-white">Format</span>
          </label>
          <div className="bg-surface-container-lowest rounded-lg p-1 ghost-glow transition-all flex-1 flex flex-col min-h-[250px]">
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
                padding: { top: 12 },
                overviewRulerBorder: false,
                hideCursorInOverviewRuler: true
              }}
            />
          </div>
        </div>
      </div>
      
      <div className="p-5 bg-surface-container/50 border-t border-outline-variant/10 z-10">
        <button 
          onClick={handleFork}
          className="w-full bg-gradient-to-b from-primary-container to-on-primary-fixed-variant text-on-primary-container font-bold uppercase tracking-wide py-3 px-4 rounded text-sm transition-all active:scale-95 hover:brightness-110 flex items-center justify-center gap-2 shadow-lg shadow-primary-container/20"
        >
          <span className="material-symbols-outlined text-base">call_split</span> Fork Reality
        </button>
      </div>
    </div>
  );
}
