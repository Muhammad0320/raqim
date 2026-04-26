'use client';
import { MainLayout } from '../../components/Layout/MainLayout';
import { DagCanvas } from '../../components/DagCanvas/DagCanvas';
import { NLEScrubber } from '../../components/TimeMachine/NLEScrubber';
import { RealityForkDrawer } from '../../components/TimeMachine/RealityForkDrawer';
import { useSwarmStream } from '../../lib/hooks/useSwarmStream';

export default function RouterPage() {
  // Initialize the stream hook to start filling the Zustand store
  useSwarmStream();

  return (
    <MainLayout title="State Inspector">
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Main DAG Area */}
          <div style={{ flex: 1, position: 'relative' }}>
             {/* We can place stats overlays here */}
             <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 10, display: 'flex', gap: 24 }}>
                <div style={{ background: 'var(--bg-surface)', padding: 16, border: '1px solid var(--border-dim)', borderRadius: 4 }}>
                   <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 8 }}>SYSTEM ENTROPY</div>
                   <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)' }}>
                     8.442 <span style={{ fontSize: 12, color: 'var(--neon-amber)' }}>nats/symbol</span>
                   </div>
                </div>
                <div style={{ background: 'var(--bg-surface)', padding: 16, border: '1px solid var(--border-dim)', borderRadius: 4, minWidth: 200 }}>
                   <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 8 }}>NETWORK MESH</div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                     <span className="text-muted">Peers</span> <span className="text-mono">1,024</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                     <span className="text-muted">Latency</span> <span className="text-mono text-green">12ms</span>
                   </div>
                </div>
             </div>
             
             <DagCanvas />
          </div>

          {/* Drawer (only appears or holds space if activeTxId is not live) */}
          <RealityForkDrawer />
        </div>

        {/* Bottom Scrubber */}
        <NLEScrubber />
      </div>
    </MainLayout>
  );
}
