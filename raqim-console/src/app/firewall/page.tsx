'use client';
import { useState } from 'react';
import { MainLayout } from '../../components/Layout/MainLayout';
import { Shield, ShieldOff, AlertTriangle } from 'lucide-react';

const mockAgents = [
  { id: 'AX-901-DELTA', sector: 'Europ-West-1', status: 'SECURE_HANDSHAKE', uptime: '42d 11h 09m' },
  { id: 'KR-442-OMEGA', sector: 'Asia-East-2', status: 'ISOLATED', uptime: '0d 00h 14m' },
  { id: 'US-110-SIGMA', sector: 'US-Central-1', status: 'PAYLOAD_REJECT', uptime: '0d 02h 44m' },
  { id: 'AX-902-DELTA', sector: 'Europ-West-1', status: 'SECURE_HANDSHAKE', uptime: '42d 11h 05m' }
];

export default function FirewallPage() {
  const [agents, setAgents] = useState(mockAgents);

  const liftQuarantine = async (agentId: string) => {
    try {
      // POST /v1/admin/quarantine/lift
      await fetch('/api/admin/quarantine/lift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId })
      });
      // Mock UI update
      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'SECURE_HANDSHAKE' } : a));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <MainLayout title="AEGIS CONTROL">
       <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24, height: '100%', overflowY: 'auto' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
             <div style={{ background: 'var(--bg-surface)', padding: 24, border: '1px solid var(--border-dim)' }}>
                 <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 12 }}>QUARANTINED</div>
                 <div style={{ fontSize: 32, fontWeight: 600, color: 'var(--alert-red)' }}>3</div>
                 <div style={{ fontSize: 10, color: 'var(--alert-red)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                    <AlertTriangle size={12}/> Critical action required
                 </div>
             </div>
             <div style={{ background: 'var(--bg-surface)', padding: 24, border: '1px solid var(--border-dim)' }}>
                 <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 12 }}>INTERCEPT RATE</div>
                 <div style={{ fontSize: 32, fontWeight: 600, color: 'var(--text-primary)' }}>99.9%</div>
                 <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>Based on heuristics engine</div>
             </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'var(--font-mono)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-dim)', color: 'var(--text-secondary)', fontSize: 10, letterSpacing: 1 }}>
                <th style={{ padding: '16px 24px' }}>AGENT ID</th>
                <th>SECTOR</th>
                <th>PROTOCOL STATUS</th>
                <th>UPTIME</th>
                <th style={{ textAlign: 'right', paddingRight: 24 }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent, i) => {
                 const isIsolated = agent.status === 'ISOLATED' || agent.status === 'PAYLOAD_REJECT';
                 
                 return (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-dim)', background: isIsolated ? 'rgba(255, 59, 48, 0.05)' : 'transparent' }}>
                    <td style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                       <div style={{ width: 8, height: 8, borderRadius: '50%', background: isIsolated ? 'var(--alert-red)' : 'var(--success-green)' }} />
                       {agent.id}
                    </td>
                    <td style={{ fontSize: 12 }}>{agent.sector}</td>
                    <td>
                      <div style={{ display: 'inline-block', padding: '4px 8px', border: `1px solid ${isIsolated ? 'rgba(255,59,48,0.3)' : 'rgba(52,199,89,0.3)'}`, color: isIsolated ? 'var(--alert-red)' : 'var(--success-green)', fontSize: 10, borderRadius: 2 }}>
                        {agent.status}
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>{agent.uptime}</td>
                    <td style={{ textAlign: 'right', paddingRight: 24 }}>
                      <button style={{ padding: '6px 12px', fontSize: 10, border: '1px solid var(--border-dim)', color: 'var(--text-primary)', marginLeft: 8 }}>INSPECT</button>
                      {isIsolated && (
                        <button 
                          onClick={() => liftQuarantine(agent.id)}
                          style={{ padding: '6px 12px', fontSize: 10, border: '1px solid var(--alert-red)', color: 'var(--alert-red)', marginLeft: 8, background: 'rgba(255, 59, 48, 0.05)' }}>
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
    </MainLayout>
  );
}
