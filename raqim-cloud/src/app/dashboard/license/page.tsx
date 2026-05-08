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
const RefreshCwIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
);
const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
);

export default function LicensePage() {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [modules, setModules] = useState({
    aegis: false,
    temporal: false,
    crdt: false,
    a2a: false,
  });

  const dummyKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlJhcWltIEVudGVycHJpc2UiLCJpYXQiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c_8Xk9";

  const handleCopy = () => {
    navigator.clipboard.writeText(dummyKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggle = (key: keyof typeof modules) => {
    setModules((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (key === 'crdt' && next.crdt) {
        next.a2a = true;
      }
      return next;
    });
  };

  const handleSubmit = () => {
    console.log("Saving Infrastructure Plan:", modules);
    alert("Infrastructure Plan Updated. Check console for details.");
  };

  const totalCost = 
    (modules.aegis ? 499 : 0) + 
    (modules.temporal ? 899 : 0) + 
    (modules.crdt ? 1200 : 0) + 
    (modules.a2a ? 200 : 0);

  return (
    <div className="min-h-screen bg-black text-neutral-200 font-sans selection:bg-neutral-800 selection:text-white p-8 pb-32">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-white mb-2">Vending Machine</h1>
          <p className="text-neutral-500 text-sm">Configure your OS features, view billing details, and manage your license key.</p>
        </div>

        {/* Section 1: Sovereign Key */}
        <section className="space-y-4">
          <h2 className="text-xs uppercase tracking-widest text-neutral-500 font-medium">Sovereign Key Display</h2>
          <div className="border border-neutral-800 rounded-xl bg-neutral-950 p-6 flex flex-col space-y-6 relative overflow-hidden">
            {/* Background flair */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-neutral-800 rounded-full blur-[100px] opacity-20 pointer-events-none -translate-y-1/2 translate-x-1/2" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center z-10 gap-4">
              <div>
                <h3 className="text-lg text-white font-medium mb-2">Active License Key</h3>
                <div className="flex items-center space-x-2 text-sm text-emerald-500">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </div>
                  <span>Valid - Expires in 6d 14h (Auto-renews via telemetry)</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setShowKey(!showKey)}
                  className="flex items-center space-x-2 text-sm px-4 py-2 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900 hover:bg-neutral-800 transition-all text-neutral-300"
                >
                  {showKey ? <EyeOffIcon /> : <EyeIcon />}
                  <span>{showKey ? "Hide" : "Reveal"}</span>
                </button>
                <button 
                  onClick={handleCopy}
                  className="flex items-center space-x-2 text-sm px-4 py-2 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900 hover:bg-neutral-800 transition-all text-neutral-300"
                >
                  <CopyIcon />
                  <span>{copied ? "Copied" : "Copy to Clipboard"}</span>
                </button>
                <button 
                  className="flex items-center space-x-2 text-sm px-4 py-2 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900 hover:bg-neutral-800 transition-all text-neutral-300"
                >
                  <RefreshCwIcon />
                  <span>Rotate Key</span>
                </button>
              </div>
            </div>

            <div className="relative group z-10 w-full overflow-hidden">
              <div className={`font-mono text-sm break-all p-4 rounded-lg border border-neutral-800 bg-black text-neutral-400 transition-all duration-500 ${!showKey ? 'blur-md select-none opacity-50' : 'blur-0 opacity-100'}`}>
                {dummyKey}
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Modular Architecture Engine */}
        <section className="space-y-4 relative z-10">
          <h2 className="text-xs uppercase tracking-widest text-neutral-500 font-medium">Modular Architecture Engine</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Module 1 */}
            <div 
              className={`border rounded-xl p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[140px] group ${modules.aegis ? 'border-neutral-400 bg-neutral-900 shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'}`}
              onClick={() => handleToggle('aegis')}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-white group-hover:text-neutral-100 transition-colors">Aegis Cryptographic Firewall</h3>
                <div className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors duration-300 ${modules.aegis ? 'bg-white' : 'bg-neutral-800'}`}>
                  <div className={`w-4 h-4 rounded-full bg-black transition-transform duration-300 shadow-sm ${modules.aegis ? 'translate-x-5' : 'bg-neutral-400'}`} />
                </div>
              </div>
              <div className="flex justify-between items-end mt-6">
                <p className="text-sm text-neutral-500 max-w-[75%] leading-relaxed">Line-rate Ed25519 signature verification and interdiction.</p>
                <span className="font-mono text-sm text-neutral-300">$499/mo</span>
              </div>
            </div>

            {/* Module 2 */}
            <div 
              className={`border rounded-xl p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[140px] group ${modules.temporal ? 'border-neutral-400 bg-neutral-900 shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'}`}
              onClick={() => handleToggle('temporal')}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-white group-hover:text-neutral-100 transition-colors">Temporal Router (Time Machine)</h3>
                <div className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors duration-300 ${modules.temporal ? 'bg-white' : 'bg-neutral-800'}`}>
                  <div className={`w-4 h-4 rounded-full bg-black transition-transform duration-300 shadow-sm ${modules.temporal ? 'translate-x-5' : 'bg-neutral-400'}`} />
                </div>
              </div>
              <div className="flex justify-between items-end mt-6">
                <p className="text-sm text-neutral-500 max-w-[75%] leading-relaxed">Deterministic memory scrubbing and reality forking.</p>
                <span className="font-mono text-sm text-neutral-300">$899/mo</span>
              </div>
            </div>

            {/* Module 3 */}
            <div 
              className={`border rounded-xl p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[140px] group ${modules.crdt ? 'border-neutral-400 bg-neutral-900 shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'}`}
              onClick={() => handleToggle('crdt')}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-white group-hover:text-neutral-100 transition-colors">Global CRDT State</h3>
                <div className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors duration-300 ${modules.crdt ? 'bg-white' : 'bg-neutral-800'}`}>
                  <div className={`w-4 h-4 rounded-full bg-black transition-transform duration-300 shadow-sm ${modules.crdt ? 'translate-x-5' : 'bg-neutral-400'}`} />
                </div>
              </div>
              <div className="flex justify-between items-end mt-6">
                <p className="text-sm text-neutral-500 max-w-[75%] leading-relaxed">Conflict-free resolution across global edge nodes.</p>
                <span className="font-mono text-sm text-neutral-300">$1,200/mo</span>
              </div>
            </div>

            {/* Module 4 */}
            <div 
              className={`border rounded-xl p-5 transition-all duration-300 flex flex-col justify-between min-h-[140px] group ${modules.a2a ? 'border-neutral-400 bg-neutral-900 shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'border-neutral-800 bg-neutral-950'} ${modules.crdt ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-neutral-700'}`}
              onClick={() => {
                if (!modules.crdt) handleToggle('a2a');
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-white">Global A2A Routing</h3>
                  {modules.crdt && (
                    <div className="group/tooltip relative flex items-center">
                      <span className="text-neutral-500 hover:text-neutral-400 transition-colors cursor-help"><InfoIcon /></span>
                      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-neutral-800 text-xs text-neutral-200 px-3 py-1.5 rounded-md opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap border border-neutral-700 shadow-lg">
                        Required by Global CRDT
                      </div>
                    </div>
                  )}
                </div>
                <div className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors duration-300 ${modules.a2a ? 'bg-white' : 'bg-neutral-800'}`}>
                  <div className={`w-4 h-4 rounded-full bg-black transition-transform duration-300 shadow-sm ${modules.a2a ? 'translate-x-5' : 'bg-neutral-400'}`} />
                </div>
              </div>
              <div className="flex justify-between items-end mt-6">
                <p className="text-sm text-neutral-500 max-w-[75%] leading-relaxed">Zenoh-powered inter-agent mesh.</p>
                <span className="font-mono text-sm text-neutral-300">$200/mo</span>
              </div>
            </div>

          </div>
        </section>

      </div>

      {/* Section 3: Billing Summary */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 border border-neutral-800/80 bg-black/60 backdrop-blur-xl z-50 p-4 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] w-[calc(100%-2rem)] max-w-3xl flex flex-col sm:flex-row justify-between items-center sm:space-y-0 space-y-4 transition-all hover:border-neutral-700">
        <div className="flex flex-col px-4 w-full sm:w-auto text-center sm:text-left">
          <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold mb-1">Monthly Total</span>
          <div className="flex items-baseline justify-center sm:justify-start space-x-2">
            <span className="text-2xl font-medium text-white font-mono">${totalCost.toLocaleString()}</span>
            <span className="text-sm text-neutral-500 font-mono">/ mo</span>
          </div>
        </div>
        <button 
          onClick={handleSubmit}
          className="w-full sm:w-auto bg-white text-black px-8 py-3.5 rounded-xl text-sm font-semibold hover:bg-neutral-200 transition-all focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 focus:ring-offset-black active:scale-[0.98]"
        >
          Update Infrastructure Plan
        </button>
      </div>

    </div>
  );
}
