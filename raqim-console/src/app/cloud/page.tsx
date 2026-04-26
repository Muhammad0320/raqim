'use client';
import { MainLayout } from '../../components/Layout/MainLayout';

export default function TopologyPage() {
  return (
    <MainLayout title="Cloud Orchestration">
      {/* Dashboard Header */}
      <div className="flex justify-between items-end mb-10 pb-6 border-b border-outline-variant/10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-secondary/20 text-secondary px-2 py-0.5 rounded-sm text-[10px] font-mono-tech uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              System Healthy
            </span>
            <span className="text-on-surface-variant font-mono-tech text-xs tracking-widest">US-EAST-1</span>
          </div>
          <h1 className="text-5xl font-headline font-bold tracking-tighter text-white">Cloud Orchestration</h1>
        </div>
        <div className="text-right">
          <div className="text-on-surface-variant text-xs font-mono-tech uppercase tracking-widest mb-1">Active Tenant ID</div>
          <div className="text-primary-fixed-dim font-mono-tech text-xl bg-surface-container-lowest px-4 py-2 rounded border border-outline-variant/20 shadow-inner">
            TN-88A9-FX24-PRD
          </div>
        </div>
      </div>
      
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-6 auto-rows-min">
        {/* Action Card: Generate JWT (Span 5) */}
        <div className="col-span-12 xl:col-span-5 bg-gradient-to-b from-primary-container to-on-primary-fixed-variant rounded-lg p-[1px] relative overflow-hidden group shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&auto=format&fit=crop')] opacity-10 mix-blend-overlay bg-cover bg-center"></div>
          <div className="bg-surface-container-high/90 backdrop-blur-xl w-full h-full rounded-lg p-6 flex flex-col relative z-10 agent-scan">
            <div className="flex items-center gap-3 mb-4 text-primary-fixed-dim">
              <span className="material-symbols-outlined text-3xl">key</span>
              <h2 className="font-headline text-xl font-bold tracking-tight text-white">License Authority</h2>
            </div>
            <p className="text-on-surface-variant text-sm mb-8 max-w-sm">
              Generate ephemeral JSON Web Tokens for agent nodes. Keys expire in 24 hours by default.
            </p>
            <div className="mt-auto space-y-4">
              <div className="bg-surface-container-lowest rounded p-3 border border-outline-variant/20 flex justify-between items-center group-hover:border-primary-container/50 transition-colors">
                <span className="font-mono-tech text-xs text-zinc-500">PAYLOAD_ENV:</span>
                <span className="font-mono-tech text-sm text-white">PRODUCTION</span>
              </div>
              <button className="w-full bg-primary-container text-on-primary-container hover:bg-blue-600 transition-colors duration-300 font-headline font-bold uppercase tracking-widest py-3 rounded text-sm shadow-[0_0_15px_rgba(0,112,243,0.3)]">
                Generate JWT License Key
              </button>
            </div>
          </div>
        </div>
        
        {/* Billing Management (Span 7) */}
        <div className="col-span-12 xl:col-span-7 bg-surface-container rounded-lg p-6 border border-outline-variant/15 flex flex-col shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-zinc-400">account_balance_wallet</span>
              <h2 className="font-headline text-lg font-bold tracking-tight text-white">Billing & Usage</h2>
            </div>
            <span className="bg-surface-container-highest px-3 py-1 rounded text-xs font-mono-tech text-on-surface-variant border border-outline-variant/20">
              ENTERPRISE TIER
            </span>
          </div>
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <div className="text-xs font-mono-tech text-zinc-500 mb-1 uppercase tracking-widest">Current Cycle</div>
              <div className="font-headline text-3xl text-white font-bold">$4,290.<span className="text-zinc-500 text-lg">00</span></div>
            </div>
            <div>
              <div className="text-xs font-mono-tech text-zinc-500 mb-1 uppercase tracking-widest">Forecast</div>
              <div className="font-headline text-3xl text-zinc-400 font-bold">$5,100.<span className="text-zinc-600 text-lg">00</span></div>
            </div>
          </div>
          <div className="mt-auto">
            <div className="flex justify-between text-xs font-mono-tech mb-2">
              <span className="text-zinc-400">Compute Allocation</span>
              <span className="text-primary-fixed-dim">78%</span>
            </div>
            <div className="w-full h-2 bg-surface-container-lowest rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary-container to-secondary-container w-[78%] rounded-full shadow-[0_0_10px_rgba(0,165,114,0.5)]"></div>
            </div>
            <div className="mt-4 flex justify-end">
              <button className="text-xs font-headline font-bold text-on-surface uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1">
                Manage Subscription <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Telemetry: A2A Messages (Span 6) */}
        <div className="col-span-12 md:col-span-6 bg-surface-container-low rounded-lg p-6 border border-outline-variant/10 hover:bg-surface-container transition-colors duration-300">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-headline text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">cell_tower</span>
              A2A Message Throughput
            </h3>
            <span className="text-secondary text-xs font-mono-tech flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> 12.4%
            </span>
          </div>
          <div className="font-mono-tech text-4xl text-white font-medium mb-1 tracking-tight">
            842,901,114
          </div>
          <div className="text-xs font-mono-tech text-zinc-600 uppercase tracking-widest">Global Events / 24h</div>
          <div className="mt-6 h-12 flex items-end gap-1 opacity-50">
            <div className="w-full bg-zinc-800 h-[30%]"></div>
            <div className="w-full bg-zinc-800 h-[45%]"></div>
            <div className="w-full bg-zinc-800 h-[20%]"></div>
            <div className="w-full bg-zinc-800 h-[60%]"></div>
            <div className="w-full bg-zinc-800 h-[80%]"></div>
            <div className="w-full bg-zinc-800 h-[50%]"></div>
            <div className="w-full bg-zinc-800 h-[90%]"></div>
            <div className="w-full bg-primary-container h-[100%] shadow-[0_0_8px_rgba(0,112,243,0.8)]"></div>
          </div>
        </div>
        
        {/* Telemetry: Time Travel (Span 6) */}
        <div className="col-span-12 md:col-span-6 bg-surface-container-low rounded-lg p-6 border border-outline-variant/10 hover:bg-surface-container transition-colors duration-300">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-headline text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">history</span>
              Time Travel Operations
            </h3>
            <span className="text-tertiary text-xs font-mono-tech flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">warning</span> High Load
            </span>
          </div>
          <div className="font-mono-tech text-4xl text-white font-medium mb-1 tracking-tight">
            4,209<span className="text-zinc-600 text-2xl">.ms</span>
          </div>
          <div className="text-xs font-mono-tech text-zinc-600 uppercase tracking-widest">Avg Query Latency</div>
          <div className="mt-6 grid grid-cols-8 gap-1 opacity-60">
            <div className="h-2 bg-surface-container-highest"></div><div className="h-2 bg-tertiary/50"></div><div className="h-2 bg-surface-container-highest"></div><div className="h-2 bg-surface-container-highest"></div>
            <div className="h-2 bg-surface-container-highest"></div><div className="h-2 bg-surface-container-highest"></div><div className="h-2 bg-tertiary"></div><div className="h-2 bg-surface-container-highest"></div>
            <div className="h-2 bg-surface-container-highest"></div><div className="h-2 bg-surface-container-highest"></div><div className="h-2 bg-surface-container-highest"></div><div className="h-2 bg-tertiary/30"></div>
            <div className="h-2 bg-tertiary/80"></div><div className="h-2 bg-surface-container-highest"></div><div className="h-2 bg-surface-container-highest"></div><div className="h-2 bg-surface-container-highest"></div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
