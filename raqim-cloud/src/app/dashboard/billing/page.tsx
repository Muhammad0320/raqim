import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { LicenseManager } from './LicenseManager';
import { createStripeCheckoutSession } from './actions';

export default async function BillingPage() {
  const supabase = await createClient();
  
  // Hardcoded for demonstration, ideally fetched from auth session
  // e.g. const { data: { user } } = await supabase.auth.getUser();
  // const orgId = await getOrganizationForUser(user.id);
  
  // We'll query the first organization for demonstration, or default to a dummy if none exist.
  const { data: orgs } = await supabase.from('organizations').select('*').limit(1);
  let orgId = orgs?.[0]?.id;
  let planTier = 'OPEN_CORE';

  if (orgId) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('org_id', orgId)
      .single();
    
    if (sub) {
      planTier = sub.plan_tier;
    }
  } else {
    // Fallback dummy org ID if DB is empty for rendering purposes
    orgId = '00000000-0000-0000-0000-000000000000';
  }

  // Fetch active license if it exists
  const { data: activeLicense } = await supabase
    .from('licenses')
    .select('*')
    .eq('org_id', orgId)
    .eq('revoked', false)
    .single();

  const isEnterprise = planTier === 'ENTERPRISE';

  // Stripe Checkout Action bound to the form
  const handleUpgradeToEnterprise = createStripeCheckoutSession.bind(null, orgId, 'price_enterprise_mock_id');
  const handleUpgradeToStartup = createStripeCheckoutSession.bind(null, orgId, 'price_startup_mock_id');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-zinc-800 selection:text-white p-8">
      <div className="max-w-5xl mx-auto space-y-16 py-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800/50 pb-8 gap-4">
          <div>
            <h1 className="text-3xl font-medium tracking-tight text-white mb-3">Billing & Infrastructure</h1>
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono tracking-widest uppercase border ${
                planTier === 'ENTERPRISE' ? 'bg-zinc-950 border-cyan-900/50 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]' :
                planTier === 'STARTUP' ? 'bg-zinc-900 border-zinc-700 text-zinc-200' :
                'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}>
                {planTier.replace('_', ' ')}
              </span>
              <div className="flex items-center space-x-2 text-sm text-zinc-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Billing Status: Active</span>
              </div>
            </div>
          </div>
        </header>

        {/* Section A: The Plan & Upgrade Flow */}
        <section className="space-y-6">
          <h2 className="text-sm uppercase tracking-widest text-zinc-500 font-medium">Subscription Tiers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Open Core */}
            <div className={`border rounded-2xl p-8 flex flex-col ${planTier === 'OPEN_CORE' ? 'border-zinc-600 bg-zinc-900/20' : 'border-zinc-800 bg-zinc-950/50'}`}>
              <h3 className="text-xs font-mono text-zinc-400 mb-2 uppercase tracking-widest font-semibold">Open Core</h3>
              <div className="text-3xl font-medium text-white mb-6">Free</div>
              <ul className="text-sm text-zinc-500 space-y-4 mb-8 flex-1 font-mono">
                <li className="flex items-start"><span className="text-zinc-700 mr-3">✦</span> Local Swarm only</li>
              </ul>
              {planTier === 'OPEN_CORE' ? (
                <div className="text-center text-sm font-medium text-zinc-500 py-3">Current Plan</div>
              ) : (
                <button disabled className="w-full py-3 rounded-xl border border-zinc-800 text-zinc-600 font-medium cursor-not-allowed text-sm">
                  Downgrade
                </button>
              )}
            </div>

            {/* Startup */}
            <div className={`border rounded-2xl p-8 flex flex-col ${planTier === 'STARTUP' ? 'border-zinc-600 bg-zinc-900/40 shadow-xl' : 'border-zinc-800 bg-zinc-950/50'}`}>
              <h3 className="text-xs font-mono text-white mb-2 uppercase tracking-widest font-semibold">Startup</h3>
              <div className="flex items-baseline mb-6">
                <span className="text-3xl font-medium text-white">$299</span>
                <span className="text-sm text-zinc-500 ml-1 font-mono">/mo</span>
              </div>
              <ul className="text-sm text-zinc-300 space-y-4 mb-8 flex-1 font-mono">
                <li className="flex items-start"><span className="text-white mr-3">✦</span> Global WAN routing</li>
              </ul>
              {planTier === 'STARTUP' ? (
                <div className="text-center text-sm font-medium text-zinc-400 py-3 border border-zinc-700 rounded-xl">Current Plan</div>
              ) : (
                <form action={handleUpgradeToStartup} className="mt-auto">
                  <button 
                    type="submit"
                    disabled={planTier === 'ENTERPRISE'} 
                    className={`w-full py-3 rounded-xl border font-medium text-sm transition-all ${planTier === 'ENTERPRISE' ? 'border-zinc-800 text-zinc-600 cursor-not-allowed' : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'}`}
                  >
                    {planTier === 'ENTERPRISE' ? 'Downgrade' : 'Upgrade via Stripe'}
                  </button>
                </form>
              )}
            </div>

            {/* Enterprise */}
            <div className={`border rounded-2xl p-8 flex flex-col relative overflow-hidden group ${planTier === 'ENTERPRISE' ? 'border-cyan-900/50 bg-zinc-900/50 shadow-[0_0_30px_rgba(34,211,238,0.1)]' : 'border-zinc-800 bg-zinc-950/50'}`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-900/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-cyan-900/20 transition-colors duration-700" />
              <h3 className="text-xs font-mono text-cyan-400 mb-2 uppercase tracking-widest font-semibold z-10">Enterprise</h3>
              <div className="flex items-baseline mb-6 z-10">
                <span className="text-3xl font-medium text-white">$999</span>
                <span className="text-sm text-zinc-500 ml-1 font-mono">/mo</span>
              </div>
              <ul className="text-sm text-zinc-400 space-y-4 mb-8 flex-1 font-mono z-10">
                <li className="flex items-start"><span className="text-cyan-500/50 mr-3">✦</span> Aegis Firewall</li>
                <li className="flex items-start"><span className="text-cyan-500/50 mr-3">✦</span> Reality Forking</li>
                <li className="flex items-start"><span className="text-cyan-500/50 mr-3">✦</span> Unlimited A2A</li>
              </ul>
              
              {planTier === 'ENTERPRISE' ? (
                <div className="text-center text-sm font-medium text-cyan-400 py-3 border border-cyan-900/30 bg-cyan-950/20 rounded-xl z-10">Current Plan</div>
              ) : (
                <form action={handleUpgradeToEnterprise} className="mt-auto z-10">
                  <button 
                    type="submit"
                    className="w-full py-3 rounded-xl bg-white text-zinc-950 font-semibold hover:bg-zinc-200 transition-all text-sm shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                  >
                    Upgrade to Enterprise
                  </button>
                </form>
              )}
            </div>

          </div>
        </section>

        {/* Section C: The Sovereign Vending Machine */}
        <LicenseManager planTier={planTier} initialJwt={activeLicense?.jwt_hash} orgId={orgId} />
        
      </div>
    </div>
  );
}
