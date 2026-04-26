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
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="flex-1 flex overflow-hidden p-6 gap-6">
          {/* State Inspector (Main Panel) */}
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="bg-secondary/20 text-secondary px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                  Healthy
                </span>
                <span className="text-on-surface-variant font-mono text-xs">TX_ID: <span className="text-primary-fixed-dim">0x8F9A...2C4B</span></span>
              </div>
            </div>
            
            {/* The DAG Canvas container */}
            <div className="flex-1 relative min-h-[300px] border border-outline-variant/15 rounded-lg overflow-hidden bg-surface-container-lowest ghost-border">
               <div className="absolute inset-0 pointer-events-auto z-10">
                 <DagCanvas />
               </div>
            </div>
            
            {/* Bento Grid for State */}
            <div className="grid grid-cols-2 gap-4 shrink-0">
              {/* Entropy Monitor */}
              <div className="bg-surface-container rounded-lg p-5 flex flex-col relative overflow-hidden group ghost-border">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-container-high/50 pointer-events-none"></div>
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <h3 className="text-xs font-label uppercase tracking-[0.05rem] text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">waves</span> System Entropy
                  </h3>
                  <span className="material-symbols-outlined text-tertiary text-sm">warning</span>
                </div>
                <div className="flex items-end gap-3 relative z-10">
                  <span className="font-headline text-4xl font-bold text-white leading-none">8.442</span>
                  <span className="font-mono text-xs text-tertiary pb-1">nats/symbol</span>
                </div>
                <div className="mt-4 h-12 w-full bg-surface-container-lowest rounded relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 h-full w-[84%] bg-tertiary/20 border-r border-tertiary"></div>
                  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <polyline className="text-tertiary/50" fill="none" points="0,80 20,60 40,75 60,30 80,45 100,10" stroke="currentColor" strokeWidth="1"></polyline>
                  </svg>
                </div>
              </div>
              
              {/* Network Mesh */}
              <div className="bg-surface-container rounded-lg p-5 flex flex-col relative overflow-hidden ghost-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-label uppercase tracking-[0.05rem] text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">lan</span> Network Mesh
                  </h3>
                  <span className="text-[10px] font-mono text-primary-fixed-dim">Active</span>
                </div>
                <div className="flex flex-col gap-3 font-mono text-sm">
                  <div className="flex justify-between items-center border-b border-outline-variant/15 pb-2">
                    <span className="text-on-surface-variant">Peers</span>
                    <span className="text-white">1,024</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-outline-variant/15 pb-2">
                    <span className="text-on-surface-variant">Throughput</span>
                    <span className="text-white">4.2 GB/s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface-variant">Latency</span>
                    <span className="text-secondary">12ms</span>
                  </div>
                </div>
              </div>
              
              {/* Memory Allocation (Full width) */}
              <div className="bg-surface-container rounded-lg p-5 flex flex-col col-span-2 relative overflow-hidden ghost-border">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-label uppercase tracking-[0.05rem] text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">database</span> Memory Allocation Matrix
                  </h3>
                  <button className="text-[10px] uppercase font-mono border border-outline-variant/30 px-2 py-1 rounded text-on-surface-variant hover:text-white hover:bg-surface-container-highest transition-colors">Flush Cache</button>
                </div>
                <div className="font-mono text-xs overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-on-surface-variant uppercase tracking-wider text-[10px] bg-surface-container-high">
                        <th className="py-2 px-3 font-normal rounded-tl">Sector ID</th>
                        <th className="py-2 px-3 font-normal">Process</th>
                        <th className="py-2 px-3 font-normal">Allocated</th>
                        <th className="py-2 px-3 font-normal rounded-tr">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-on-surface">
                      <tr className="hover:bg-surface-container-low transition-colors">
                        <td className="py-2 px-3 border-b border-outline-variant/5 text-primary-fixed-dim">0x00A1</td>
                        <td className="py-2 px-3 border-b border-outline-variant/5">kernel_ops</td>
                        <td className="py-2 px-3 border-b border-outline-variant/5">128 MB</td>
                        <td className="py-2 px-3 border-b border-outline-variant/5"><span className="text-secondary">LOCKED</span></td>
                      </tr>
                      <tr className="hover:bg-surface-container-low transition-colors">
                        <td className="py-2 px-3 border-b border-outline-variant/5 text-primary-fixed-dim">0x00A2</td>
                        <td className="py-2 px-3 border-b border-outline-variant/5">router_daemon</td>
                        <td className="py-2 px-3 border-b border-outline-variant/5">512 MB</td>
                        <td className="py-2 px-3 border-b border-outline-variant/5"><span className="text-secondary">LOCKED</span></td>
                      </tr>
                      <tr className="hover:bg-surface-container-low transition-colors">
                        <td className="py-2 px-3 border-b border-outline-variant/5 text-primary-fixed-dim">0x00B5</td>
                        <td className="py-2 px-3 border-b border-outline-variant/5">reality_engine</td>
                        <td className="py-2 px-3 border-b border-outline-variant/5 text-tertiary">1.2 GB</td>
                        <td className="py-2 px-3 border-b border-outline-variant/5"><span className="text-tertiary">VOLATILE</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          
          <RealityForkDrawer />
        </div>
        
        <NLEScrubber />
      </div>
    </MainLayout>
  );
}
