'use client';
import { MainLayout } from '../../components/Layout/MainLayout';

export default function VaultPage() {
  return (
    <MainLayout title="Audit Vault">
      <div className="flex flex-col gap-8 flex-1 h-full mt-6 px-8 pb-8 overflow-hidden">
        {/* Header & Top Level Metrics */}
        <header className="flex justify-between items-end pb-6 border-b border-outline-variant/10 shrink-0">
          <div className="flex flex-col gap-2">
            <p className="font-mono text-sm text-on-surface-variant tracking-wider uppercase pl-1">LanceDB Semantic History · Immutable Record</p>
          </div>
          {/* Global Status / Stats */}
          <div className="flex gap-6 items-center">
            <div className="flex flex-col items-end">
              <span className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">Total Vectors</span>
              <span className="font-headline text-xl text-primary font-bold">14,892,041</span>
            </div>
            <div className="h-8 w-px bg-outline-variant/20"></div>
            <div className="flex flex-col items-end">
              <span className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">Cluster Status</span>
              <div className="bg-secondary/10 text-secondary px-3 py-1 mt-1 rounded text-xs font-mono uppercase flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse"></div>
                Nominal
              </div>
            </div>
          </div>
        </header>

        {/* Deterministic Command / Filter Palette */}
        <section className="bg-surface-container-highest/70 backdrop-blur-xl p-5 rounded-lg border border-outline-variant/15 flex gap-4 items-end shadow-[0_20px_40px_rgba(0,0,0,0.4)] shrink-0">
          <div className="flex-1">
            <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest block mb-2 font-bold">Namespace</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline-variant text-sm">search</span>
              <input className="industrial-input w-full bg-surface-container-lowest text-on-surface font-mono text-sm py-2 pl-9 pr-3 rounded-lg border border-transparent transition-all" placeholder="e.g. agent_memory_core" type="text"/>
            </div>
          </div>
          <div className="flex-1">
            <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest block mb-2 font-bold">Transaction ID (TX_ID)</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline-variant text-sm">tag</span>
              <input className="industrial-input w-full bg-surface-container-lowest text-on-surface font-mono text-sm py-2 pl-9 pr-3 rounded-lg border border-transparent transition-all" placeholder="Hex identifier..." type="text"/>
            </div>
          </div>
          <div className="w-48">
            <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest block mb-2 font-bold">Operation Type</label>
            <div className="relative">
              <select className="industrial-input w-full bg-surface-container-lowest text-on-surface font-mono text-sm py-2 px-3 rounded-lg border border-transparent appearance-none">
                <option>ALL_OPERATIONS</option>
                <option>UPSERT</option>
                <option>DELETE</option>
                <option>QUERY</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-2.5 text-outline-variant text-sm pointer-events-none">expand_more</span>
            </div>
          </div>
          <button className="bg-gradient-to-b from-primary-container to-on-primary-fixed-variant text-on-primary-container h-[38px] px-6 rounded font-label text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 border border-primary/20">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Execute Filter
          </button>
        </section>

        {/* The "Swarm Grid" - Data Dense Table */}
        <section className="bg-surface-container w-full flex-1 rounded-xl overflow-hidden border border-outline-variant/15 flex flex-col relative min-h-0">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-container/50 to-transparent"></div>
          <div className="overflow-x-auto flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-surface-container-high sticky top-0 z-10">
                <tr>
                  <th className="p-4 font-mono text-[11px] text-on-surface-variant uppercase tracking-widest font-bold border-b border-surface">Timestamp (UTC)</th>
                  <th className="p-4 font-mono text-[11px] text-on-surface-variant uppercase tracking-widest font-bold border-b border-surface">TX_ID</th>
                  <th className="p-4 font-mono text-[11px] text-on-surface-variant uppercase tracking-widest font-bold border-b border-surface">Namespace</th>
                  <th className="p-4 font-mono text-[11px] text-on-surface-variant uppercase tracking-widest font-bold border-b border-surface">Operation</th>
                  <th className="p-4 font-mono text-[11px] text-on-surface-variant uppercase tracking-widest font-bold border-b border-surface text-right">Vectors</th>
                  <th className="p-4 font-mono text-[11px] text-on-surface-variant uppercase tracking-widest font-bold border-b border-surface text-right">Latency (ms)</th>
                  <th className="p-4 font-mono text-[11px] text-on-surface-variant uppercase tracking-widest font-bold border-b border-surface text-center">Status</th>
                  <th className="p-4 font-mono text-[11px] text-on-surface-variant uppercase tracking-widest font-bold border-b border-surface text-right">Action</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[13px] text-on-surface">
                <tr className="hover:bg-surface-container-low transition-colors group cursor-default">
                  <td className="p-4 text-on-surface-variant">2024-10-27T08:14:02.112Z</td>
                  <td className="p-4 text-primary-fixed-dim">0x8f92a1b4c</td>
                  <td className="p-4 text-white">agent_memory_core</td>
                  <td className="p-4"><span className="text-secondary-fixed">UPSERT</span></td>
                  <td className="p-4 text-right">1,024</td>
                  <td className="p-4 text-right">14.2</td>
                  <td className="p-4 text-center">
                    <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded-sm text-[10px]">OK</span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-on-surface-variant hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[18px]">data_object</span>
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors group cursor-default">
                  <td className="p-4 text-on-surface-variant">2024-10-27T08:13:45.009Z</td>
                  <td className="p-4 text-primary-fixed-dim">0x7a31b99f0</td>
                  <td className="p-4 text-white">client_auth_logs</td>
                  <td className="p-4"><span className="text-primary-container">QUERY</span></td>
                  <td className="p-4 text-right">-</td>
                  <td className="p-4 text-right">4.8</td>
                  <td className="p-4 text-center">
                    <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded-sm text-[10px]">OK</span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-on-surface-variant hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[18px]">data_object</span>
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors group cursor-default bg-surface-container-lowest/30">
                  <td className="p-4 text-on-surface-variant">2024-10-27T08:11:12.881Z</td>
                  <td className="p-4 text-primary-fixed-dim">0x4c22d11e8</td>
                  <td className="p-4 text-white">threat_intel_feed</td>
                  <td className="p-4"><span className="text-secondary-fixed">UPSERT</span></td>
                  <td className="p-4 text-right">50,000</td>
                  <td className="p-4 text-right text-tertiary">145.0</td>
                  <td className="p-4 text-center">
                    <span className="bg-tertiary/10 text-tertiary px-2 py-0.5 rounded-sm text-[10px]">WARN</span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-on-surface-variant hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[18px]">data_object</span>
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors group cursor-default">
                  <td className="p-4 text-on-surface-variant">2024-10-27T08:05:33.410Z</td>
                  <td className="p-4 text-primary-fixed-dim">0x9e10f88a2</td>
                  <td className="p-4 text-white">agent_memory_core</td>
                  <td className="p-4"><span className="text-error">DELETE</span></td>
                  <td className="p-4 text-right">12</td>
                  <td className="p-4 text-right">8.1</td>
                  <td className="p-4 text-center">
                    <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded-sm text-[10px]">OK</span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-on-surface-variant hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[18px]">data_object</span>
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors group cursor-default">
                  <td className="p-4 text-on-surface-variant">2024-10-27T08:01:05.992Z</td>
                  <td className="p-4 text-primary-fixed-dim">0x1b44c77d9</td>
                  <td className="p-4 text-white">user_embeddings_v3</td>
                  <td className="p-4"><span className="text-secondary-fixed">UPSERT</span></td>
                  <td className="p-4 text-right">512</td>
                  <td className="p-4 text-right">11.3</td>
                  <td className="p-4 text-center">
                    <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded-sm text-[10px]">OK</span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-on-surface-variant hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[18px]">data_object</span>
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors group cursor-default bg-error/5">
                  <td className="p-4 text-error">2024-10-27T07:55:22.001Z</td>
                  <td className="p-4 text-primary-fixed-dim">0x88a1b22c0</td>
                  <td className="p-4 text-white">sys_kernel_cache</td>
                  <td className="p-4"><span className="text-primary-container">QUERY</span></td>
                  <td className="p-4 text-right">-</td>
                  <td className="p-4 text-right text-error">timeout</td>
                  <td className="p-4 text-center">
                    <span className="bg-error/10 text-error px-2 py-0.5 rounded-sm text-[10px]">FAIL</span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-on-surface-variant hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[18px]">data_object</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-auto bg-surface-container-high p-4 flex justify-between items-center border-t border-surface shrink-0">
            <span className="font-mono text-xs text-on-surface-variant">Showing 6 of 14,892,041 events</span>
            <div className="flex gap-2">
              <button className="bg-surface-container text-on-surface-variant px-3 py-1 rounded-sm border border-outline-variant/20 hover:bg-surface-container-highest transition-colors font-mono text-xs flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button className="bg-surface-container text-on-surface px-3 py-1 rounded-sm border border-outline-variant/20 hover:bg-surface-container-highest transition-colors font-mono text-xs flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
