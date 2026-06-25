"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTenantStore } from '@/store/useTenantStore';
import { createClient } from '@/utils/supabase/client';
// Recharts timeline visualization removed and isolated to the Telemetry Deck

export default function DashboardPage() {
  const fetchTenantData = useTenantStore((state) => state.fetchTenantData);
  const activeOrgId = useTenantStore((state) => state.activeOrganizationId);
  const organizations = useTenantStore((state) => state.organizations);

  const [planTier, setPlanTier] = useState<string>('OPEN_CORE');
  const [activeLicense, setActiveLicense] = useState<any>(null);
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hydrate useTenantStore
  useEffect(() => {
    const isDevBypass = typeof document !== 'undefined' && document.cookie.includes('dev-mode-bypass-active=true');
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
            plan_tier: 'ENTERPRISE',
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

  // Load telemetry, plan, and active license dynamically
  useEffect(() => {
    const isDevBypass = typeof document !== 'undefined' && document.cookie.includes('dev-mode-bypass-active=true');
    if (isDevBypass) {
      setPlanTier('ENTERPRISE');
      setActiveLicense({
        jwt_hash: 'DEV_RSA_BYPASS_KEY_MASKED_SHA256_HASH_REVEALED_AUTHENTICATED',
        created_at: new Date().toISOString(),
      });
      
      // 30-day mock rollups
      const mockTel = Array.from({ length: 30 }, (_, i) => {
        const dayFactor = Math.sin((30 - i) / 3);
        const randFactor = Math.random() * 0.4 + 0.8;
        return {
          day: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
          daily_crdt: Math.round((850000 + dayFactor * 300000) * randFactor),
          daily_a2a: Math.round((2.5 * 1024 * 1024 * 1024 + dayFactor * 1.2 * 1024 * 1024 * 1024) * randFactor),
          daily_time_travel: Math.max(0, Math.round(4 + dayFactor * 3.5 + (Math.random() - 0.5) * 2)),
        };
      });
      setTelemetry(mockTel);
      setLoading(false);
      return;
    }

    if (!activeOrgId) {
      setLoading(false);
      return;
    }

    async function loadData() {
      setLoading(true);
      const supabase = createClient();
      try {
        // 1. Plan tier
        const { data: sub } = await supabase
          .from('subscriptions' as any)
          .select('plan_tier')
          .eq('org_id', activeOrgId)
          .maybeSingle();
        setPlanTier(sub?.plan_tier || 'OPEN_CORE');

        // 2. Active license
        const { data: lic } = await supabase
          .from('licenses')
          .select('jwt_hash, created_at')
          .eq('org_id', activeOrgId)
          .eq('revoked', false)
          .maybeSingle();
        setActiveLicense(lic || null);

        // 3. Telemetry
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { data: tel } = await supabase
          .from('telemetry_daily_rollups' as any)
          .select('*')
          .eq('org_id', activeOrgId)
          .gte('day', thirtyDaysAgo.toISOString())
          .order('day', { ascending: true });
        
        setTelemetry(tel || []);
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [activeOrgId]);

  const activeOrg = organizations.find((o) => o.id === activeOrgId);
  const activeOrgAlias = activeOrg?.alias || (typeof document !== 'undefined' && document.cookie.includes('dev-mode-bypass-active=true') ? 'DEV_TENANT_LOCAL' : 'NO_TENANT_FOUND');
  const activePlanTier = planTier;

  // Calculate aggregates
  const aggCrdt = telemetry.reduce((acc, curr) => acc + (Number(curr.daily_crdt) || 0), 0);
  const aggA2a = telemetry.reduce((acc, curr) => acc + (Number(curr.daily_a2a) || 0), 0);
  const aggTimeTravel = telemetry.reduce((acc, curr) => acc + (Number(curr.daily_time_travel) || 0), 0);

  // Billing calculations
  let projectedBilling = 0;
  let formulaSubtext = "";
  if (activePlanTier === 'ENTERPRISE') {
    projectedBilling = 499 + (aggCrdt / 1000000) * 0.50;
    formulaSubtext = "*Base $499 + $0.50/1M Merges";
  } else if (activePlanTier === 'STARTUP') {
    projectedBilling = 49 + (aggCrdt / 100000) * 0.10;
    formulaSubtext = "*Base $49 + $0.10/100k Merges";
  } else {
    projectedBilling = 0;
    formulaSubtext = "*Base $0 - Local computation is free";
  }

  // Recharts timeline visualization isolated to the Telemetry Deck

  const handleMint = async () => {
    if (!activeOrgId && !(typeof document !== 'undefined' && document.cookie.includes('dev-mode-bypass-active=true'))) return;
    setMinting(true);
    try {
      const isDevBypass = activeOrg?.alias === 'DEV_TENANT_LOCAL';
      const orgId = activeOrgId || 'e0000000-0000-0000-0000-000000000000';
      const features = 
        activePlanTier === 'ENTERPRISE' ? ['local_swarm', 'global_a2a', 'global_crdt', 'time_travel', 'aegis'] :
        activePlanTier === 'STARTUP' ? ['local_swarm', 'global_a2a', 'global_crdt'] :
        ['local_swarm'];

      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, requested_features: features })
      });
      const data = await res.json();
      if (res.ok && data.license_key) {
        setActiveLicense({
          jwt_hash: data.license_key,
          created_at: new Date().toISOString()
        });
        setShowKey(true);
      } else {
        alert(data.error || 'Failed to mint license key');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while minting license');
    } finally {
      setMinting(false);
    }
  };

  const handleCopy = () => {
    if (!activeLicense?.jwt_hash) return;
    navigator.clipboard.writeText(activeLicense.jwt_hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-zinc-800 p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Command Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-800 pb-6 gap-4">
          <div>
            <h2 className="text-zinc-500 font-mono text-xs tracking-widest uppercase mb-2">Active Tenant</h2>
            <div className="flex items-center space-x-4">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white uppercase font-mono leading-none">
                {activeOrgAlias}
              </h1>
              <div className={`flex items-center space-x-2 px-3 py-1 border text-xs font-mono tracking-widest uppercase rounded-none ${
                activePlanTier === 'ENTERPRISE' ? 'bg-cyan-950/20 border-cyan-900/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]' :
                activePlanTier === 'STARTUP' ? 'bg-blue-950/20 border-blue-900/50 text-blue-400' :
                'bg-zinc-900 border-zinc-800 text-zinc-500'
              }`}>
                <span className="relative flex h-2 w-2 mr-1">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>{activePlanTier.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </header>

        {/* CSS Grid Bento Box */}
        <div className="flex flex-col gap-12">
          
          {/* Vending Machine Section */}
          <section className="border border-zinc-800 bg-[#09090b] p-6 relative overflow-hidden rounded-none">
            <h2 className="text-xs font-mono text-zinc-500 tracking-widest uppercase mb-4">Cryptographic Configuration</h2>
            
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div>
                <h3 className="text-white font-medium font-mono text-sm uppercase mb-1">Sovereign License</h3>
                <p className="text-zinc-500 text-xs font-mono">
                  {activeLicense?.created_at ? `Issued ${new Date(activeLicense.created_at).toLocaleDateString()}` : "No active license"}
                </p>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={handleMint}
                  disabled={minting || activePlanTier === 'OPEN_CORE'}
                  className="px-3 py-1.5 text-xs font-medium border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors rounded-none uppercase font-mono disabled:opacity-50"
                >
                  {minting ? "[ MINTING_RSA_JWT... ]" : "Mint License"}
                </button>
                <button 
                  onClick={() => setShowKey(!showKey)}
                  disabled={!activeLicense?.jwt_hash}
                  className="px-3 py-1.5 text-xs font-medium border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors rounded-none uppercase font-mono disabled:opacity-50"
                >
                  {showKey ? "Hide Key" : "Reveal Key"}
                </button>
              </div>
            </div>

            <div className="relative group z-10 w-full overflow-hidden mb-6">
              <div className={`font-mono text-xs break-all p-4 border border-zinc-800 bg-black text-cyan-400 transition-all duration-500 min-h-[70px] ${!showKey ? 'blur-[8px] select-none opacity-40' : 'blur-0 opacity-100'}`}>
                {activeLicense?.jwt_hash || (activePlanTier === 'OPEN_CORE' ? "Upgrade to generate a license." : "No license active.")}
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-4 z-10 relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                <FeatureTag label="LOCAL_SWARM" status="ON" />
                <FeatureTag label="GLOBAL_WAN_MESH" status={activePlanTier !== 'OPEN_CORE' ? 'ON' : 'LOCKED'} />
                <FeatureTag label="GLOBAL_QUARANTINE_SYNC" status={activePlanTier === 'ENTERPRISE' ? 'ON' : 'LOCKED'} />
                <FeatureTag label="TEMPORAL_ROUTER" status={activePlanTier === 'ENTERPRISE' ? 'ON' : 'LOCKED'} />
              </div>
              
              <button 
                onClick={handleCopy}
                disabled={!activeLicense?.jwt_hash}
                className="flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-none border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition-colors disabled:opacity-50 font-mono uppercase"
              >
                <span>{copied ? "Copied!" : "Copy to Clipboard"}</span>
              </button>
            </div>
          </section>

          {/* 30-Day Rolling Aggregates Section */}
          <section className="space-y-6">
            <h2 className="text-xs font-mono text-zinc-500 tracking-widest uppercase pl-1">30-DAY ROLLING AGGREGATES</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* Card 1: A2A BYTES ROUTED */}
              <div className="bg-[#09090b] border border-zinc-800 rounded-none p-6 flex flex-col justify-center relative overflow-hidden group hover:border-zinc-700 transition-colors">
                <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest mb-1">A2A Bytes Routed</p>
                <p className="text-3xl font-mono font-bold text-white tracking-tighter">{(aggA2a / (1024 * 1024 * 1024)).toFixed(2)} GB</p>
              </div>

              {/* Card 2: CRDT MERGES */}
              <div className="bg-[#09090b] border border-zinc-800 rounded-none p-6 flex flex-col justify-center relative overflow-hidden group hover:border-zinc-700 transition-colors">
                <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest mb-1">CRDT Merges</p>
                <p className="text-3xl font-mono font-bold text-white tracking-tighter">{aggCrdt.toLocaleString()}</p>
              </div>

              {/* Card 3: REALITY FORKS */}
              <div className="bg-[#09090b] border border-zinc-800 rounded-none p-6 flex flex-col justify-center relative overflow-hidden group hover:border-zinc-700 transition-colors">
                <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest mb-1">Reality Forks</p>
                <p className="text-3xl font-mono font-bold text-white tracking-tighter">{aggTimeTravel.toLocaleString()}</p>
              </div>

              {/* Card 4: PROJECTED BILLING */}
              <div className="bg-[#09090b] border border-zinc-800 rounded-none p-6 flex flex-col justify-center relative overflow-hidden group hover:border-zinc-700 transition-colors">
                <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest mb-1">Projected Billing</p>
                <p className="text-3xl font-mono font-bold text-white tracking-tighter">${projectedBilling.toFixed(2)}</p>
                <p className="text-[10px] text-zinc-600 font-mono mt-1 leading-none">{formulaSubtext}</p>
              </div>
            </div>
          </section>

          {/* Telemetry Deck Redirect Banner */}
          <section className="border border-zinc-800 bg-zinc-900 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 rounded-none">
            <div className="space-y-1">
              <h3 className="text-white font-medium font-mono text-sm uppercase">Telemetry Deck</h3>
              <p className="text-zinc-500 text-xs font-mono">
                Detailed TimescaleDB observability, reality fork tracking, and bandwidth ledgers are isolated in the Telemetry Deck.
              </p>
            </div>
            <Link 
              href="/dashboard/telemetry" 
              className="px-4 py-2 text-xs font-semibold font-mono border border-zinc-800 bg-white text-black hover:bg-zinc-200 transition-colors uppercase rounded-none shrink-0 text-center"
            >
              Access Telemetry Deck
            </Link>
          </section>

        </div>
      </div>
    </div>
  );
}

function FeatureTag({ label, status }: { label: string, status: 'ON' | 'LOCKED' }) {
  if (status === 'ON') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-mono border border-cyan-900/50 bg-cyan-950/20 text-cyan-400 rounded-none uppercase tracking-wider">
        {label}: ON
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-mono border border-zinc-700 bg-zinc-800 text-zinc-600 rounded-none uppercase tracking-wider">
        {label}: LOCKED
      </span>
    );
  }
}

// Custom tooltip component deleted
