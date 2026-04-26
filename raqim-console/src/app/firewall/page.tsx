'use client';
import { useState } from 'react';
import { MainLayout } from '../../components/Layout/MainLayout';
import { AlertTriangle, ShieldOff, Server } from 'lucide-react';

const mockAgents = [
  { id: 'AX-901-DELTA', sector: 'Europ-West-1', status: 'SECURE_HANDSHAKE', uptime: '42d 11h 09m' },
  { id: 'KR-442-OMEGA', sector: 'Asia-East-2', status: 'ISOLATED', uptime: '0d 00h 14m' },
  { id: 'US-110-SIGMA', sector: 'US-Central-1', status: 'PAYLOAD_REJECT', uptime: '0d 02h 44m' },
  { id: 'AX-902-DELTA', sector: 'Europ-West-1', status: 'SECURE_HANDSHAKE', uptime: '42d 11h 05m' },
  { id: 'BR-771-ALPHA', sector: 'SA-East-1', status: 'SECURE_HANDSHAKE', uptime: '12d 04h 22m' }
];

export default function FirewallPage() {
  const [agents, setAgents] = useState(mockAgents);

  const liftQuarantine = async (agentId: string) => {
    try {
      await fetch('/api/admin/quarantine/lift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId })
      });
      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'SECURE_HANDSHAKE' } : a));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <MainLayout title="AEGIS CONTROL">
       <div className="p-8 flex flex-col gap-6 h-full overflow-y-auto">
          
          <div className="grid grid-cols-4 gap-4">
             <div className="bg-surface p-6 border border-white/5 rounded">
                 <div className="text-[10px] text-muted-DEFAULT tracking-widest mb-3 flex items-center justify-between">ACTIVE NODES <Server size={14}/></div>
                 <div className="text-3xl font-bold text-white mb-2 font-mono">1,024</div>
                 <div className="text-[10px] text-neon-cyan flex items-center gap-1 font-mono">
                    ↗ +12 from last cycle
                 </div>
             </div>
             <div className="bg-surface p-6 border border-red-500/20 rounded shadow-[inset_0_0_20px_rgba(255,59,48,0.05)]">
                 <div className="text-[10px] text-muted-DEFAULT tracking-widest mb-3 flex items-center justify-between">QUARANTINED <ShieldOff size={14} className="text-red-500"/></div>
                 <div className="text-3xl font-bold text-red-500 mb-2 font-mono">3</div>
                 <div className="text-[10px] text-red-500 flex items-center gap-1">
                    <AlertTriangle size={12}/> Critical action required
                 </div>
             </div>
             <div className="bg-surface p-6 border border-white/5 rounded">
                 <div className="text-[10px] text-muted-DEFAULT tracking-widest mb-3 flex items-center justify-between">INTERCEPT RATE</div>
                 <div className="text-3xl font-bold text-white mb-2 font-mono">99.9%</div>
                 <div className="text-[10px] text-muted-DEFAULT">Based on heuristics engine</div>
             </div>
             <div className="bg-surface p-6 border border-white/5 rounded">
                 <div className="text-[10px] text-muted-DEFAULT tracking-widest mb-3 flex items-center justify-between">PACKET DROP</div>
                 <div className="text-3xl font-bold text-white mb-2 font-mono">0.04%</div>
                 <div className="text-[10px] text-green-500 flex items-center gap-1">
                    ● Normal operational bounds
                 </div>
             </div>
          </div>

          <div className="bg-surface border border-white/5 rounded overflow-hidden mt-4 flex-1 flex flex-col">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-muted-DEFAULT tracking-[1.5px] bg-panel">
                  <th className="py-4 px-6 font-semibold">AGENT ID</th>
                  <th className="font-semibold">SECTOR</th>
                  <th className="font-semibold">PROTOCOL STATUS</th>
                  <th className="font-semibold">UPTIME</th>
                  <th className="text-right pr-6 font-semibold">ACTION</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                {agents.map((agent, i) => {
                  const isIsolated = agent.status === 'ISOLATED' || agent.status === 'PAYLOAD_REJECT';
                  
                  return (
                    <tr key={i} className={`border-b border-white/5 ${isIsolated ? 'bg-red-500/5' : 'hover:bg-white/[0.02]'}`}>
                      <td className="py-4 px-6 flex items-center gap-4 text-white">
                        <div className={`w-2 h-2 rounded-full ${isIsolated ? 'bg-red-500 shadow-[0_0_8px_rgba(255,59,48,0.8)]' : 'bg-green-500 shadow-[0_0_8px_rgba(52,199,89,0.8)]'}`} />
                        {agent.id}
                      </td>
                      <td className="text-muted-DEFAULT">{agent.sector}</td>
                      <td>
                        <div className={`inline-block px-2 py-1 text-[10px] tracking-wider rounded-sm border ${isIsolated ? 'border-red-500/30 text-red-500 bg-red-500/10' : 'border-green-500/30 text-green-500 bg-green-500/10'}`}>
                          {agent.status}
                        </div>
                      </td>
                      <td className="text-muted-DEFAULT">{agent.uptime}</td>
                      <td className="text-right pr-6">
                        <button className="px-4 py-1.5 text-[10px] font-sans font-bold tracking-wider border border-white/10 text-white rounded hover:bg-white/10 transition-colors ml-2">
                          INSPECT
                        </button>
                        {isIsolated && (
                          <button 
                            onClick={() => liftQuarantine(agent.id)}
                            className="px-4 py-1.5 text-[10px] font-sans font-bold tracking-wider border border-red-500/50 text-red-500 rounded bg-red-500/10 hover:bg-red-500 hover:text-obsidian transition-colors ml-2 shadow-[0_0_10px_rgba(255,59,48,0.2)]">
                            LIFT QUARANTINE
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

       </div>
    </MainLayout>
  );
}
