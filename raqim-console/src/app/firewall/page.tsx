'use client';
import { useSwarmStore } from '../../lib/store/useSwarmStore';
import { useMemo } from 'react';

export default function FirewallPage() {
  const thoughts = useSwarmStore(state => state.thoughts);
  
  // Filter for rejected/anomalous thoughts
  const blocklist = useMemo(() => {
    return Object.values(thoughts)
      .filter(t => t.status === 'REJECTED')
      .slice(-10) // show last 10
      .reverse();
  }, [thoughts]);

  return (
    <div className="p-6 md:p-8 lg:p-12 max-w-[1600px] mx-auto flex flex-col gap-8 h-full">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="font-headline text-display-lg text-white font-bold tracking-tight text-4xl">AEGIS SUBSYSTEM</h1>
        <p className="text-on-surface-variant font-mono text-sm tracking-widest uppercase">Cryptographic Verification & Ingress Control</p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Ingress Stream (Terminal) */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-lg font-semibold text-white tracking-wide uppercase">Live Ingress Stream</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span className="font-mono text-[10px] text-secondary tracking-widest uppercase text-glow-secondary">Active</span>
            </div>
          </div>
          
          <div className="bg-surface-container-lowest rounded-lg ghost-border flex-1 min-h-[400px] flex flex-col overflow-hidden relative">
            <div className="bg-surface-container-highest px-4 py-2 flex items-center gap-4 border-b border-outline-variant/20">
              <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">http_ingress_endpoint</span>
              <span className="font-mono text-[10px] text-outline uppercase tracking-widest ml-auto">Tail -f</span>
            </div>
            <div className="p-4 font-mono text-xs leading-relaxed overflow-y-auto flex-1 text-on-surface-variant flex flex-col gap-2">
              <div className="flex items-start gap-4 hover:bg-surface-container-low p-1 transition-colors">
                <span className="text-outline">14:02:41.112</span>
                <div className="flex flex-col">
                  <span className="text-secondary">[VERIFIED]</span>
                  <span className="text-on-surface">POST /api/v1/telemetry payload_size=412B</span>
                  <span className="text-outline text-[10px]">Ed25519: sig_valid 0x7f...a92</span>
                </div>
              </div>
              <div className="flex items-start gap-4 hover:bg-surface-container-low p-1 transition-colors bg-error/10">
                <span className="text-outline">14:02:41.005</span>
                <div className="flex flex-col">
                  <span className="text-error font-bold text-glow-error">[ANOMALY]</span>
                  <span className="text-on-surface">POST /api/v1/auth payload_size=1024B</span>
                  <span className="text-error text-[10px]">Ed25519: sig_invalid. Trapped.</span>
                </div>
              </div>
              <div className="flex items-start gap-4 hover:bg-surface-container-low p-1 transition-colors">
                <span className="text-outline">14:02:40.998</span>
                <div className="flex flex-col">
                  <span className="text-secondary">[VERIFIED]</span>
                  <span className="text-on-surface">GET /api/v1/status</span>
                  <span className="text-outline text-[10px]">Ed25519: sig_valid 0x2b...11c</span>
                </div>
              </div>
              <div className="flex items-start gap-4 hover:bg-surface-container-low p-1 transition-colors">
                <span className="text-outline">14:02:40.901</span>
                <div className="flex flex-col">
                  <span className="text-secondary">[VERIFIED]</span>
                  <span className="text-on-surface">POST /api/v1/sync payload_size=88B</span>
                  <span className="text-outline text-[10px]">Ed25519: sig_valid 0x9c...4f1</span>
                </div>
              </div>
              <div className="scanning-line mt-2 p-1">
                <span className="text-primary-container animate-pulse">_ listening...</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quarantine Blocklist */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-lg font-semibold text-white tracking-wide uppercase">Quarantine Blocklist</h2>
            <span className="bg-surface-container-highest text-on-surface px-2 py-1 rounded-sm font-mono text-[10px] uppercase tracking-widest border border-outline-variant/30">Total Trapped: {blocklist.length || 24}</span>
          </div>
          
          <div className="bg-surface-container rounded-lg overflow-hidden flex flex-col ghost-border relative z-10">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-surface-container-high border-b border-outline-variant/10 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
              <div className="col-span-3">Agent ID</div>
              <div className="col-span-3">Timestamp</div>
              <div className="col-span-4">Trigger</div>
              <div className="col-span-2 text-right">Action</div>
            </div>
            
            {/* Table Rows */}
            <div className="flex flex-col divide-y divide-outline-variant/10 bg-surface-container-lowest">
              
              <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-surface-container-low transition-colors group">
                <div className="col-span-3 font-mono text-xs text-error font-bold text-glow-error">
                  agt_x99f2a_req
                </div>
                <div className="col-span-3 font-mono text-xs text-outline">
                  2024-05-20T14:02:41Z
                </div>
                <div className="col-span-4 font-mono text-xs text-on-surface">
                  <span className="bg-surface-container-highest px-2 py-1 rounded-sm border border-error/30 text-error">SIG_INVALID</span>
                </div>
                <div className="col-span-2 flex justify-end">
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity bg-transparent border border-outline-variant/30 text-on-surface hover:bg-surface-container-highest px-3 py-1.5 rounded-sm font-mono text-[10px] uppercase tracking-widest">
                    Lift Quarantine
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-surface-container-low transition-colors group">
                <div className="col-span-3 font-mono text-xs text-error font-bold text-glow-error">
                  agt_b31x8c_req
                </div>
                <div className="col-span-3 font-mono text-xs text-outline">
                  2024-05-20T13:45:12Z
                </div>
                <div className="col-span-4 font-mono text-xs text-on-surface">
                  <span className="bg-surface-container-highest px-2 py-1 rounded-sm border border-tertiary/30 text-tertiary">RATE_LIMIT_EXCEEDED</span>
                </div>
                <div className="col-span-2 flex justify-end">
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity bg-transparent border border-outline-variant/30 text-on-surface hover:bg-surface-container-highest px-3 py-1.5 rounded-sm font-mono text-[10px] uppercase tracking-widest">
                    Lift Quarantine
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-surface-container-low transition-colors group">
                <div className="col-span-3 font-mono text-xs text-error font-bold text-glow-error">
                  agt_m00z9p_req
                </div>
                <div className="col-span-3 font-mono text-xs text-outline">
                  2024-05-20T11:22:05Z
                </div>
                <div className="col-span-4 font-mono text-xs text-on-surface">
                  <span className="bg-surface-container-highest px-2 py-1 rounded-sm border border-error/30 text-error">MALFORMED_PAYLOAD</span>
                </div>
                <div className="col-span-2 flex justify-end">
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity bg-transparent border border-outline-variant/30 text-on-surface hover:bg-surface-container-highest px-3 py-1.5 rounded-sm font-mono text-[10px] uppercase tracking-widest">
                    Lift Quarantine
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-surface-container-low transition-colors group">
                <div className="col-span-3 font-mono text-xs text-error font-bold text-glow-error">
                  agt_k44v7l_req
                </div>
                <div className="col-span-3 font-mono text-xs text-outline">
                  2024-05-20T09:15:33Z
                </div>
                <div className="col-span-4 font-mono text-xs text-on-surface">
                  <span className="bg-surface-container-highest px-2 py-1 rounded-sm border border-error/30 text-error">SIG_INVALID</span>
                </div>
                <div className="col-span-2 flex justify-end">
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity bg-transparent border border-outline-variant/30 text-on-surface hover:bg-surface-container-highest px-3 py-1.5 rounded-sm font-mono text-[10px] uppercase tracking-widest">
                    Lift Quarantine
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
