"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useTenantStore } from '@/store/useTenantStore';
import { createCheckoutSession } from '@/actions/stripe';

export default function PricingPage() {
  const activeOrgId = useTenantStore((state) => state.activeOrganizationId);
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startupPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTUP || 'price_startup_mock_id';
  const enterprisePriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE || 'price_enterprise_mock_id';

  const handleUpgrade = async (priceId: string) => {
    if (!activeOrgId) {
      setError("Active Organization ID is required. Please select or create an organization first.");
      return;
    }

    setError(null);
    setLoadingPriceId(priceId);

    try {
      const result = await createCheckoutSession(priceId, activeOrgId);
      if (result && result.url) {
        window.location.href = result.url;
      } else {
        throw new Error("Did not receive a checkout redirect URL.");
      }
    } catch (err: any) {
      console.error("Stripe Checkout Session Error:", err);
      setError(err.message || "Failed to initialize Stripe checkout session.");
      setLoadingPriceId(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col min-h-screen relative z-10">
        {/* Navigation */}
        <header className="flex justify-between items-center mb-16 border-b border-zinc-900 pb-6">
          <Link href="/dashboard" className="flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors group">
            <span className="group-hover:-translate-x-1 transition-transform">&larr;</span>
            <span className="font-mono text-sm">Dashboard</span>
          </Link>
          <div className="text-right">
            <span className="text-xs font-mono text-zinc-500">Active Tenant ID: </span>
            <span className="text-xs font-mono text-cyan-400">{activeOrgId || 'None (Select Org First)'}</span>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-grow flex flex-col justify-center">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
              Sovereign Swarm Tiers for <span className="bg-gradient-to-r from-cyan-400 to-fuchsia-500 bg-clip-text text-transparent">Raqim OS</span>
            </h1>
            <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto">
              Scale your distributed CRDT network and secure edge nodes with cryptographic guardrails and WAN-mesh optimization.
            </p>
            {error && (
              <div className="mt-6 p-4 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-sm font-mono max-w-lg mx-auto">
                [ERROR]: {error}
              </div>
            )}
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto w-full">
            {/* Open Core Plan */}
            <div className="border border-zinc-900 bg-zinc-950/60 backdrop-blur-md rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden group">
              <div>
                <h3 className="text-sm font-mono text-zinc-500 uppercase tracking-widest mb-2">Open Core</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-bold text-white">$0</span>
                  <span className="text-zinc-500 text-sm font-mono ml-1">/mo</span>
                </div>
                <ul className="space-y-4 mb-8 text-sm text-zinc-400 font-mono">
                  <li className="flex items-center"><span className="text-zinc-600 mr-2">✦</span> Local Swarm Instances</li>
                  <li className="flex items-center"><span className="text-zinc-600 mr-2">✦</span> Default Ed25519 Keys</li>
                  <li className="flex items-center text-zinc-600"><span className="mr-2">✦</span> Global WAN Mesh Disabled</li>
                </ul>
              </div>
              <button 
                disabled 
                className="w-full py-3 rounded-xl border border-zinc-900 bg-zinc-950 text-zinc-600 font-mono text-sm cursor-not-allowed uppercase"
              >
                Default Plan
              </button>
            </div>

            {/* Startup Plan */}
            <div className="border border-zinc-800 bg-zinc-900/40 backdrop-blur-md rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden group shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-mono text-cyan-400 uppercase tracking-widest">Startup</h3>
                  <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800/40 text-cyan-400 text-[10px] uppercase font-mono tracking-wider">Upgrade</span>
                </div>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-bold text-white">$299</span>
                  <span className="text-zinc-500 text-sm font-mono ml-1">/mo</span>
                </div>
                <ul className="space-y-4 mb-8 text-sm text-zinc-300 font-mono">
                  <li className="flex items-center"><span className="text-cyan-500 mr-2">✦</span> Global WAN Mesh Enabled</li>
                  <li className="flex items-center"><span className="text-cyan-500 mr-2">✦</span> Distributed CRDT Auto-Sync</li>
                  <li className="flex items-center"><span className="text-cyan-500 mr-2">✦</span> RSA-Signed Client JWTs</li>
                </ul>
              </div>
              <button 
                onClick={() => handleUpgrade(startupPriceId)}
                disabled={loadingPriceId !== null}
                className="w-full py-3 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold font-mono text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-md hover:shadow-cyan-500/10"
              >
                {loadingPriceId === startupPriceId ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-zinc-950" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Provisioning...</span>
                  </>
                ) : (
                  <span>Upgrade to Startup</span>
                )}
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="border border-cyan-500/20 bg-zinc-950/80 backdrop-blur-md rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden group shadow-[0_0_30px_rgba(6,182,212,0.05)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/5 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-mono text-fuchsia-400 uppercase tracking-widest">Enterprise</h3>
                  <span className="px-2 py-0.5 rounded bg-fuchsia-950 border border-fuchsia-800/40 text-fuchsia-400 text-[10px] uppercase font-mono tracking-wider">Ultimate</span>
                </div>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-bold text-white">$999</span>
                  <span className="text-zinc-500 text-sm font-mono ml-1">/mo</span>
                </div>
                <ul className="space-y-4 mb-8 text-sm text-zinc-300 font-mono">
                  <li className="flex items-center"><span className="text-fuchsia-500 mr-2">✦</span> All Startup Features</li>
                  <li className="flex items-center"><span className="text-fuchsia-500 mr-2">✦</span> Aegis Firewall Shield</li>
                  <li className="flex items-center"><span className="text-fuchsia-500 mr-2">✦</span> Temporal Router Routing</li>
                  <li className="flex items-center"><span className="text-fuchsia-500 mr-2">✦</span> Unlimited Key Vending</li>
                </ul>
              </div>
              <button 
                onClick={() => handleUpgrade(enterprisePriceId)}
                disabled={loadingPriceId !== null}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-white font-semibold font-mono text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-400/20"
              >
                {loadingPriceId === enterprisePriceId ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Provisioning...</span>
                  </>
                ) : (
                  <span>Upgrade to Enterprise</span>
                )}
              </button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-16 text-center text-xs font-mono text-zinc-600 border-t border-zinc-900 pt-6">
          &copy; {new Date().getFullYear()} Raqim Cloud Inc. All cryptographic rights reserved.
        </footer>
      </div>
    </div>
  );
}
