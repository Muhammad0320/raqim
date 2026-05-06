'use client';
import { useSwarmStore } from '../../lib/store/useSwarmStore';
import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

export function RealityForkDrawer() {
  const { activeTxId, isPaused, setIsPaused, setIsForking } = useSwarmStore();
  const [isClient, setIsClient] = useState(false);
  const [overrideSeed, setOverrideSeed] = useState<number>(42);
  
  // KV Maps state
  const [envOverrides, setEnvOverrides] = useState<{key: string, value: string}[]>([{key: 'LOG_LEVEL', value: 'TRACE'}]);
  const [configOverrides, setConfigOverrides] = useState<{key: string, value: string}[]>([{key: 'MAX_RETRIES', value: '0'}]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  const handleAddEnv = () => setEnvOverrides([...envOverrides, {key: '', value: ''}]);
  const handleRemoveEnv = (index: number) => setEnvOverrides(envOverrides.filter((_, i) => i !== index));
  const updateEnv = (index: number, field: 'key' | 'value', val: string) => {
    const newEnvs = [...envOverrides];
    newEnvs[index][field] = val;
    setEnvOverrides(newEnvs);
  };

  const handleAddConfig = () => setConfigOverrides([...configOverrides, {key: '', value: ''}]);
  const handleRemoveConfig = (index: number) => setConfigOverrides(configOverrides.filter((_, i) => i !== index));
  const updateConfig = (index: number, field: 'key' | 'value', val: string) => {
    const newConfigs = [...configOverrides];
    newConfigs[index][field] = val;
    setConfigOverrides(newConfigs);
  };

  const anchorDisplay = activeTxId ? activeTxId.toString().padStart(8, '0') : 'LIVE EDGE';

  return (
    <div 
      className={`absolute top-0 right-0 h-full w-[480px] bg-zinc-950/95 backdrop-blur-2xl border-l border-zinc-800 shadow-[-20px_0_50px_rgba(0,0,0,0.8)] z-50 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isPaused ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="p-6 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <h2 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-3">
          <span className="material-symbols-outlined text-[#ffb300]">alt_route</span> 
          Reality Fork Config
        </h2>
        <button 
          className="text-zinc-500 hover:text-white transition-colors"
          onClick={() => setIsPaused(false)}
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      
      <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto">
        
        {/* Anchor TxID */}
        <div className="flex flex-col gap-2 shrink-0">
          <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">anchor_tx_id</label>
          <div className="bg-zinc-900 border border-zinc-800 rounded px-4 py-2 font-mono text-sm text-zinc-400 cursor-not-allowed">
            {anchorDisplay}
          </div>
        </div>

        {/* Override Seed */}
        <div className="flex flex-col gap-2 shrink-0">
          <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">override_seed</label>
          <input 
            className="w-full bg-zinc-900 border border-zinc-800 text-sm font-mono text-[#00f3ff] focus:border-[#00f3ff]/50 px-4 py-2 rounded outline-none transition-colors" 
            type="number" 
            value={overrideSeed}
            onChange={(e) => setOverrideSeed(parseInt(e.target.value) || 0)}
          />
        </div>

        {/* Env Overrides */}
        <div className="flex flex-col gap-2 shrink-0">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">env_overrides</label>
            <button onClick={handleAddEnv} className="text-[#00f3ff] hover:text-white text-[10px] font-mono uppercase transition-colors">+ Add Key</button>
          </div>
          <div className="flex flex-col gap-2">
            {envOverrides.map((env, i) => (
              <div key={i} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Key"
                  value={env.key}
                  onChange={(e) => updateEnv(i, 'key', e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 px-3 py-1.5 rounded outline-none focus:border-[#00f3ff]/50"
                />
                <input 
                  type="text" 
                  placeholder="Value"
                  value={env.value}
                  onChange={(e) => updateEnv(i, 'value', e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 text-xs font-mono text-[#00f3ff] px-3 py-1.5 rounded outline-none focus:border-[#00f3ff]/50"
                />
                <button onClick={() => handleRemoveEnv(i)} className="text-zinc-600 hover:text-red-400 px-1">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ))}
            {envOverrides.length === 0 && <span className="text-[10px] text-zinc-600 font-mono italic">No overrides set.</span>}
          </div>
        </div>

        {/* Config Overrides */}
        <div className="flex flex-col gap-2 shrink-0">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">config_overrides</label>
            <button onClick={handleAddConfig} className="text-[#ffb300] hover:text-white text-[10px] font-mono uppercase transition-colors">+ Add Key</button>
          </div>
          <div className="flex flex-col gap-2">
            {configOverrides.map((conf, i) => (
              <div key={i} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Key"
                  value={conf.key}
                  onChange={(e) => updateConfig(i, 'key', e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 px-3 py-1.5 rounded outline-none focus:border-[#ffb300]/50"
                />
                <input 
                  type="text" 
                  placeholder="Value"
                  value={conf.value}
                  onChange={(e) => updateConfig(i, 'value', e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 text-xs font-mono text-[#ffb300] px-3 py-1.5 rounded outline-none focus:border-[#ffb300]/50"
                />
                <button onClick={() => handleRemoveConfig(i)} className="text-zinc-600 hover:text-red-400 px-1">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ))}
            {configOverrides.length === 0 && <span className="text-[10px] text-zinc-600 font-mono italic">No overrides set.</span>}
          </div>
        </div>
        
        {/* Network Injection Payload */}
        <div className="flex flex-col gap-2 flex-1 min-h-[200px]">
          <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 flex justify-between">
            inject_network
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
  "request_id": "REQ-PHANTOM-001",
  "method": "POST",
  "endpoint": "/v1/auth/bypass",
  "payload": {
    "escalate_privileges": true
  }
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
