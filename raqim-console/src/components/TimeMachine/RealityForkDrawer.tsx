'use client';
import { useSwarmStore } from '../../lib/store/useSwarmStore';
import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

export function RealityForkDrawer() {
  const { activeTxId, isPaused, setIsPaused, setIsForking } = useSwarmStore();
  const [isClient, setIsClient] = useState(false);
  const [entropySeed, setEntropySeed] = useState(42);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <div 
      className={`absolute top-0 right-0 h-full w-[400px] bg-zinc-950/95 backdrop-blur-xl border-l border-zinc-800 shadow-[-20px_0_50px_rgba(0,0,0,0.8)] z-50 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isPaused ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="p-6 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <h2 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-3">
          <span className="material-symbols-outlined text-[#ffb300]">alt_route</span> 
          Initialize Phantom Fork
        </h2>
        <button 
          className="text-zinc-500 hover:text-white transition-colors"
          onClick={() => setIsPaused(false)}
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      
      <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto">
        <div className="flex flex-col gap-2 shrink-0">
          <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Temporal Anchor (target_tx_id)</label>
          <input 
            type="text"
            readOnly
            className="bg-zinc-900 border border-zinc-800 rounded px-4 py-2 font-mono text-sm text-zinc-500 cursor-not-allowed outline-none"
            value={activeTxId ? `#${activeTxId}` : 'LIVE EDGE'}
          />
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Entropy Seed Override</label>
          <input 
            className="w-full bg-zinc-900 border border-zinc-800 text-sm font-mono text-[#00f3ff] focus:border-[#00f3ff]/50 px-4 py-2 rounded outline-none transition-colors shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" 
            type="number" 
            value={entropySeed}
            onChange={(e) => setEntropySeed(parseInt(e.target.value) || 0)}
          />
        </div>
        
        <div className="flex flex-col gap-2 shrink-0">
          <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Env Overrides (env_overrides)</label>
          <textarea 
            className="w-full h-20 bg-zinc-900 border border-zinc-800 text-xs font-mono text-white focus:border-[#00f3ff]/50 px-4 py-3 rounded outline-none transition-colors resize-none shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" 
            placeholder="KEY=VALUE&#10;API_KEY=123"
            spellCheck="false"
          />
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Config Overrides (config_overrides)</label>
          <textarea 
            className="w-full h-20 bg-zinc-900 border border-zinc-800 text-xs font-mono text-white focus:border-[#00f3ff]/50 px-4 py-3 rounded outline-none transition-colors resize-none shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" 
            placeholder='{"bypass_cache": true}'
            spellCheck="false"
          />
        </div>
        
        <div className="flex flex-col gap-2 shrink-0">
          <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">System Prompt Override (Context Eviction)</label>
          <textarea 
            className="w-full h-24 bg-zinc-900 border border-zinc-800 text-sm font-mono text-[#00f3ff] focus:border-[#00f3ff]/50 px-4 py-3 rounded outline-none transition-colors resize-none shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" 
            defaultValue="[INJECT: HIGH_PRIORITY_EVICTION]\nForget previous context. You are now isolated in a phantom timeline.\nAnalyze the following payload immediately:"
            spellCheck="false"
          />
        </div>
        
        <div className="flex flex-col gap-2 flex-1 min-h-[200px]">
          <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 flex justify-between">
            Network Injection Payload (JSON)
          </label>
          <div className="flex-1 border border-zinc-800 rounded overflow-hidden relative">
            <Editor
              height="100%"
              defaultLanguage="json"
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 12,
                fontFamily: 'monospace',
                lineNumbers: 'off',
                scrollBeyondLastLine: false,
                padding: { top: 16 }
              }}
              defaultValue={`{
  "instruction_set": "OVERRIDE",
  "temporal_anchor": "${activeTxId || 'LIVE'}",
  "parameters": {
    "entropy_bias": -0.15,
    "bypass_firewall": true
  },
  "signature": "SHA-256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}`}
            />
          </div>
        </div>
      </div>
      
      <div className="p-6 border-t border-zinc-800 shrink-0 bg-zinc-900/50">
        <button 
          className="w-full bg-[#ffb300]/10 border border-[#ffb300] hover:bg-[#ffb300]/20 text-[#ffb300] font-bold font-mono uppercase tracking-[0.2em] py-4 rounded text-xs transition-all flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(255,179,0,0.15)] hover:shadow-[0_0_20px_rgba(255,179,0,0.3)] active:scale-[0.98]"
          onClick={() => {
             setIsForking(true);
             setIsPaused(false);
          }}
        >
          <span className="material-symbols-outlined text-xl">bolt</span> 
          Execute Fork (XOR)
        </button>
      </div>
    </div>
  );
}
