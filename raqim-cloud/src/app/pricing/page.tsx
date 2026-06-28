"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTenantStore } from '@/store/useTenantStore';
import { createCheckoutSession } from '@/actions/stripe';

export default function PricingPage() {
  const router = useRouter();
  const fetchTenantData = useTenantStore((state) => state.fetchTenantData);
  const activeOrgId = useTenantStore((state) => state.activeOrganizationId);
  const organizations = useTenantStore((state) => state.organizations);
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startupPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTUP || 'price_startup_mock_id';
  const enterprisePriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE || 'price_enterprise_mock_id';

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
      setError("[ BILLING ERROR: Connection timeout. Verify infrastructure env variables. ]");
      return;
    }

    setError(null);
    setLoadingPriceId(priceId);

    try {
      const result = await createCheckoutSession(priceId, activeOrgId);
      if (result && result.url) {
        window.location.href = result.url;
      } else {
        throw new Error("Connection timeout. Verify infrastructure env variables.");
      }
    } catch (err: any) {
      console.error("Stripe Checkout Session Error:", err);
      setError("[ BILLING ERROR: Connection timeout. Verify infrastructure env variables. ]");
      setLoadingPriceId(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-mono selection:bg-zinc-800 selection:text-white">
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col min-h-screen relative z-10">
        
        {/* Top Context Bar */}
        <header className="flex justify-between items-center mb-20 border-b border-zinc-800 pb-6 w-full">
          <Link href="/dashboard" className="flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors group">
            <span className="group-hover:-translate-x-1 transition-transform">&larr;</span>
            <span className="font-mono text-sm tracking-wider uppercase">[ Dashboard ]</span>
          </Link>
          <div className="text-right">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Active Tenant ID: </span>
            <span className="text-xs font-mono text-white font-semibold">{activeAlias}</span>
          </div>
        </header>

        {/* Flat Error Banner Alert Block */}
        {error && (
          <div className="w-full p-4 border border-red-500 bg-red-950/20 text-red-500 font-mono text-xs uppercase tracking-wider mb-8 text-center">
            {error}
          </div>
        )}

        {/* Hero Header */}
        <main className="flex-grow flex flex-col justify-center">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white uppercase font-sans">
              Sovereign Swarm Tiers
            </h1>
            <p className="text-zinc-400 text-sm md:text-base max-w-2xl mx-auto font-mono leading-relaxed uppercase tracking-wide">
              Transparent infrastructure pricing. Local computation is a fundamental right. Global WAN synchronization is a premium utility.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto px-4 w-full">
            
            {/* TIER 1: OPEN CORE */}
            <div className="border border-zinc-800 bg-[#09090b] p-8 flex flex-col justify-between rounded-none min-h-[500px]">
              <div>
                <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-[0.2em] mb-4">[ OPEN CORE ]</h3>
                <div className="flex items-baseline mb-6 border-b border-zinc-800 pb-4">
                  <span className="text-5xl font-extrabold text-white font-mono">$0</span>
                  <span className="text-zinc-400 text-xs font-mono tracking-wider ml-1 uppercase">/ mo</span>
                </div>
                <p className="text-zinc-400 text-xs mb-8 leading-relaxed font-mono min-h-[80px]">
                  "Local computation is a fundamental right. Audit, compile, and run autonomous agent swarms entirely within your local cluster topology."
                </p>
                <div className="border-t border-zinc-800 pt-6">
                  <ul className="space-y-4 text-xs text-zinc-400 font-mono tracking-normal leading-normal">
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
                      <span>Deterministic Local CRDT Merges</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-zinc-600 mr-2 select-none">&gt;</span>
                      <span>Isolated WASM Sandbox Environment</span>
                    </li>
                  </ul>
                </div>
              </div>
              <button 
                onClick={() => router.push('/docs')}
                className="w-full text-center py-3 mt-8 border border-zinc-800 hover:border-white text-zinc-400 hover:text-white font-mono text-xs font-bold tracking-wider uppercase transition-colors rounded-none bg-transparent"
              >
                [ Deploy Local Daemon ]
              </button>
            </div>

            {/* TIER 2: STARTUP */}
            <div className="border border-zinc-800 bg-[#09090b] p-8 flex flex-col justify-between rounded-none min-h-[500px]">
              <div>
                <h3 className="text-xs font-mono text-blue-400 uppercase tracking-[0.2em] mb-4">[ STARTUP ]</h3>
                <div className="flex flex-col mb-6 border-b border-zinc-800 pb-4">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-extrabold text-white font-mono">$49</span>
                    <span className="text-zinc-400 text-xs font-mono tracking-wider ml-1 uppercase">/ mo</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 tracking-wider mt-1 uppercase">
                    + Metered Elastic Consumption
                  </span>
                </div>
                <p className="text-zinc-400 text-xs mb-8 leading-relaxed font-mono min-h-[80px]">
                  "For scaling infrastructure networks. Cross the localhost barrier to sync data frames globally with out-of-band message routing."
                </p>
                <div className="border-t border-zinc-800 pt-6">
                  <ul className="space-y-4 text-xs text-zinc-400 font-mono tracking-normal leading-normal">
                    <li className="flex items-start">
                      <span className="text-zinc-600 mr-2 select-none">&gt;</span>
                      <span>Global WAN Mesh Enabled (Zenoh Bridge)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-zinc-600 mr-2 select-none">&gt;</span>
                      <span>Distributed CRDT Auto-Sync</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-zinc-600 mr-2 select-none">&gt;</span>
                      <span>Headless Fleet Observability & Metrics</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-zinc-600 mr-2 select-none">&gt;</span>
                      <span className="text-zinc-500">Metered Add-on: Global A2A Bandwidth ($0.05 / GB)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-zinc-600 mr-2 select-none">&gt;</span>
                      <span className="text-zinc-500">Metered Add-on: CRDT Merges ($0.50 / 1M Commits)</span>
                    </li>
                  </ul>
                </div>
              </div>
              <button 
                onClick={() => handleUpgrade(startupPriceId)}
                disabled={loadingPriceId !== null}
                className="w-full py-3 mt-8 bg-white hover:bg-zinc-200 text-black font-mono font-bold text-xs tracking-wider uppercase transition-colors rounded-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loadingPriceId === startupPriceId ? (
                  <span>[ AWAITING_STRIPE_HANDSHAKE... ]</span>
                ) : (
                  <span>[ Upgrade to Startup Swarm ]</span>
                )}
              </button>
            </div>

            {/* TIER 3: ENTERPRISE */}
            <div className="border border-zinc-800 bg-[#09090b] p-8 flex flex-col justify-between rounded-none min-h-[500px]">
              <div>
                <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-[0.2em] mb-4">[ ENTERPRISE ]</h3>
                <div className="flex flex-col mb-6 border-b border-zinc-800 pb-4">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-extrabold text-white font-mono">$499</span>
                    <span className="text-zinc-400 text-xs font-mono tracking-wider ml-1 uppercase">/ mo</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 tracking-wider mt-1 uppercase">
                    + Metered Elastic Consumption
                  </span>
                </div>
                <p className="text-zinc-400 text-xs mb-8 leading-relaxed font-mono min-h-[80px]">
                  "For critical, high-velocity compliance environments requiring hardened perimeter isolation and sub-millisecond interdiction mesh sweeps."
                </p>
                <div className="border-t border-zinc-800 pt-6">
                  <ul className="space-y-4 text-xs text-zinc-400 font-mono tracking-normal leading-normal">
                    <li className="flex items-start">
                      <span className="text-zinc-600 mr-2 select-none">&gt;</span>
                      <span>Global Aegis Quarantine Sync (Flat Core Unlocked)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-zinc-600 mr-2 select-none">&gt;</span>
                      <span>Remote Temporal Router Control (Time Travel Forks)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-zinc-600 mr-2 select-none">&gt;</span>
                      <span>Sovereign Fleet Certificate Authority Forge</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-zinc-600 mr-2 select-none">&gt;</span>
                      <span>Dedicated SAML SSO + Corporate RBAC Integration</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-zinc-600 mr-2 select-none">&gt;</span>
                      <span className="text-zinc-500">Metered: Shared Network Bandwidth ($0.05 / GB)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-zinc-600 mr-2 select-none">&gt;</span>
                      <span className="text-zinc-500">Metered: Shared Compute Merges ($0.50 / 1M Commits)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-zinc-600 mr-2 select-none">&gt;</span>
                      <span className="text-zinc-500">Metered: Reality Simulation Forks ($0.10 / Fork)</span>
                    </li>
                  </ul>
                </div>
              </div>
              <button 
                onClick={() => handleUpgrade(enterprisePriceId)}
                disabled={loadingPriceId !== null}
                className="w-full py-3 mt-8 border border-cyan-500 text-cyan-500 hover:bg-cyan-950/20 font-mono font-bold text-xs tracking-wider uppercase transition-colors rounded-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center bg-transparent"
              >
                {loadingPriceId === enterprisePriceId ? (
                  <span>[ AWAITING_STRIPE_HANDSHAKE... ]</span>
                ) : (
                  <span>[ Request Enterprise Provisioning ]</span>
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
