'use client';
import { useEffect } from 'react';
import { MainLayout } from '../../components/Layout/MainLayout';
import { DagCanvas } from '../../components/DagCanvas/DagCanvas';
import { NLEScrubber } from '../../components/TimeMachine/NLEScrubber';
import { RealityForkDrawer } from '../../components/TimeMachine/RealityForkDrawer';
import { useSwarmStream } from '../../lib/hooks/useSwarmStream';
import { useSwarmStore, UiThought } from '../../lib/store/useSwarmStore';

export default function RouterPage() {
  useSwarmStream();
  const { isForking, activeTxId, batchAddThoughts, setActiveTxId } = useSwarmStore();

  useEffect(() => {
    if (!isForking) return;
    
    console.log("Opening NEW EventSource connection to http://localhost:8081/v1/time_travel/stream...");
    const eventSource = new EventSource('http://localhost:8081/v1/time_travel/stream');
    
    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.event_type === "ThoughtCommitted") {
          const newPhantomThought: UiThought = {
            tx_id: parsed.tx_id,
            agent_hex: parsed.agent_hex || "0xPHANTOM",
            intent_path: parsed.intent_path,
            text: parsed.text,
            parent_tx_id: parsed.tx_id - 1, // Assuming sequential for now
            status: "FORKED",
            is_a2a_query: false,
          };
          batchAddThoughts([newPhantomThought]);
          setActiveTxId(parsed.tx_id);
        }
      } catch (err) {
        console.error("Error parsing phantom stream event", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("Phantom stream EventSource failed", err);
    };
    
    return () => {
      eventSource.close();
      console.log("Closing Phantom Stream EventSource connection.");
    };
  }, [isForking, batchAddThoughts, setActiveTxId]);

  return (
    <MainLayout title="State Inspector">
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950 relative">
        
        {/* Top Command Bar */}
        <div className="h-16 shrink-0 border-b border-zinc-800 px-6 flex items-center justify-between bg-zinc-950/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest mb-1">Target Agent</span>
              <select className="bg-zinc-900 border border-zinc-700 text-[#00f3ff] font-mono text-xs px-3 py-1.5 rounded-sm outline-none cursor-pointer hover:border-[#00f3ff]/50 transition-colors">
                <option>FINANCE-LEDGER-01 (#1492)</option>
                <option>LOGISTICS-CORE-02 (#1493)</option>
                <option>AUTH-GATEWAY-05 (#1494)</option>
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
          {/* Background Grid */}
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none" 
            style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}
          ></div>
          
          <div className="absolute inset-0 pointer-events-auto z-10">
            <DagCanvas />
          </div>
          
          {/* Drawer Overlays */}
          <RealityForkDrawer />
        </div>

        {/* Scrubbing Deck (30% viewport) */}
        <div className="h-[30vh] shrink-0 border-t border-zinc-800 bg-zinc-900 relative z-20 flex flex-col shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <NLEScrubber />
        </div>
        
      </div>
    </MainLayout>
  );
}
