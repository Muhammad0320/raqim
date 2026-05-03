'use client';
import { MainLayout } from '../../components/Layout/MainLayout';
import { DagCanvas } from '../../components/DagCanvas/DagCanvas';
import { NLEScrubber } from '../../components/TimeMachine/NLEScrubber';
import { RealityForkDrawer } from '../../components/TimeMachine/RealityForkDrawer';
import { useSwarmStream } from '../../lib/hooks/useSwarmStream';
import { useSwarmStore } from '../../lib/store/useSwarmStore';

export default function RouterPage() {
  useSwarmStream();
  const isForking = useSwarmStore(state => state.isForking);

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
