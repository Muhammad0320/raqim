"use client";

import React, { useState } from 'react';
import { MintLicenseModal } from '@/components/MintLicenseModal';

interface VendingMachineProps {
  orgId: string;
  planTier: string;
  activeJwt?: string;
  issueDate?: string;
}

export function LicenseVendingMachine({ orgId, planTier, activeJwt, issueDate }: VendingMachineProps) {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);

  const handleCopy = () => {
    if (!activeJwt) return;
    navigator.clipboard.writeText(activeJwt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isEnterprise = planTier === 'ENTERPRISE';
  const isStartup = planTier === 'STARTUP';
  const isOpenCore = planTier === 'OPEN_CORE';

  return (
    <div className="border border-zinc-800 bg-zinc-950/50 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-900/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
      
      <div className="flex justify-between items-start mb-6 z-10 relative">
        <div>
          <h3 className="text-white font-medium mb-1 tracking-tight">Sovereign License</h3>
          <p className="text-zinc-500 text-sm">
            {issueDate ? `Issued ${new Date(issueDate).toLocaleDateString()}` : "No active license"}
          </p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setIsMintModalOpen(true)}
            className="px-3 py-1.5 text-xs font-medium border border-zinc-800/50 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-lg transition-all"
          >
            Mint License
          </button>
          <button 
            onClick={() => setShowKey(!showKey)}
            disabled={!activeJwt}
            className="px-3 py-1.5 text-xs font-medium border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-lg transition-all disabled:opacity-50"
          >
            {showKey ? "Hide Key" : "Reveal Key"}
          </button>
        </div>
      </div>

      <div className="relative group z-10 w-full overflow-hidden mb-6">
        <div className={`font-mono text-xs break-all p-4 rounded-xl border border-zinc-800 bg-black text-cyan-400 transition-all duration-500 shadow-inner min-h-[70px] ${!showKey ? 'blur-[8px] select-none opacity-40' : 'blur-0 opacity-100'}`}>
          {activeJwt || (isOpenCore ? "Upgrade to generate a license." : "No license active.")}
        </div>
      </div>

      <div className="border-t border-zinc-800/50 pt-4 z-10 relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <ModuleTag label="LOCAL_SWARM" active={true} />
          <ModuleTag label="GLOBAL_WAN" active={!isOpenCore} />
          <ModuleTag label="AEGIS_FIREWALL" active={isEnterprise} />
          <ModuleTag label="GLOBAL_CRDT" active={isEnterprise} />
          <ModuleTag label="TIME_TRAVEL" active={isEnterprise} />
        </div>
        
        <button 
          onClick={handleCopy}
          disabled={!activeJwt}
          className="flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-md hover:bg-zinc-800 transition-all text-zinc-400 disabled:opacity-50"
        >
          <span>{copied ? "Copied!" : "Copy to Clipboard"}</span>
        </button>
      </div>

      <MintLicenseModal 
        isOpen={isMintModalOpen} 
        onClose={() => setIsMintModalOpen(false)} 
        onSuccessCallback={() => {
          // Force layout refresh of data
          window.location.reload();
        }}
      />
    </div>
  );
}

function ModuleTag({ label, active }: { label: string, active: boolean }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono border ${
      active 
      ? 'bg-cyan-950/30 border-cyan-900/50 text-cyan-400' 
      : 'bg-zinc-900 border-zinc-800 text-zinc-600'
    }`}>
      {label}: {active ? 'ON' : 'OFF'}
    </span>
  );
}
