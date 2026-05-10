"use client";

import React, { useState } from 'react';

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
const RefreshCwIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
);
const LoaderIcon = () => (
  <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
);

interface LicenseManagerProps {
  planTier: string;
  initialJwt?: string;
  orgId: string;
}

export function LicenseManager({ planTier, initialJwt = '', orgId }: LicenseManagerProps) {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [currentJwt, setCurrentJwt] = useState(initialJwt);
  const [error, setError] = useState<string | null>(null);

  const isDisabled = planTier === 'OPEN_CORE';

  const handleCopy = () => {
    if (!currentJwt) return;
    navigator.clipboard.writeText(currentJwt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/license/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate license');
      }
      
      setCurrentJwt(data.jwt_hash);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRegenerating(false);
    }
  };

  if (isDisabled) {
    return (
      <section className="space-y-6 pt-4 opacity-50 select-none pointer-events-none grayscale">
        <div className="border border-zinc-800 rounded-xl bg-zinc-950 p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[200px]">
          <LockIcon className="w-8 h-8 text-zinc-600 mb-4" />
          <p className="text-zinc-400 font-medium">Upgrade to Startup or Enterprise to generate a Sovereign License Key.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6 pt-4">
      <div className="border border-zinc-800 rounded-xl bg-zinc-950 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-zinc-800 rounded-full blur-[100px] opacity-10 pointer-events-none -translate-y-1/2 translate-x-1/2" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center z-10 gap-4 mb-6 relative">
          <div>
            <h2 className="text-lg font-medium text-white mb-1">Active License Key</h2>
            <p className="text-sm text-zinc-500 max-w-xl">Configure your daemon by copying this key to your local configuration.</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex items-center space-x-2 text-sm px-4 py-2.5 rounded-lg transition-all font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700"
            >
              {isRegenerating ? <LoaderIcon /> : <RefreshCwIcon />}
              <span>{isRegenerating ? "Regenerating..." : "Regenerate License"}</span>
            </button>
            <button 
              onClick={() => setShowKey(!showKey)}
              disabled={!currentJwt}
              className="flex items-center space-x-2 text-sm px-4 py-2.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 hover:bg-zinc-800 transition-all text-zinc-300 disabled:opacity-50"
            >
              {showKey ? <EyeOffIcon /> : <EyeIcon />}
              <span>{showKey ? "Hide" : "Reveal"}</span>
            </button>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mb-4 relative z-10">{error}</p>}

        <div className="relative group z-10 w-full overflow-hidden">
          <div className={`font-mono text-sm break-all p-5 rounded-lg border border-zinc-800 bg-black text-zinc-400 transition-all duration-500 shadow-inner ${!showKey ? 'blur-[6px] select-none opacity-50' : 'blur-0 opacity-100'} min-h-[80px]`}>
            {currentJwt || 'No active license key found. Regenerate to create one.'}
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between border-t border-zinc-800/50 pt-4 relative z-10">
          <div className="flex items-center space-x-2 text-xs font-mono text-zinc-500">
            <InfoIcon />
            <span>Your license automatically rotates every 7 days via Telemetry Ping. Do not share this key.</span>
          </div>
          <button 
            onClick={handleCopy}
            disabled={!currentJwt}
            className="flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-md hover:bg-zinc-800 transition-all text-zinc-400 disabled:opacity-50"
          >
            <CopyIcon />
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>
    </section>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
  );
}
