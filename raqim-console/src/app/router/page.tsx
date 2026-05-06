'use client';
import { useEffect, useState } from 'react';
import { MainLayout } from '../../components/Layout/MainLayout';
import { DagCanvas } from '../../components/DagCanvas/DagCanvas';
import { NLEScrubber } from '../../components/TimeMachine/NLEScrubber';
import { RealityForkDrawer } from '../../components/TimeMachine/RealityForkDrawer';
import { useSwarmStream } from '../../lib/hooks/useSwarmStream';
import { useSwarmStore, UiThought } from '../../lib/store/useSwarmStore';

export default function RouterPage() {
  useSwarmStream();
  const { isForking, activeTxId, batchAddThoughts, setActiveTxId } = useSwarmStore();
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!isForking) return;
    
    setTerminalLogs(prev => [...prev, `[SYSTEM] Opening EventSource connection to GET /v1/time_travel/stream...`, `[SYSTEM] Connected to Forked Reality Engine.`]);
    
    let phantomTxId = activeTxId ? activeTxId + 1 : Date.now() % 10000;
    
    const interval = setInterval(() => {
      const newPhantomThought: UiThought = {
        tx_id: phantomTxId,
        agent_hex: "0xPHANTOM",
        intent_path: "EVALUATE_INJECTED_PAYLOAD",
        text: `Executing instruction offset 0x${Math.floor(Math.random()*1000).toString(16)}... Memory bounds checked. Proceeding with override evaluation.`,
        parent_tx_id: phantomTxId - 1,
        status: "FORKED",
        is_a2a_query: false,
      };
      
      batchAddThoughts([newPhantomThought]);
      setActiveTxId(phantomTxId);
      
      const logLine = `[${new Date().toISOString().split('T')[1].substring(0,12)}] THOUGHT_COMMITTED | TX_ID: ${phantomTxId.toString().padStart(8, '0')} | ${newPhantomThought.text}`;
      setTerminalLogs(prev => [...prev.slice(-49), logLine]); // Keep last 50 logs
      
      phantomTxId++;
    }, 1500);
    
    return () => {
      clearInterval(interval);
      setTerminalLogs(prev => [...prev, `[SYSTEM] Connection terminated.`]);
    };
  }, [isForking, activeTxId, batchAddThoughts, setActiveTxId]);

  return (
    <MainLayout title="State Inspector">
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950 relative">
        
        {/* Top Command Bar */}
        <div className="h-16 shrink-0 border-b border-zinc-800 px-6 flex items-center justify-between bg-zinc-950/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest mb-1">Target Agent</span>
              <select className="bg-zinc-900 border border-zinc-700 text-[#00f3ff] font-mono text-xs px-3 py-1.5 rounded-sm outline-none cursor-pointer hover:border-[#00f3ff]/50 transition-colors">
                <option>FINANCE-LEDGER-01 (0x9F4A...)</option>
                <option>LOGISTICS-CORE-02 (0x3B2C...)</option>
                <option>AUTH-GATEWAY-05 (0x1A8F...)</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center">
            {isForking ? (
              <span className="bg-[#ffb300]/10 text-[#ffb300] border border-[#ffb300]/30 px-4 py-1.5 rounded-sm text-[10px] font-mono uppercase tracking-[0.2em] flex items-center gap-3 shadow-[0_0_15px_rgba(255,179,0,0.2)]">
                <span className="w-2 h-2 rounded-full bg-[#ffb300] animate-pulse shadow-[0_0_8px_rgba(255,179,0,0.8)]"></span>
                FORKED REALITY
              </span>
            ) : (
              <span className="bg-[#00f3ff]/10 text-[#00f3ff] border border-[#00f3ff]/30 px-4 py-1.5 rounded-sm text-[10px] font-mono uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#00f3ff] animate-pulse shadow-[0_0_8px_rgba(0,243,255,0.8)]"></span>
                MAIN TIMELINE
              </span>
            )}
          </div>
        </div>

        {/* Main Stage (70% viewport) */}
        <div className="flex-1 relative bg-zinc-950 overflow-hidden" style={{ height: '70%' }}>
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none" 
            style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}
          ></div>
          
          <div className="absolute inset-0 pointer-events-auto z-10">
            <DagCanvas />
          </div>
          
          <RealityForkDrawer />
        </div>

        {/* Scrubbing Deck (30% viewport) */}
        <div className={`shrink-0 border-t border-zinc-800 bg-zinc-900 relative z-20 flex flex-col shadow-[0_-10px_30px_rgba(0,0,0,0.5)] transition-all duration-500 ${isForking ? 'h-[20vh]' : 'h-[30vh]'}`}>
          <NLEScrubber />
        </div>
        
        {/* Phantom Terminal (Bottom Slider) */}
        <div className={`absolute bottom-0 left-0 w-full bg-black border-t border-zinc-800 z-30 transition-all duration-500 ease-in-out flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.8)] ${isForking ? 'h-[25vh] translate-y-0' : 'h-[25vh] translate-y-full'}`}>
           <div className="bg-zinc-900 px-4 py-1.5 border-b border-zinc-800 flex justify-between items-center shrink-0">
             <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00f3ff] flex items-center gap-2">
               <span className="material-symbols-outlined text-sm">terminal</span>
               PHANTOM STREAM TERMINAL
             </span>
             <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest animate-pulse">Live</span>
           </div>
           <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] leading-relaxed text-zinc-300 flex flex-col gap-1">
             {terminalLogs.map((log, i) => (
                <div key={i} className={`${log.startsWith('[SYSTEM]') ? 'text-[#ffb300]' : ''}`}>
                  {log}
                </div>
             ))}
           </div>
        </div>
        
      </div>
    </MainLayout>
  );
}
