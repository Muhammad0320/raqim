'use client';
import { useState } from 'react';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Database, Filter } from 'lucide-react';

const mockVaultData = [
  { ts: '2024-10-27T08:14:02.112Z', txId: '0x8f92a1b4c', ns: 'agent_memory_core', op: 'UPSERT', vec: '1,024', lat: '14.2', status: 'OK' },
  { ts: '2024-10-27T08:13:45.009Z', txId: '0x7a31b99f0', ns: 'client_auth_logs', op: 'QUERY', vec: '-', lat: '4.8', status: 'OK' },
  { ts: '2024-10-27T08:11:12.881Z', txId: '0x4c22d11e8', ns: 'threat_intel_feed', op: 'UPSERT', vec: '50,000', lat: '145.0', status: 'WARN' },
  { ts: '2024-10-27T08:05:33.410Z', txId: '0x9e10f88a2', ns: 'agent_memory_core', op: 'DELETE', vec: '12', lat: '8.1', status: 'OK' },
  { ts: '2024-10-27T08:01:05.992Z', txId: '0x1b44c77d9', ns: 'user_embeddings_v3', op: 'UPSERT', vec: '512', lat: '11.3', status: 'OK' },
  { ts: '2024-10-27T07:55:22.001Z', txId: '0x88a1b22c0', ns: 'sys_kernel_cache', op: 'QUERY', vec: '-', lat: 'timeout', status: 'FAIL' },
];

