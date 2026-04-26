'use client';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Key, Activity, Clock, Server } from 'lucide-react';

export default function TopologyPage() {
  return (
    <MainLayout title="Cloud Orchestration">
       <div className="p-8 flex flex-col gap-6 h-full overflow-y-auto">
          
          <div className="flex justify-between items-start">
             <div>
                <h2 className="text-[10px] text-muted-DEFAULT tracking-[2px] font-mono mb-2 uppercase">Active Tenant ID</h2>
                <div className="text-xl font-mono text-neon-cyan bg-neon-cyan/5 border border-neon-cyan/20 px-4 py-2 rounded shadow-[inset_0_0_10px_rgba(102,252,241,0.1)] inline-block">
                   TN-88A9-FX24-PRD
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-4">
             {/* License Authority */}
             <div className="bg-surface border border-neon-cyan/30 rounded p-8 shadow-[0_0_30px_rgba(102,252,241,0.05)] flex flex-col justify-between">
                <div>
                   <h3 className="text-lg font-bold flex items-center gap-3 mb-4"><Key className="text-neon-cyan" /> License Authority</h3>
                   <p className="text-sm text-muted-DEFAULT leading-relaxed max-w-md">
                     Generate ephemeral JSON Web Tokens for agent nodes. Keys expire in 24 hours by default.
                   </p>
                </div>
                <div className="mt-8">
                   <div className="flex bg-panel border border-white/10 rounded overflow-hidden mb-4 p-1">
                      <div className="flex-1 px-4 py-3 text-xs font-mono text-muted-DEFAULT flex items-center">
                         PAYLOAD_ENV:
                      </div>
                      <div className="px-6 py-3 bg-obsidian text-white text-xs font-bold font-mono border border-white/5 rounded">
                         PRODUCTION
                      </div>
                   </div>
                   <button className="w-full py-4 bg-neon-cyan text-obsidian font-bold tracking-[1px] rounded hover:shadow-[0_0_20px_rgba(102,252,241,0.5)] transition-shadow">
                      GENERATE JWT LICENSE KEY
                   </button>
                </div>
             </div>

             {/* Billing & Usage */}
             <div className="bg-surface border border-white/5 rounded p-8 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                   <h3 className="text-lg font-bold flex items-center gap-3"><Server className="text-white" /> Billing & Usage</h3>
                   <div className="px-3 py-1 bg-white/5 border border-white/10 text-[10px] font-mono text-muted-DEFAULT rounded">ENTERPRISE TIER</div>
                </div>
                
                <div className="flex gap-16 mt-8 mb-12">
                   <div>
                      <div className="text-[10px] text-muted-DEFAULT tracking-widest mb-2 font-mono">CURRENT CYCLE</div>
                      <div className="text-4xl font-bold font-mono tracking-tight">$4,290<span className="text-xl text-muted-DEFAULT">.00</span></div>
                   </div>
                   <div>
                      <div className="text-[10px] text-muted-DEFAULT tracking-widest mb-2 font-mono">FORECAST</div>
                      <div className="text-4xl font-bold font-mono tracking-tight text-muted-DEFAULT">$5,100<span className="text-xl">.00</span></div>
                   </div>
                </div>

                <div>
                   <div className="flex justify-between text-xs text-muted-DEFAULT mb-2 font-mono">
                      <span>Compute Allocation</span>
                      <span className="text-white">78%</span>
                   </div>
                   <div className="h-2 w-full bg-panel rounded-full overflow-hidden">
                      <div className="h-full bg-neon-cyan w-[78%] rounded-full shadow-[0_0_10px_rgba(102,252,241,0.5)]"></div>
                   </div>
                   <div className="text-right mt-4">
                      <button className="text-xs font-bold tracking-wider hover:text-neon-cyan transition-colors">MANAGE SUBSCRIPTION →</button>
                   </div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-2">
             {/* A2A Throughput */}
             <div className="bg-surface border border-white/5 rounded p-6">
                <div className="flex justify-between items-start mb-6">
                   <div className="text-xs font-bold tracking-widest text-muted-DEFAULT flex items-center gap-2">
                      <Activity size={14} /> A2A MESSAGE THROUGHPUT
                   </div>
                   <div className="text-[11px] font-mono text-green-500 flex items-center gap-1">↗ 12.4%</div>
                </div>
                <div className="text-4xl font-mono font-bold mb-2">842,901,114</div>
                <div className="text-[10px] text-muted-DEFAULT font-mono tracking-widest uppercase">Global Events / 24h</div>
                
                {/* Mock Chart Area */}
                <div className="h-24 mt-6 flex items-end gap-2 opacity-50">
                   {[40, 50, 30, 70, 60, 40, 90, 80, 100].map((h, i) => (
                      <div key={i} className={`flex-1 rounded-sm ${i === 8 ? 'bg-neon-cyan shadow-[0_0_10px_rgba(102,252,241,0.5)]' : 'bg-white/10'}`} style={{ height: `${h}%` }}></div>
                   ))}
                </div>
             </div>

             {/* Time Travel Operations */}
             <div className="bg-surface border border-white/5 rounded p-6">
                <div className="flex justify-between items-start mb-6">
                   <div className="text-xs font-bold tracking-widest text-muted-DEFAULT flex items-center gap-2">
                      <Clock size={14} /> TIME TRAVEL OPERATIONS
                   </div>
                   <div className="text-[11px] font-mono text-neon-amber flex items-center gap-1">▲ High Load</div>
                </div>
                <div className="text-4xl font-mono font-bold mb-2">4,209<span className="text-xl text-muted-DEFAULT">.ms</span></div>
                <div className="text-[10px] text-muted-DEFAULT font-mono tracking-widest uppercase">Avg Query Latency</div>
                
                {/* Mock Chart Area */}
                <div className="h-24 mt-6 flex flex-col justify-end gap-1 opacity-50">
                   {[10, 30, 20, 50, 40, 80, 60, 90].map((w, i) => (
                      <div key={i} className={`h-2 rounded-sm ${i > 4 ? 'bg-neon-amber shadow-[0_0_10px_rgba(255,193,7,0.5)]' : 'bg-white/10'}`} style={{ width: `${w}%` }}></div>
                   ))}
                </div>
             </div>
          </div>

       </div>
    </MainLayout>
  );
}
