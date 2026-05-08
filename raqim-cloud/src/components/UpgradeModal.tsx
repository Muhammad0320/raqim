"use client";

import React, { useEffect } from 'react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-zinc-800 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-medium text-white">Upgrade Infrastructure</h2>
            <p className="text-sm text-zinc-400 mt-1">Select the mathematical boundaries of your swarm.</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
          {/* Tier 1 */}
          <div className="p-8 flex flex-col">
            <h3 className="text-xs font-mono text-zinc-400 mb-2 uppercase tracking-widest font-semibold">Open Core</h3>
            <div className="text-3xl font-medium text-white mb-6">Free</div>
            <ul className="text-sm text-zinc-500 space-y-4 mb-8 flex-1 font-mono">
              <li className="flex items-start"><span className="text-zinc-700 mr-3">✦</span> Local Swarm only</li>
              <li className="flex items-start"><span className="text-zinc-700 mr-3">✦</span> No WAN routing</li>
              <li className="flex items-start"><span className="text-zinc-700 mr-3">✦</span> No Aegis</li>
            </ul>
            <button className="w-full py-3 rounded-lg border border-zinc-800 text-zinc-500 font-medium cursor-not-allowed text-sm">
              Current Plan
            </button>
          </div>

          {/* Tier 2 */}
          <div className="p-8 flex flex-col bg-zinc-900/30">
            <h3 className="text-xs font-mono text-white mb-2 uppercase tracking-widest font-semibold">Startup</h3>
            <div className="flex items-baseline mb-6">
              <span className="text-3xl font-medium text-white">$299</span>
              <span className="text-sm text-zinc-500 ml-1 font-mono">/mo</span>
            </div>
            <ul className="text-sm text-zinc-300 space-y-4 mb-8 flex-1 font-mono">
              <li className="flex items-start"><span className="text-white mr-3">✦</span> Global WAN routing</li>
              <li className="flex items-start"><span className="text-white mr-3">✦</span> Max 50 nodes</li>
            </ul>
            <button className="w-full py-3 rounded-lg bg-white text-zinc-950 font-semibold hover:bg-zinc-200 transition-colors text-sm">
              Upgrade via Stripe
            </button>
          </div>

          {/* Tier 3 */}
          <div className="p-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-900/10 rounded-full blur-3xl pointer-events-none" />
            <h3 className="text-xs font-mono text-cyan-400 mb-2 uppercase tracking-widest font-semibold">Enterprise</h3>
            <div className="text-3xl font-medium text-white mb-6">Custom</div>
            <ul className="text-sm text-zinc-400 space-y-4 mb-8 flex-1 font-mono">
              <li className="flex items-start"><span className="text-cyan-500/50 mr-3">✦</span> Aegis Firewall</li>
              <li className="flex items-start"><span className="text-cyan-500/50 mr-3">✦</span> Temporal Router</li>
              <li className="flex items-start"><span className="text-cyan-500/50 mr-3">✦</span> Unlimited nodes</li>
              <li className="flex items-start"><span className="text-cyan-500/50 mr-3">✦</span> SSO</li>
            </ul>
            <button className="w-full py-3 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-medium hover:bg-zinc-800 transition-colors text-sm">
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
