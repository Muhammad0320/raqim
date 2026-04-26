'use client';
import { MainLayout } from '../../components/Layout/MainLayout';
import { DagCanvas } from '../../components/DagCanvas/DagCanvas';
import { NLEScrubber } from '../../components/TimeMachine/NLEScrubber';
import { RealityForkDrawer } from '../../components/TimeMachine/RealityForkDrawer';
import { useSwarmStream } from '../../lib/hooks/useSwarmStream';

export default function RouterPage() {
  useSwarmStream();

  return (
    <MainLayout title="State Inspector">
      <div className="flex flex-col h-full w-full">
        <div className="flex flex-1 overflow-hidden w-full relative">
          
          <div className="flex-1 relative w-full h-full">
             {/* Stats Overlays */}
             <div className="absolute top-6 left-6 z-10 flex gap-6 pointer-events-none">
                <div className="bg-surface/80 backdrop-blur p-4 border border-white/5 rounded min-w-[160px]">
                   <div className="text-[10px] text-muted-DEFAULT tracking-widest mb-2 flex items-center justify-between">
                     SYSTEM ENTROPY <span className="text-neon-amber">▲</span>
                   </div>
                   <div className="text-3xl font-bold tracking-tight">
                     8.442 <span className="text-[11px] font-normal text-neon-amber font-mono tracking-wider ml-1">nats/symbol</span>
                   </div>
                </div>
                <div className="bg-surface/80 backdrop-blur p-4 border border-white/5 rounded min-w-[200px]">
                   <div className="text-[10px] text-muted-DEFAULT tracking-widest mb-3 flex items-center justify-between">
                     NETWORK MESH <span className="text-white">Active</span>
                   </div>
                   <div className="flex justify-between text-xs mb-1">
                     <span className="text-muted-DEFAULT font-semibold">Peers</span> <span className="font-mono text-white">1,024</span>
                   </div>
                   <div className="flex justify-between text-xs mb-1">
                     <span className="text-muted-DEFAULT font-semibold">Throughput</span> <span className="font-mono text-white">4.2 GB/s</span>
                   </div>
                   <div className="flex justify-between text-xs">
                     <span className="text-muted-DEFAULT font-semibold">Latency</span> <span className="font-mono text-green-500">12ms</span>
                   </div>
                </div>
             </div>
             
             {/* The React Flow Canvas requires the parent to have strict dimensions */}
             <div className="absolute inset-0 pointer-events-auto">
               <DagCanvas />
             </div>
          </div>

          <RealityForkDrawer />
        </div>

        <NLEScrubber />
      </div>
    </MainLayout>
  );
}
