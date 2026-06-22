"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTenantStore } from '@/store/useTenantStore';
import { createCheckoutSession } from '@/actions/stripe';

export default function PricingPage() {
  const fetchTenantData = useTenantStore((state) => state.fetchTenantData);
  const activeOrgId = useTenantStore((state) => state.activeOrganizationId);
  const organizations = useTenantStore((state) => state.organizations);
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startupPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTUP || 'price_startup_mock_id';
  const enterprisePriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE || 'price_enterprise_mock_id';

  // Task 2: State Hydration Fix
  useEffect(() => {
    const isDevBypass = process.env.NEXT_PUBLIC_DEV_MODE_BYPASS === 'true';
    if (isDevBypass) {
      useTenantStore.setState({
        activeOrganizationId: 'e0000000-0000-0000-0000-000000000000',
        organizations: [
          {
            id: 'e0000000-0000-0000-0000-000000000000',
            alias: 'DEV_TENANT_LOCAL',
            display_name: 'Acme Corp (Dev Bypass)',
            sso_domain: 'acme.com',
            stripe_customer_id: null,
            plan_tier: 'STARTUP',
          }
        ],
        profile: {
          id: 'd0000000-0000-0000-0000-000000000000',
          full_name: 'Muhammad (Dev Bypass)',
          avatar_url: 'https://github.com/shadcn.png',
          updated_at: new Date().toISOString(),
        }
      });
    } else {
      fetchTenantData();
    }
  }, [fetchTenantData]);

  const activeOrg = organizations.find((org) => org.id === activeOrgId);
  const activeAlias = activeOrg?.alias || 'None';

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
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white">
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col min-h-screen relative z-10">
        
        {/* Navigation / Header */}
        <header className="flex justify-between items-center mb-20 border-b border-zinc-800 pb-6">
          <Link href="/dashboard" className="flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors group">
            <span className="group-hover:-translate-x-1 transition-transform">&larr;</span>
            <span className="font-mono text-sm tracking-wider uppercase">[ Dashboard ]</span>
          </Link>
          <div className="text-right">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Active Tenant: </span>
            <span className="text-xs font-mono text-white font-semibold">{activeAlias}</span>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-grow flex flex-col justify-center">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white uppercase font-mono">
              Sovereign Swarm Tiers
            </h1>
            <p className="text-zinc-500 text-base md:text-lg max-w-2xl mx-auto font-sans leading-relaxed">
              Transparent infrastructure pricing. Local computation is a fundamental right. Global synchronization is a premium utility.
            </p>
            {error && (
              <div className="mt-8 p-4 border border-red-800 bg-red-950/20 text-red-500 text-xs font-mono text-left max-w-lg mx-auto uppercase tracking-wide">
                [ERROR]: {error}
              </div>
            )}
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto w-full">
            
            {/* Card 1: OPEN CORE */}
            <div className="border border-zinc-800 bg-[#09090b] p-8 flex flex-col justify-between rounded-none">
              <div>
                <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-[0.2em] mb-4">OPEN CORE</h3>
                <div className="flex items-baseline mb-8">
                  <span className="text-4xl font-extrabold text-white font-mono">$0</span>
                  <span className="text-zinc-500 text-xs font-mono tracking-wider ml-1 uppercase">/ mo</span>
                </div>
                <ul className="space-y-4 mb-8 text-xs text-zinc-400 font-mono tracking-normal leading-normal">
                  <li className="flex items-start">
                    <span className="text-zinc-600 mr-2 select-none">&gt;</span>
                    <span>Unlimited Local Swarm Instances</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-zinc-600 mr-2 select-none">&gt;</span>
                    <span>Local Aegis Cryptographic Firewall</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-zinc-600 mr-2 select-none">&gt;</span>
                    <span>Deterministic Local Loro CRDT Merges</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-zinc-600 mr-2 select-none">&gt;</span>
                    <span>Local Time Travel (Reality Forking)</span>
                  </li>
                </ul>
              </div>
              <Link 
                href="/docs" 
                className="w-full text-center py-3 border border-zinc-800 hover:border-white text-zinc-400 hover:text-white font-mono text-xs font-bold tracking-wider uppercase transition-colors rounded-none"
              >
                Deploy Daemon
              </Link>
            </div>

            {/* Card 2: STARTUP */}
            <div className="border border-zinc-800 bg-[#09090b] p-8 flex flex-col justify-between rounded-none">
              <div>
                <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-[0.2em] mb-4">STARTUP</h3>
                <div className="flex flex-col mb-8">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-extrabold text-white font-mono">$49</span>
                    <span className="text-zinc-500 text-xs font-mono tracking-wider ml-1 uppercase">/ mo</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 tracking-wider mt-1 uppercase">
                    (+ Metered A2A Bandwidth)
                  </span>
                </div>
                <ul className="space-y-4 mb-8 text-xs text-zinc-400 font-mono tracking-normal leading-normal">
                  <li className="flex items-start">
                    <span className="text-zinc-600 mr-2 select-none">&gt;</span>
                    <span>Global WAN Mesh Enabled</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-zinc-600 mr-2 select-none">&gt;</span>
                    <span>Distributed CRDT Auto-Sync</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-zinc-600 mr-2 select-none">&gt;</span>
                    <span>Headless Fleet Observability</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => handleUpgrade(startupPriceId)}
                disabled={loadingPriceId !== null}
                className="w-full py-3 bg-white hover:bg-zinc-200 text-black font-mono font-bold text-xs tracking-wider uppercase transition-colors rounded-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loadingPriceId === startupPriceId ? (
                  <span>[ AWAITING_STRIPE_HANDSHAKE... ]</span>
                ) : (
                  <span>Upgrade to Startup</span>
                )}
              </button>
            </div>

            {/* Card 3: ENTERPRISE */}
            <div className="border border-zinc-800 bg-[#09090b] p-8 flex flex-col justify-between rounded-none">
              <div>
                <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-[0.2em] mb-4">ENTERPRISE</h3>
                <div className="flex flex-col mb-8">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-extrabold text-white font-mono">$499</span>
                    <span className="text-zinc-500 text-xs font-mono tracking-wider ml-1 uppercase">/ mo</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 tracking-wider mt-1 uppercase">
                    (+ Metered Compute)
                  </span>
                </div>
                <ul className="space-y-4 mb-8 text-xs text-zinc-400 font-mono tracking-normal leading-normal">
                  <li className="flex items-start">
                    <span className="text-cyan-500/80 mr-2 select-none">&gt;</span>
                    <span>Global Aegis Quarantine Sync</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyan-500/80 mr-2 select-none">&gt;</span>
                    <span>Remote Temporal Router Control</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyan-500/80 mr-2 select-none">&gt;</span>
                    <span>Sovereign Fleet CA Forge</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-cyan-500/80 mr-2 select-none">&gt;</span>
                    <span>Custom Eviction Hooks</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => handleUpgrade(enterprisePriceId)}
                disabled={loadingPriceId !== null}
                className="w-full py-3 border border-cyan-500 text-cyan-500 hover:bg-cyan-950/20 font-mono font-bold text-xs tracking-wider uppercase transition-colors rounded-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loadingPriceId === enterprisePriceId ? (
                  <span>[ AWAITING_STRIPE_HANDSHAKE... ]</span>
                ) : (
                  <span>Upgrade to Enterprise</span>
                )}
              </button>
            </div>

          </div>
        </main>

        {/* Footer */}
        <footer className="mt-20 text-center text-xs font-mono text-zinc-600 border-t border-zinc-800 pt-6 uppercase tracking-wider">
          &copy; {new Date().getFullYear()} Raqim Systems Inc. All cryptographic rights reserved.
        </footer>
      </div>
    </div>
  );
}
