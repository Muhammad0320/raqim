'use client';
import { MainLayout } from '../../components/Layout/MainLayout';
import { useSwarmStore } from '../../lib/store/useSwarmStore';
import { useMemo } from 'react';

export default function FirewallPage() {
  const thoughts = useSwarmStore(state => state.thoughts);

  const blocklist = useMemo(() => {
    return Object.values(thoughts)
      .filter(t => t.status === 'REJECTED')
      .slice(-10)
      .reverse();
  }, [thoughts]);

  return (
    <MainLayout title="Aegis Control">
      {/* Content Canvas */}
      <div className="flex-1 flex flex-col gap-6 px-8 pb-8 overflow-hidden">

        {/* ── Bento Grid Top Row (Stats) ── from raqim_console_aegis_firewall ── */}
        <div className="grid grid-cols-4 gap-4 flex-shrink-0">
          <div className="bg-surface-container p-5 rounded-lg ghost-border relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-primary-container/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start mb-4">
              <span className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">Active Nodes</span>
              <span className="material-symbols-outlined text-outline">dns</span>
            </div>
            <div className="font-headline text-4xl font-bold text-on-surface">1,024</div>
            <div className="font-mono text-[10px] text-secondary mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">trending_up</span> +12 from last cycle
            </div>
          </div>

          <div className="bg-surface-container p-5 rounded-lg ghost-border relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-error/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start mb-4">
              <span className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">Quarantined</span>
              <span className="material-symbols-outlined text-error">gpp_bad</span>
            </div>
            <div className="font-headline text-4xl font-bold text-error">{blocklist.length || 3}</div>
            <div className="font-mono text-[10px] text-error mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">warning</span> Critical action required
            </div>
          </div>

          <div className="bg-surface-container p-5 rounded-lg ghost-border relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <span className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">Intercept Rate</span>
              <span className="material-symbols-outlined text-outline">shield</span>
            </div>
            <div className="font-headline text-4xl font-bold text-on-surface">99.9%</div>
            <div className="font-mono text-[10px] text-on-surface-variant mt-2 flex items-center gap-1">
              Based on heuristics engine
            </div>
          </div>

          <div className="bg-surface-container p-5 rounded-lg ghost-border relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <span className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">Packet Drop</span>
              <span className="material-symbols-outlined text-outline">call_missed_outgoing</span>
            </div>
            <div className="font-headline text-4xl font-bold text-on-surface">0.04%</div>
            <div className="font-mono text-[10px] text-secondary mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">check_circle</span> Normal operational bounds
            </div>
          </div>
        </div>

        {/* ── Agent Data Table (The Swarm Grid) ── from raqim_console_aegis_firewall ── */}
        <div className="flex-1 bg-surface-container-lowest rounded-lg ghost-border flex flex-col overflow-hidden relative min-h-0">
          {/* Table Header */}
          <div className="bg-surface-container-high px-6 py-4 border-b border-outline-variant/20 flex-shrink-0">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-3 font-mono text-xs text-on-surface-variant uppercase tracking-widest">Agent ID</div>
              <div className="col-span-2 font-mono text-xs text-on-surface-variant uppercase tracking-widest">Sector</div>
              <div className="col-span-3 font-mono text-xs text-on-surface-variant uppercase tracking-widest">Protocol Status</div>
              <div className="col-span-2 font-mono text-xs text-on-surface-variant uppercase tracking-widest">Uptime</div>
              <div className="col-span-2 font-mono text-xs text-on-surface-variant uppercase tracking-widest text-right">Action</div>
            </div>
          </div>
          {/* Table Body */}
          <div className="flex-1 overflow-y-auto">
            {/* Normal Row */}
            <div className="grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-surface-container-low transition-colors border-b border-outline-variant/10">
              <div className="col-span-3 font-mono text-sm text-on-surface flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-[18px]">radio_button_checked</span>
                AX-901-DELTA
              </div>
              <div className="col-span-2 font-body text-sm text-on-surface-variant">Europ-West-1</div>
              <div className="col-span-3">
                <span className="bg-surface-container px-2 py-1 rounded-sm font-mono text-[10px] text-secondary border border-secondary/20">SECURE_HANDSHAKE</span>
              </div>
              <div className="col-span-2 font-mono text-xs text-on-surface-variant">42d 11h 09m</div>
              <div className="col-span-2 flex justify-end">
                <button className="text-on-surface-variant hover:text-on-surface font-mono text-xs uppercase px-3 py-1 bg-surface-container rounded-sm border border-outline-variant/30 hover:border-outline-variant/60 transition-all">Inspect</button>
              </div>
            </div>

            {/* Quarantined Row */}
            <div className="grid grid-cols-12 gap-4 items-center px-6 py-4 bg-error/5 hover:bg-error/10 transition-colors border-b border-error/20 relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-error"></div>
              <div className="col-span-3 font-mono text-sm text-error flex items-center gap-3 font-bold">
                <span className="material-symbols-outlined text-error text-[18px]">warning</span>
                KR-442-OMEGA
              </div>
              <div className="col-span-2 font-body text-sm text-on-surface-variant">Asia-East-2</div>
              <div className="col-span-3">
                <span className="bg-error/10 px-2 py-1 rounded-sm font-mono text-[10px] text-error border border-error/30 inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">lock</span> ISOLATED
                </span>
              </div>
              <div className="col-span-2 font-mono text-xs text-error/80">0d 00h 14m</div>
              <div className="col-span-2 flex justify-end gap-2">
                <button className="bg-surface-container-highest text-on-surface hover:text-primary font-mono text-xs uppercase px-3 py-1 rounded-sm border border-outline-variant/30 hover:border-primary/50 transition-all">Inspect</button>
                <button className="bg-surface-container text-error hover:bg-error/20 font-mono text-xs uppercase px-3 py-1 rounded-sm border border-error/50 transition-all font-bold">Lift Quarantine</button>
              </div>
            </div>

            {/* Quarantined Row */}
            <div className="grid grid-cols-12 gap-4 items-center px-6 py-4 bg-error/5 hover:bg-error/10 transition-colors border-b border-error/20 relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-error"></div>
              <div className="col-span-3 font-mono text-sm text-error flex items-center gap-3 font-bold">
                <span className="material-symbols-outlined text-error text-[18px]">warning</span>
                US-110-SIGMA
              </div>
              <div className="col-span-2 font-body text-sm text-on-surface-variant">US-Central-1</div>
              <div className="col-span-3">
                <span className="bg-error/10 px-2 py-1 rounded-sm font-mono text-[10px] text-error border border-error/30 inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">block</span> PAYLOAD_REJECT
                </span>
              </div>
              <div className="col-span-2 font-mono text-xs text-error/80">0d 02h 44m</div>
              <div className="col-span-2 flex justify-end gap-2">
                <button className="bg-surface-container-highest text-on-surface hover:text-primary font-mono text-xs uppercase px-3 py-1 rounded-sm border border-outline-variant/30 hover:border-primary/50 transition-all">Inspect</button>
                <button className="bg-surface-container text-error hover:bg-error/20 font-mono text-xs uppercase px-3 py-1 rounded-sm border border-error/50 transition-all font-bold">Lift Quarantine</button>
              </div>
            </div>

            {/* Normal Row */}
            <div className="grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-surface-container-low transition-colors border-b border-outline-variant/10">
              <div className="col-span-3 font-mono text-sm text-on-surface flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-[18px]">radio_button_checked</span>
                AX-902-DELTA
              </div>
              <div className="col-span-2 font-body text-sm text-on-surface-variant">Europ-West-1</div>
              <div className="col-span-3">
                <span className="bg-surface-container px-2 py-1 rounded-sm font-mono text-[10px] text-secondary border border-secondary/20">SECURE_HANDSHAKE</span>
              </div>
              <div className="col-span-2 font-mono text-xs text-on-surface-variant">42d 11h 05m</div>
              <div className="col-span-2 flex justify-end">
                <button className="text-on-surface-variant hover:text-on-surface font-mono text-xs uppercase px-3 py-1 bg-surface-container rounded-sm border border-outline-variant/30 hover:border-outline-variant/60 transition-all">Inspect</button>
              </div>
            </div>

            {/* Normal Row */}
            <div className="grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-surface-container-low transition-colors border-b border-outline-variant/10">
              <div className="col-span-3 font-mono text-sm text-on-surface flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-[18px]">radio_button_checked</span>
                BR-771-ALPHA
              </div>
              <div className="col-span-2 font-body text-sm text-on-surface-variant">SA-East-1</div>
              <div className="col-span-3">
                <span className="bg-surface-container px-2 py-1 rounded-sm font-mono text-[10px] text-secondary border border-secondary/20">SECURE_HANDSHAKE</span>
              </div>
              <div className="col-span-2 font-mono text-xs text-on-surface-variant">12d 04h 22m</div>
              <div className="col-span-2 flex justify-end">
                <button className="text-on-surface-variant hover:text-on-surface font-mono text-xs uppercase px-3 py-1 bg-surface-container rounded-sm border border-outline-variant/30 hover:border-outline-variant/60 transition-all">Inspect</button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Terminal / Cryptographic Stream ── from raqim_console_aegis_firewall ── */}
        <div className="h-48 bg-surface-container-lowest rounded-lg ghost-border flex flex-col overflow-hidden relative flex-shrink-0">
          {/* Terminal Header */}
          <div className="bg-surface-container-high px-4 py-2 border-b border-outline-variant/20 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant text-sm">terminal</span>
              <span className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">Aegis Rejection Stream</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span className="font-mono text-[10px] text-secondary uppercase tracking-widest">Live</span>
              <div className="flex gap-1.5 ml-2">
                <span className="w-2 h-2 rounded-full bg-outline-variant"></span>
                <span className="w-2 h-2 rounded-full bg-outline-variant"></span>
                <span className="w-2 h-2 rounded-full bg-outline-variant"></span>
              </div>
            </div>
          </div>
          {/* Terminal Output */}
          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed space-y-1">
            <div className="text-on-surface-variant"><span className="text-tertiary">[14:02:44.102]</span> REJECT: Invalid cryptographic signature from source IP 192.168.1.44 (KR-442-OMEGA)</div>
            <div className="text-on-surface-variant"><span className="text-tertiary">[14:02:44.105]</span> ACTION: Quarantine policy applied to KR-442-OMEGA. Connection severed.</div>
            <div className="text-on-surface-variant"><span className="text-outline">[14:02:45.001]</span> INFO: Handshake successful AX-901-DELTA.</div>
            <div className="text-on-surface-variant"><span className="text-tertiary">[14:02:50.882]</span> REJECT: Payload anomaly detected. Malformed headers in packet stream from US-110-SIGMA.</div>
            <div className="text-on-surface-variant"><span className="text-tertiary">[14:02:50.884]</span> ACTION: Quarantine policy applied to US-110-SIGMA. Deep inspection queued.</div>
            <div className="text-on-surface-variant"><span className="text-outline">[14:02:55.220]</span> INFO: Routine telemetry sync complete across Europ-West cluster.</div>
            <div className="text-on-surface-variant"><span className="text-tertiary">[14:03:01.002]</span> REJECT: Key rotation mismatch attempt from untracked MAC 00:1A:2B:3C:4D:5E.</div>
            <div className="text-on-surface-variant"><span className="text-outline">[14:03:05.110]</span> SYSTEM: Listening for incoming node registration requests...</div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
