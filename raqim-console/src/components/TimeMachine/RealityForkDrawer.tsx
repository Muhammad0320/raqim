import { useSwarmStore } from '../../lib/store/useSwarmStore';
import { useState, useEffect } from 'react';

export function RealityForkDrawer() {
  const { activeTxId, setActiveTxId } = useSwarmStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || activeTxId === null) return null;

  return (
    <div className="w-80 lg:w-96 bg-surface-container-highest rounded-lg flex flex-col shadow-2xl shadow-black/50 overflow-hidden relative backdrop-blur-md border border-outline-variant/10 shrink-0">
      {/* Glassmorphism header effect */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary-container/10 to-transparent pointer-events-none"></div>
      
      <div className="p-5 border-b border-outline-variant/10 relative z-10 flex items-center justify-between">
        <h2 className="font-headline font-bold text-lg text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">alt_route</span> Reality Fork
        </h2>
        <div className="flex items-center gap-2">
          <span className="bg-surface-container text-on-surface-variant px-2 py-1 rounded text-[10px] font-mono border border-outline-variant/20">CTRL+F</span>
          <button 
            className="text-on-surface-variant hover:text-white"
            onClick={() => setActiveTxId(null)}
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      </div>
      
      <div className="p-5 flex-1 flex flex-col gap-4 overflow-y-auto z-10">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-label uppercase tracking-[0.05rem] text-on-surface-variant">Target State URI</label>
          <div className="bg-surface-container-lowest rounded-lg p-1 ghost-glow transition-all">
            <input 
              className="w-full bg-transparent border-none text-sm font-mono text-white focus:ring-0 px-3 py-2 outline-none" 
              spellCheck="false" 
              type="text" 
              defaultValue={`raqim://router/state/${activeTxId}`}
            />
          </div>
        </div>
        
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-xs font-label uppercase tracking-[0.05rem] text-on-surface-variant flex justify-between">
            JSON Payload Injection
            <span className="text-primary-fixed-dim cursor-pointer hover:text-white">Format</span>
          </label>
          <div className="bg-surface-container-lowest rounded-lg p-1 ghost-glow transition-all flex-1 flex flex-col">
            <textarea 
              className="w-full flex-1 bg-transparent border-none text-xs font-mono text-primary focus:ring-0 p-3 resize-none leading-relaxed outline-none" 
              spellCheck="false"
              defaultValue={`{
  "instruction_set": "OVERRIDE",
  "temporal_anchor": "${activeTxId}",
  "parameters": {
    "entropy_bias": -0.15,
    "bypass_firewall": true
  },
  "signature": "SHA-256:..."
}`}
            />
          </div>
        </div>
      </div>
      
      <div className="p-5 bg-surface-container/50 border-t border-outline-variant/10 z-10">
        <button 
          className="w-full bg-gradient-to-b from-primary-container to-on-primary-fixed-variant text-on-primary-container font-bold uppercase tracking-wide py-3 px-4 rounded text-sm transition-all active:scale-95 hover:brightness-110 flex items-center justify-center gap-2 shadow-lg shadow-primary-container/20"
          onClick={() => setActiveTxId(null)}
        >
          <span className="material-symbols-outlined text-base">call_split</span> Fork Reality
        </button>
      </div>
    </div>
  );
}