export default function VaultPage() {
  const [data] = useState(mockVaultData);

  return (
    <MainLayout title="Audit Vault">
       <div className="p-8 flex flex-col gap-6 h-full overflow-hidden">
          
          <div className="flex justify-between items-end">
             <div>
                <div className="text-[11px] font-mono tracking-widest text-muted-DEFAULT uppercase">LANCEDB SEMANTIC HISTORY • IMMUTABLE RECORD</div>
             </div>
             <div className="flex gap-12 text-right">
                <div>
                   <div className="text-[10px] text-muted-DEFAULT tracking-widest font-mono mb-1">TOTAL VECTORS</div>
                   <div className="text-2xl font-bold font-mono text-white">14,892,041</div>
                </div>
                <div>
                   <div className="text-[10px] text-muted-DEFAULT tracking-widest font-mono mb-1">CLUSTER STATUS</div>
                   <div className="inline-block px-2 py-1 text-[10px] font-mono border border-green-500/30 text-green-500 bg-green-500/10 rounded-sm">● NOMINAL</div>
                </div>
             </div>
          </div>

          <div className="bg-panel border border-white/5 rounded p-6 flex items-end gap-4 shrink-0">
             <div className="flex-1">
                <label className="block text-[10px] text-muted-DEFAULT tracking-widest font-mono mb-2">NAMESPACE</label>
                <input type="text" placeholder="🔍 e.g. agent_memory_core" className="w-full bg-surface border border-white/10 p-3 rounded text-sm text-white focus:border-neon-cyan outline-none font-mono placeholder:text-white/20 transition-colors" />
             </div>
             <div className="flex-1">
                <label className="block text-[10px] text-muted-DEFAULT tracking-widest font-mono mb-2">TRANSACTION ID (TX_ID)</label>
                <input type="text" placeholder="# Hex identifier..." className="w-full bg-surface border border-white/10 p-3 rounded text-sm text-white focus:border-neon-cyan outline-none font-mono placeholder:text-white/20 transition-colors" />
             </div>
             <div className="flex-1">
                <label className="block text-[10px] text-muted-DEFAULT tracking-widest font-mono mb-2">OPERATION TYPE</label>
                <select className="w-full bg-surface border border-white/10 p-3 rounded text-sm text-white focus:border-neon-cyan outline-none font-mono appearance-none transition-colors">
                   <option>ALL_OPERATIONS</option>
                   <option>UPSERT</option>
                   <option>QUERY</option>
                   <option>DELETE</option>
                </select>
             </div>
             <button className="px-6 py-3 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan font-bold tracking-wider rounded hover:bg-neon-cyan hover:text-obsidian transition-colors flex items-center gap-2">
               <Filter size={16} /> Execute Filter
             </button>
          </div>

          <div className="bg-surface border border-white/5 rounded overflow-hidden flex-1 flex flex-col">
            <div className="overflow-auto flex-1">
               <table className="w-full text-left border-collapse whitespace-nowrap">
                 <thead>
                   <tr className="border-b border-white/5 text-[10px] text-muted-DEFAULT tracking-[1.5px] bg-panel sticky top-0 z-10">
                     <th className="py-4 px-6 font-semibold">TIMESTAMP (UTC)</th>
                     <th className="font-semibold">TX_ID</th>
                     <th className="font-semibold">NAMESPACE</th>
                     <th className="font-semibold">OPERATION</th>
                     <th className="font-semibold text-right">VECTORS</th>
                     <th className="font-semibold text-right">LATENCY (MS)</th>
                     <th className="font-semibold text-center">STATUS</th>
                     <th className="font-semibold text-right pr-6">ACTION</th>
                   </tr>
                 </thead>
                 <tbody className="font-mono text-[11px]">
                   {data.map((row, i) => {
                     let statusColor = 'text-green-500 border-green-500/30 bg-green-500/10';
                     let rowStyle = 'hover:bg-white/[0.02]';
                     
                     if (row.status === 'WARN') {
                        statusColor = 'text-neon-amber border-neon-amber/30 bg-neon-amber/10';
                     } else if (row.status === 'FAIL') {
                        statusColor = 'text-red-500 border-red-500/30 bg-red-500/10';
                        rowStyle = 'bg-red-500/5 hover:bg-red-500/10 text-red-400';
                     }

                     let opColor = 'text-white';
                     if (row.op === 'UPSERT') opColor = 'text-green-500';
                     if (row.op === 'QUERY') opColor = 'text-neon-cyan';
                     if (row.op === 'DELETE') opColor = 'text-red-500';

                     return (
                       <tr key={i} className={`border-b border-white/5 transition-colors ${rowStyle}`}>
                         <td className="py-4 px-6 text-muted-DEFAULT">{row.ts}</td>
                         <td className="text-neon-cyan">{row.txId}</td>
                         <td className="text-white">{row.ns}</td>
                         <td className={opColor}>{row.op}</td>
                         <td className="text-right text-muted-DEFAULT">{row.vec}</td>
                         <td className={`text-right ${row.status === 'WARN' ? 'text-neon-amber' : row.status === 'FAIL' ? 'text-red-500' : 'text-white'}`}>{row.lat}</td>
                         <td className="text-center">
                           <div className={`inline-block px-2 py-0.5 text-[9px] tracking-wider rounded-sm border ${statusColor}`}>
                             {row.status}
                           </div>
                         </td>
                         <td className="text-right pr-6">
                           <button className="px-3 py-1 text-[9px] font-sans font-bold tracking-wider border border-white/10 text-white rounded hover:bg-white/10 transition-colors">
                             VIEW
                           </button>
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
            </div>
            
            <div className="bg-panel border-t border-white/5 p-4 px-6 text-[10px] text-muted-DEFAULT font-mono flex justify-between items-center shrink-0">
               <span>Showing 6 of 14,892,041 events</span>
               <div className="flex gap-2">
                  <button className="w-8 h-8 flex items-center justify-center bg-surface border border-white/10 rounded hover:bg-white/5 transition-colors text-white">{'<'}</button>
                  <button className="w-8 h-8 flex items-center justify-center bg-surface border border-white/10 rounded hover:bg-white/5 transition-colors text-white">{'>'}</button>
               </div>
            </div>
          </div>

       </div>
    </MainLayout>
  );
}
