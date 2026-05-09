"use client";

import React, { useState } from 'react';

// Icons
const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
);
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);
const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
);
const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
);
const LoaderIcon = () => (
  <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
);
const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
);
const RefreshCwIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
);
const AlertTriangleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
);

type PlanTier = 'OPEN_CORE' | 'STARTUP' | 'ENTERPRISE';

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState<PlanTier>('STARTUP');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Vending Machine State
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // AaaS Modules State
  const [modules, setModules] = useState({
    aegis: false,
    crdt: false,
    a2a: false,
    temporal: false,
  });

  const dummyKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlJhcWltIEVudGVycHJpc2UiLCJpYXQiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c_8Xk9";

  const handleCopy = () => {
    navigator.clipboard.writeText(dummyKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleModuleToggle = (key: keyof typeof modules) => {
    // Feature Gating Logic
    if (currentPlan !== 'ENTERPRISE' && (key === 'aegis' || key === 'temporal')) {
      return; 
    }

    setModules((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // CRDT -> A2A Dependency logic
      if (key === 'crdt' && next.crdt) {
        next.a2a = true;
      }
      return next;
    });
    setHasPendingChanges(true);
  };

  const handleUpgrade = () => {
    setIsUpgrading(true);
    // Simulate Stripe Checkout Redirect + Success
    setTimeout(() => {
      setIsUpgrading(false);
      setCurrentPlan('ENTERPRISE');
      setHasPendingChanges(true);
      setToastMessage("Subscription updated. Please regenerate your license.");
      setTimeout(() => setToastMessage(null), 5000);
    }, 1000);
  };

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      setIsRegenerating(false);
      setHasPendingChanges(false);
    }, 1000);
  };

  const showVendingMachine = currentPlan === 'STARTUP' || currentPlan === 'ENTERPRISE';
  const isEnterprise = currentPlan === 'ENTERPRISE';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-zinc-800 selection:text-white p-8">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 border border-zinc-800 text-white px-6 py-3 rounded-full shadow-2xl flex items-center space-x-3 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-16 py-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800/50 pb-8 gap-4">
          <div>
            <h1 className="text-3xl font-medium tracking-tight text-white mb-3">Billing & Infrastructure</h1>
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono tracking-widest uppercase border ${
                currentPlan === 'ENTERPRISE' ? 'bg-zinc-950 border-cyan-900/50 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]' :
                currentPlan === 'STARTUP' ? 'bg-zinc-900 border-zinc-700 text-zinc-200' :
                'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}>
                {currentPlan.replace('_', ' ')}
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
            <div className={`border rounded-2xl p-8 flex flex-col ${currentPlan === 'OPEN_CORE' ? 'border-zinc-600 bg-zinc-900/20' : 'border-zinc-800 bg-zinc-950/50'}`}>
              <h3 className="text-xs font-mono text-zinc-400 mb-2 uppercase tracking-widest font-semibold">Open Core</h3>
              <div className="text-3xl font-medium text-white mb-6">Free</div>
              <ul className="text-sm text-zinc-500 space-y-4 mb-8 flex-1 font-mono">
                <li className="flex items-start"><span className="text-zinc-700 mr-3">✦</span> Local Swarm only</li>
              </ul>
              {currentPlan === 'OPEN_CORE' ? (
                <div className="text-center text-sm font-medium text-zinc-500 py-3">Current Plan</div>
              ) : (
                <button disabled className="w-full py-3 rounded-xl border border-zinc-800 text-zinc-600 font-medium cursor-not-allowed text-sm">
                  Downgrade
                </button>
              )}
            </div>

            {/* Startup */}
            <div className={`border rounded-2xl p-8 flex flex-col ${currentPlan === 'STARTUP' ? 'border-zinc-600 bg-zinc-900/40 shadow-xl' : 'border-zinc-800 bg-zinc-950/50'}`}>
              <h3 className="text-xs font-mono text-white mb-2 uppercase tracking-widest font-semibold">Startup</h3>
              <div className="flex items-baseline mb-6">
                <span className="text-3xl font-medium text-white">$299</span>
                <span className="text-sm text-zinc-500 ml-1 font-mono">/mo</span>
              </div>
              <ul className="text-sm text-zinc-300 space-y-4 mb-8 flex-1 font-mono">
                <li className="flex items-start"><span className="text-white mr-3">✦</span> Global WAN routing</li>
              </ul>
              {currentPlan === 'STARTUP' ? (
                <div className="text-center text-sm font-medium text-zinc-400 py-3 border border-zinc-700 rounded-xl">Current Plan</div>
              ) : (
                <button disabled className="w-full py-3 rounded-xl border border-zinc-800 text-zinc-600 font-medium cursor-not-allowed text-sm">
                  {currentPlan === 'ENTERPRISE' ? 'Downgrade' : 'Upgrade via Stripe'}
                </button>
              )}
            </div>

            {/* Enterprise */}
            <div className={`border rounded-2xl p-8 flex flex-col relative overflow-hidden group ${currentPlan === 'ENTERPRISE' ? 'border-cyan-900/50 bg-zinc-900/50 shadow-[0_0_30px_rgba(34,211,238,0.1)]' : 'border-zinc-800 bg-zinc-950/50'}`}>
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
              
              {currentPlan === 'ENTERPRISE' ? (
                <div className="text-center text-sm font-medium text-cyan-400 py-3 border border-cyan-900/30 bg-cyan-950/20 rounded-xl z-10">Current Plan</div>
              ) : (
                <button 
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                  className="w-full py-3 rounded-xl bg-white text-zinc-950 font-semibold hover:bg-zinc-200 transition-all text-sm z-10 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] flex justify-center items-center h-[46px]"
                >
                  {isUpgrading ? <LoaderIcon /> : "Upgrade to Enterprise"}
                </button>
              )}
            </div>

          </div>
        </section>

        {showVendingMachine && (
          <>
            {/* Section B: The Modular AaaS Builder */}
            <section className="space-y-6 pt-8 border-t border-zinc-800/50">
              <h2 className="text-sm uppercase tracking-widest text-zinc-500 font-medium">Modular Architecture (AaaS)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Module 1 - Aegis (Gated) */}
                <div 
                  className={`border rounded-xl p-5 transition-all duration-300 flex flex-col justify-between min-h-[140px] group ${
                    !isEnterprise ? 'opacity-50 cursor-not-allowed border-zinc-800 bg-zinc-950' : 
                    modules.aegis ? 'border-zinc-500 bg-zinc-900 shadow-[0_0_15px_rgba(255,255,255,0.03)] cursor-pointer' : 
                    'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700 cursor-pointer'
                  }`}
                  onClick={() => handleModuleToggle('aegis')}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-white group-hover:text-zinc-100 transition-colors">Aegis Firewall</h3>
                      {!isEnterprise && <span className="text-zinc-600"><LockIcon /></span>}
                    </div>
                    <div className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors duration-300 ${modules.aegis ? 'bg-white' : 'bg-zinc-800'}`}>
                      <div className={`w-4 h-4 rounded-full bg-zinc-950 transition-transform duration-300 shadow-sm ${modules.aegis ? 'translate-x-5' : 'bg-zinc-400'}`} />
                    </div>
                  </div>
                  <p className="text-sm text-zinc-500 max-w-[75%] leading-relaxed mt-4">Line-rate Ed25519 signature verification and interdiction.</p>
                </div>

                {/* Module 2 - CRDT */}
                <div 
                  className={`border rounded-xl p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[140px] group ${modules.crdt ? 'border-zinc-500 bg-zinc-900 shadow-[0_0_15px_rgba(255,255,255,0.03)]' : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700'}`}
                  onClick={() => handleModuleToggle('crdt')}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-white group-hover:text-zinc-100 transition-colors">Global CRDT State</h3>
                    <div className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors duration-300 ${modules.crdt ? 'bg-white' : 'bg-zinc-800'}`}>
                      <div className={`w-4 h-4 rounded-full bg-zinc-950 transition-transform duration-300 shadow-sm ${modules.crdt ? 'translate-x-5' : 'bg-zinc-400'}`} />
                    </div>
                  </div>
                  <p className="text-sm text-zinc-500 max-w-[75%] leading-relaxed mt-4">Conflict-free resolution across global edge nodes.</p>
                </div>

                {/* Module 3 - A2A Routing (Dependency constraint) */}
                <div 
                  className={`border rounded-xl p-5 transition-all duration-300 flex flex-col justify-between min-h-[140px] group ${modules.a2a ? 'border-zinc-500 bg-zinc-900 shadow-[0_0_15px_rgba(255,255,255,0.03)]' : 'border-zinc-800 bg-zinc-950/50'} ${modules.crdt ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:border-zinc-700'}`}
                  onClick={() => {
                    if (!modules.crdt) handleModuleToggle('a2a');
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-white">Global A2A Routing</h3>
                      {modules.crdt && (
                        <div className="group/tooltip relative flex items-center">
                          <span className="text-zinc-500 hover:text-zinc-400 transition-colors cursor-help"><InfoIcon /></span>
                          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-zinc-800 text-xs text-zinc-200 px-3 py-1.5 rounded-md opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap border border-zinc-700 shadow-lg">
                            A2A Routing is a strict dependency of Global CRDT.
                          </div>
                        </div>
                      )}
                    </div>
                    <div className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors duration-300 ${modules.a2a ? 'bg-white' : 'bg-zinc-800'}`}>
                      <div className={`w-4 h-4 rounded-full bg-zinc-950 transition-transform duration-300 shadow-sm ${modules.a2a ? 'translate-x-5' : 'bg-zinc-400'}`} />
                    </div>
                  </div>
                  <p className="text-sm text-zinc-500 max-w-[75%] leading-relaxed mt-4">Zenoh-powered inter-agent mesh.</p>
                </div>

                {/* Module 4 - Temporal (Gated) */}
                <div 
                  className={`border rounded-xl p-5 transition-all duration-300 flex flex-col justify-between min-h-[140px] group ${
                    !isEnterprise ? 'opacity-50 cursor-not-allowed border-zinc-800 bg-zinc-950' : 
                    modules.temporal ? 'border-zinc-500 bg-zinc-900 shadow-[0_0_15px_rgba(255,255,255,0.03)] cursor-pointer' : 
                    'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700 cursor-pointer'
                  }`}
                  onClick={() => handleModuleToggle('temporal')}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-white group-hover:text-zinc-100 transition-colors">Temporal Router (Time Machine)</h3>
                      {!isEnterprise && <span className="text-zinc-600"><LockIcon /></span>}
                    </div>
                    <div className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors duration-300 ${modules.temporal ? 'bg-white' : 'bg-zinc-800'}`}>
                      <div className={`w-4 h-4 rounded-full bg-zinc-950 transition-transform duration-300 shadow-sm ${modules.temporal ? 'translate-x-5' : 'bg-zinc-400'}`} />
                    </div>
                  </div>
                  <p className="text-sm text-zinc-500 max-w-[75%] leading-relaxed mt-4">Deterministic memory scrubbing and reality forking.</p>
                </div>

              </div>
            </section>
            
            {/* Dirty Config Banner */}
            {hasPendingChanges && (
               <div className="border border-amber-900/50 bg-amber-950/20 text-amber-500 px-6 py-4 rounded-xl flex items-start space-x-3 animate-in slide-in-from-bottom-4 fade-in duration-300 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                 <div className="mt-0.5"><AlertTriangleIcon /></div>
                 <div>
                   <h4 className="text-sm font-semibold mb-0.5">Infrastructure config changed.</h4>
                   <p className="text-xs text-amber-500/80">You must regenerate and deploy a new license key to your daemons to apply these architectural changes.</p>
                 </div>
               </div>
            )}

            {/* Section C: The Sovereign Vending Machine */}
            <section className="space-y-6 pt-4">
              <div className="border border-zinc-800 rounded-xl bg-zinc-950 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-zinc-800 rounded-full blur-[100px] opacity-10 pointer-events-none -translate-y-1/2 translate-x-1/2" />
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center z-10 gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-medium text-white mb-1">Active License Key</h2>
                    <p className="text-sm text-zinc-500 max-w-xl">Configure your daemon by copying this key to your local configuration.</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={handleRegenerate}
                      disabled={isRegenerating || !hasPendingChanges}
                      className={`flex items-center space-x-2 text-sm px-4 py-2.5 rounded-lg transition-all font-medium ${
                        hasPendingChanges && !isRegenerating
                        ? 'bg-amber-500 text-amber-950 hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                      }`}
                    >
                      {isRegenerating ? <LoaderIcon /> : <RefreshCwIcon />}
                      <span>{isRegenerating ? "Regenerating..." : "Regenerate License"}</span>
                    </button>
                    <button 
                      onClick={() => setShowKey(!showKey)}
                      className="flex items-center space-x-2 text-sm px-4 py-2.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 hover:bg-zinc-800 transition-all text-zinc-300"
                    >
                      {showKey ? <EyeOffIcon /> : <EyeIcon />}
                      <span>{showKey ? "Hide" : "Reveal"}</span>
                    </button>
                  </div>
                </div>

                <div className="relative group z-10 w-full overflow-hidden">
                  <div className={`font-mono text-sm break-all p-5 rounded-lg border border-zinc-800 bg-black text-zinc-400 transition-all duration-500 shadow-inner ${!showKey ? 'blur-[6px] select-none opacity-50' : 'blur-0 opacity-100'}`}>
                    {dummyKey}
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between border-t border-zinc-800/50 pt-4">
                  <div className="flex items-center space-x-2 text-xs font-mono text-zinc-500">
                    <InfoIcon />
                    <span>Your license automatically rotates every 7 days via Telemetry Ping. Do not share this key.</span>
                  </div>
                  <button 
                    onClick={handleCopy}
                    className="flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-md hover:bg-zinc-800 transition-all text-zinc-400"
                  >
                    <CopyIcon />
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>

              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
