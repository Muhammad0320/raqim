import React from 'react';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { LicenseVendingMachine } from '@/components/dashboard/LicenseVendingMachine';
import { TelemetryChart } from '@/components/dashboard/TelemetryChart';

export default async function DashboardPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active-org-id')?.value;

  // 1. Fetch organization based on cookie or fallback to first org
  let org = null;
  if (activeOrgId) {
    const { data: matchedOrg } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', activeOrgId)
      .maybeSingle();
    org = matchedOrg;
  }

  if (!org) {
    const { data: orgs } = await supabase.from('organizations').select('*').limit(1);
    org = orgs?.[0] || null;
  }

  const orgId = org?.id || '00000000-0000-0000-0000-000000000000';

  // 2. Fetch subscription
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan_tier, status')
    .eq('org_id', orgId)
    .single();

  const planTier = sub?.plan_tier || 'OPEN_CORE';
  const subStatus = sub?.status || 'inactive';

  // 3. Fetch active license
  const { data: license } = await supabase
    .from('licenses')
    .select('jwt_hash, created_at')
    .eq('org_id', orgId)
    .eq('revoked', false)
    .single();

  // 4. Fetch telemetry rollups (last 7 days)
  const { data: telemetryData } = await supabase
    .from('telemetry_daily_rollups')
    .select('*')
    .eq('org_id', orgId)
    .order('day', { ascending: false })
    .limit(7);

  // Calculate aggregates
  const rawData = telemetryData || [];
  const aggCrdt = rawData.reduce((acc, curr) => acc + (Number(curr.daily_crdt) || 0), 0);
  const aggA2a = rawData.reduce((acc, curr) => acc + (Number(curr.daily_a2a) || 0), 0);
  const aggTimeTravel = rawData.reduce((acc, curr) => acc + (Number(curr.daily_time_travel) || 0), 0);

  // Format bytes for display
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-zinc-800 selection:text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* 1. Command Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-800/50 pb-6 gap-4">
          <div>
            <h2 className="text-zinc-500 font-mono text-sm tracking-widest uppercase mb-2">Active Tenant</h2>
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-medium tracking-tight text-white uppercase">{org?.alias || 'NO_TENANT_FOUND'}</h1>
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border text-xs font-mono tracking-widest uppercase ${
                planTier === 'ENTERPRISE' ? 'bg-cyan-950/20 border-cyan-900/50 text-cyan-400' :
                planTier === 'STARTUP' ? 'bg-zinc-900 border-zinc-700 text-zinc-200' :
                'bg-zinc-900 border-zinc-800 text-zinc-500'
              }`}>
                <span className="relative flex h-2 w-2 mr-1">
                  {subStatus === 'active' ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  )}
                </span>
                <span>{planTier.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </header>

        {/* CSS Grid Bento Box */}
        <div className="flex flex-col gap-8">
          
          {/* 2. Top Row (30% visual weight) */}
          <section>
            <h2 className="text-xs font-mono text-zinc-500 tracking-widest uppercase mb-4 pl-1">Cryptographic Configuration</h2>
            <LicenseVendingMachine 
              orgId={orgId} 
              planTier={planTier} 
              activeJwt={license?.jwt_hash} 
              issueDate={license?.created_at} 
            />
          </section>

          {/* 3. Bottom Row (70% visual weight) */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Aggregates */}
            <div className="lg:col-span-1 space-y-6 flex flex-col">
              <h2 className="text-xs font-mono text-zinc-500 tracking-widest uppercase mb-[-8px] pl-1">7-Day Aggregates</h2>
              
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 flex-1 flex flex-col justify-center relative overflow-hidden group hover:border-zinc-700 transition-colors">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-800 group-hover:bg-cyan-600 transition-colors" />
                <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-1">A2A Bytes Routed</p>
                <p className="text-4xl font-mono text-white tracking-tighter">{formatBytes(aggA2a)}</p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 flex-1 flex flex-col justify-center relative overflow-hidden group hover:border-zinc-700 transition-colors">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-800 group-hover:bg-zinc-600 transition-colors" />
                <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-1">CRDT Merges</p>
                <p className="text-4xl font-mono text-white tracking-tighter">{aggCrdt.toLocaleString()}</p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 flex-1 flex flex-col justify-center relative overflow-hidden group hover:border-zinc-700 transition-colors">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-800 group-hover:bg-zinc-600 transition-colors" />
                <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-1">Time Travel Queries</p>
                <p className="text-4xl font-mono text-white tracking-tighter">{aggTimeTravel.toLocaleString()}</p>
              </div>

            </div>

            {/* Right Column: Time Series Chart */}
            <div className="lg:col-span-2 border border-zinc-800 bg-zinc-950/50 rounded-2xl p-6 relative overflow-hidden flex flex-col min-h-[400px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-medium tracking-tight">Fleet Telemetry Velocity</h3>
                <span className="text-xs font-mono text-cyan-500 bg-cyan-950/30 px-2 py-1 rounded border border-cyan-900/50 uppercase tracking-widest">Global Edge Mesh</span>
              </div>
              <div className="flex-1 w-full relative">
                {/* Custom glowing grid background effect */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
                
                <div className="relative h-full w-full z-10">
                  <TelemetryChart data={rawData} />
                </div>
              </div>
            </div>

          </section>

        </div>
      </div>
    </div>
  );
}
