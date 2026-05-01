'use client';
import { MainLayout } from '../../components/Layout/MainLayout';
import { useSwarmStore, AegisRecord } from '../../lib/store/useSwarmStore';
import { useMemo, useState, useEffect, useRef } from 'react';
import { LiftQuarantineModal } from '../../components/Firewall/LiftQuarantineModal';

export default function FirewallPage() {
  const aegisAlerts = useSwarmStore(state => state.aegisAlerts);
  const quarantinedAgents = useSwarmStore(state => state.quarantinedAgents);
  const liftQuarantine = useSwarmStore(state => state.liftQuarantine);

  const [selectedAgentHex, setSelectedAgentHex] = useState<string | null>(null);
  const [modalAgent, setModalAgent] = useState<string | null>(null);
  const [radarPing, setRadarPing] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Derived metrics
  const now = Date.now();
  const totalQuarantined = quarantinedAgents.length;
  const recentInterdictions = aegisAlerts.filter(a => now - a.timestamp < 3600000).length;
  const signatureSpoofs = aegisAlerts.filter(a => a.violation_type === 'CRYPTO_SPOOF').length;
  const namespaceViolations = aegisAlerts.filter(a => a.violation_type === 'NAMESPACE_BREACH').length;

  // Selected Record
  const selectedRecord = useMemo(() => {
    if (!selectedAgentHex) return null;
    // Find latest alert for this agent
    return [...aegisAlerts].reverse().find(a => a.agent_hex === selectedAgentHex) || null;
  }, [selectedAgentHex, aegisAlerts]);

  // Unique Blocklist from quarantined agents
  const blocklist = useMemo(() => {
    return quarantinedAgents.map(hex => {
      const latestAlert = [...aegisAlerts].reverse().find(a => a.agent_hex === hex);
      return latestAlert;
    }).filter(Boolean) as AegisRecord[];
  }, [quarantinedAgents, aegisAlerts]);

  // Terminal Auto-scroll
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aegisAlerts]);

  // Radar Ping Effect
  useEffect(() => {
    if (aegisAlerts.length > 0) {
      setRadarPing(true);
      const timer = setTimeout(() => setRadarPing(false), 500);
      return () => clearTimeout(timer);
    }
  }, [aegisAlerts]);

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return `[${d.toTimeString().split(' ')[0]}.${d.getMilliseconds().toString().padStart(3, '0')}]`;
  };

  const getViolationColor = (type: string) => {
    if (type === 'CRYPTO_SPOOF') return 'text-error bg-error/10 border-error/30';
    if (type === 'NAMESPACE_BREACH') return 'text-[#ffb300] bg-[#ffb300]/10 border-[#ffb300]/30';
    return 'text-secondary bg-secondary/10 border-secondary/30';
  };

  return (
    <MainLayout title="Aegis Firewall">
      <style>
        {`
          @keyframes radarSpin {
            100% { transform: rotate(360deg); }
          }
          @keyframes radarFlash {
            0% { opacity: 0; transform: scale(0.8); }
            50% { opacity: 0.8; transform: scale(1); box-shadow: inset 0 0 50px rgba(255,0,0,0.5); }
            100% { opacity: 0; transform: scale(1.1); }
          }
        `}
      </style>
      <div className="flex-1 p-6 overflow-hidden min-h-0 bg-zinc-950">
        <div className="grid grid-cols-12 gap-6 h-full">
          
          {/* ── Left Column (8/12): Operational Pane ── */}
          <div className="col-span-8 flex flex-col gap-6 h-full min-h-0">
            
            {/* Top 4 Metric Cards */}
            <div className="grid grid-cols-4 gap-4 shrink-0">
              <div className="bg-zinc-900 border border-zinc-800 p-4 flex flex-col gap-2">
                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Total Quarantined</span>
                <span className="font-mono text-3xl font-bold text-error drop-shadow-[0_0_8px_rgba(255,0,0,0.5)]">{totalQuarantined}</span>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-4 flex flex-col gap-2">
                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Recent Interdictions</span>
                <span className="font-mono text-3xl font-bold text-white">{recentInterdictions}</span>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-4 flex flex-col gap-2">
                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Signature Spoofs</span>
                <span className="font-mono text-3xl font-bold text-error drop-shadow-[0_0_8px_rgba(255,0,0,0.5)]">{signatureSpoofs}</span>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-4 flex flex-col gap-2">
                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Namespace Breaches</span>
                <span className="font-mono text-3xl font-bold text-[#ffb300] drop-shadow-[0_0_8px_rgba(255,179,0,0.5)]">{namespaceViolations}</span>
              </div>
            </div>

            {/* Quarantine Blocklist Table */}
            <div className="flex-1 bg-zinc-900 border border-zinc-800 flex flex-col min-h-0 overflow-hidden">
              <div className="bg-zinc-950 px-4 py-2 border-b border-zinc-800">
                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">table_rows</span>
                  Quarantine Blocklist
                </span>
              </div>
              
              <div className="grid grid-cols-12 px-4 py-2 border-b border-zinc-800 bg-zinc-900 shrink-0">
                <div className="col-span-3 font-mono text-[9px] text-zinc-500 uppercase tracking-widest">Agent Hex</div>
                <div className="col-span-3 font-mono text-[9px] text-zinc-500 uppercase tracking-widest">Violation</div>
                <div className="col-span-3 font-mono text-[9px] text-zinc-500 uppercase tracking-widest">Target Path</div>
                <div className="col-span-3 font-mono text-[9px] text-zinc-500 uppercase tracking-widest text-right">Action</div>
              </div>

              <div className="flex-1 overflow-y-auto bg-zinc-950">
                {blocklist.length === 0 ? (
                   <div className="flex items-center justify-center h-full">
                     <span className="font-mono text-xs text-zinc-600 uppercase tracking-widest animate-pulse">No Active Quarantines</span>
                   </div>
                ) : (
                  blocklist.map(record => (
                    <div 
                      key={record.agent_hex}
                      onClick={() => setSelectedAgentHex(record.agent_hex)}
                      className={`grid grid-cols-12 px-4 py-3 border-b border-zinc-800/50 cursor-pointer transition-colors ${selectedAgentHex === record.agent_hex ? 'bg-zinc-900 border-l-2 border-l-[#00f3ff]' : 'hover:bg-zinc-900 border-l-2 border-l-transparent'}`}
                    >
                      <div className="col-span-3 font-mono text-xs text-[#00f3ff] flex items-center">{record.agent_hex}</div>
                      <div className="col-span-3 flex items-center">
                        <span className={`font-mono text-[9px] px-2 py-0.5 border ${getViolationColor(record.violation_type)}`}>
                          {record.violation_type}
                        </span>
                      </div>
                      <div className="col-span-3 font-mono text-xs text-zinc-300 flex items-center truncate pr-2">{record.attempted_path}</div>
                      <div className="col-span-3 flex justify-end items-center">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setModalAgent(record.agent_hex); }}
                          className="font-mono text-[9px] text-error border border-error/50 hover:bg-error/20 px-2 py-1 uppercase tracking-widest transition-colors"
                        >
                          Lift Quarantine
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Live Rejection Stream */}
            <div className="h-64 bg-black border border-zinc-800 shrink-0 flex flex-col overflow-hidden">
              <div className="bg-zinc-950 px-4 py-1 border-b border-zinc-800 flex items-center justify-between">
                <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[12px]">terminal</span>
                  Stdout Logs
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse shadow-[0_0_5px_rgba(255,0,0,0.8)]"></span>
              </div>
              <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] leading-relaxed break-all">
                {aegisAlerts.length === 0 ? (
                  <span className="text-zinc-700">Listening on port 0.0.0.0...</span>
                ) : (
                  aegisAlerts.map((alert, idx) => (
                    <div key={`${alert.timestamp}-${idx}`} className="mb-1">
                      <span className="text-zinc-500">{formatTimestamp(alert.timestamp)}</span>
                      <span className="text-error ml-2">[AEGIS_DROP]</span>
                      <span className="text-[#00f3ff] ml-2">{alert.violation_type}</span>
                      <span className="text-zinc-300 ml-2">from {alert.agent_hex} on path {alert.attempted_path}.</span>
                    </div>
                  ))
                )}
                <div ref={terminalEndRef} />
              </div>
            </div>

          </div>

          {/* ── Right Column (4/12): Threat & Inspector Pane ── */}
          <div className="col-span-4 flex flex-col gap-6 h-full min-h-0">
            
            {/* Threat Radar Visual */}
            <div className="h-64 bg-zinc-900 border border-zinc-800 shrink-0 relative overflow-hidden flex flex-col">
              <div className="bg-zinc-950 px-4 py-2 border-b border-zinc-800 z-10 absolute top-0 w-full flex justify-between">
                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">radar</span>
                  Threat Radar
                </span>
              </div>
              <div className="flex-1 relative flex items-center justify-center pt-8 bg-zinc-950 overflow-hidden">
                {/* SVG Radar Grid */}
                <svg width="100%" height="100%" viewBox="0 0 200 200" className="opacity-50">
                  <defs>
                    <pattern id="radarGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <rect width="20" height="20" fill="none" stroke="#27272a" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#radarGrid)" />
                  <circle cx="100" cy="100" r="40" fill="none" stroke="#00f3ff" strokeWidth="0.5" strokeDasharray="4 4"/>
                  <circle cx="100" cy="100" r="80" fill="none" stroke="#00f3ff" strokeWidth="0.5" />
                  {/* Spinning Line */}
                  <line x1="100" y1="100" x2="100" y2="20" stroke="#00f3ff" strokeWidth="1" className="origin-center" style={{ animation: 'radarSpin 4s linear infinite' }}/>
                </svg>
                {/* Red Kinetic Wave on Alert */}
                {radarPing && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-full rounded-full border border-error bg-error/10" style={{ animation: 'radarFlash 0.5s ease-out forwards' }}></div>
                  </div>
                )}
              </div>
            </div>

            {/* Inspector Panel */}
            <div className="flex-1 bg-zinc-900 border border-zinc-800 flex flex-col min-h-0 overflow-hidden">
              <div className="bg-zinc-950 px-4 py-2 border-b border-zinc-800 shrink-0">
                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">policy</span>
                  Inspector Panel
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {!selectedRecord ? (
                  <div className="h-full flex items-center justify-center">
                    <span className="font-mono text-xs text-zinc-600 tracking-widest uppercase text-center">Select a quarantined node<br/>to view forensics</span>
                  </div>
                ) : (
                  <>
                    <div>
                      <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">Agent Hex</span>
                      <span className="font-mono text-sm text-[#00f3ff] break-all">{selectedRecord.agent_hex}</span>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">Violation</span>
                      <span className={`font-mono text-[10px] px-2 py-0.5 border inline-block ${getViolationColor(selectedRecord.violation_type)}`}>
                        {selectedRecord.violation_type}
                      </span>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">Time of Death</span>
                      <span className="font-mono text-xs text-zinc-300">{formatTimestamp(selectedRecord.timestamp)}</span>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">Attempted Path</span>
                      <span className="font-mono text-xs text-zinc-300">{selectedRecord.attempted_path}</span>
                    </div>
                    <div className="flex-1 flex flex-col min-h-0 mt-2">
                      <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block mb-2">Payload Preview</span>
                      <div className="flex-1 bg-zinc-950 border border-error/30 p-3 rounded-sm overflow-auto text-error font-mono text-[11px] whitespace-pre shadow-[inset_0_0_10px_rgba(255,0,0,0.1)]">
                        {selectedRecord.payload_preview}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
      
      <LiftQuarantineModal 
        isOpen={!!modalAgent} 
        agentHex={modalAgent || ''} 
        onClose={() => setModalAgent(null)} 
        onConfirm={() => {
          if (modalAgent) {
            liftQuarantine(modalAgent);
            if (selectedAgentHex === modalAgent) {
              setSelectedAgentHex(null);
            }
          }
        }} 
      />
    </MainLayout>
  );
}
