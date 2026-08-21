'use client';

import React, { useState } from 'react';
import { mintCertificate } from '../../actions/admin';
import { Key, Download, Copy, Check, ShieldCheck, Cpu } from 'lucide-react';

interface CaMintStationProps {
  availableGroups: string[];
}

export function CaMintStation({ availableGroups }: CaMintStationProps) {
  const [agentHex, setAgentHex] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(
    availableGroups.length > 0 ? availableGroups[0] : 'admin_group'
  );
  const [isMinting, setIsMinting] = useState(false);
  const [certHex, setCertHex] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCert, setCopiedCert] = useState(false);

  // Validate 32-character hex ID (or 32-char hex string)
  const isValidHex = /^[0-9a-fA-F]{32}$/.test(agentHex.trim());

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidHex) {
      setErrorMsg('Agent ID must be an exact 32-character hexadecimal string.');
      return;
    }

    setIsMinting(true);
    setErrorMsg(null);
    setCertHex(null);

    try {
      const res = await mintCertificate(agentHex.trim(), selectedGroup);
      if (res.success && res.certHex) {
        setCertHex(res.certHex);
      } else {
        setErrorMsg(res.error || 'Failed to mint capability passport.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with Aegis CA.');
    } finally {
      setIsMinting(false);
    }
  };

  const handleCopyCert = () => {
    if (!certHex) return;
    navigator.clipboard.writeText(certHex);
    setCopiedCert(true);
    setTimeout(() => setCopiedCert(false), 2000);
  };

  const handleDownloadCert = () => {
    if (!certHex) return;
    const blob = new Blob([certHex], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent_${agentHex.slice(0, 8)}_${selectedGroup}.cert`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#0D1322] border border-slate-800 rounded-sm p-3.5 flex flex-col gap-3 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800 select-none">
        <div className="flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider font-bold text-slate-200">
          <Key className="w-3.5 h-3.5 text-purple-400" />
          <span>Swarm CA Certificate Minting Station</span>
        </div>
        <span className="font-mono text-[10px] text-purple-400 font-bold">
          ED25519 MASTER KEY
        </span>
      </div>

      {/* Minting Form */}
      <form onSubmit={handleMint} className="space-y-3 font-mono text-xs">
        {/* Agent Hex Input */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-slate-400 text-[10px] uppercase font-sans tracking-wider font-semibold">
              Agent Identity Hex (32-Char)
            </label>
            <span className={`text-[10px] ${isValidHex ? 'text-emerald-400' : 'text-slate-400'}`}>
              {agentHex.trim().length} / 32 HEX
            </span>
          </div>
          <div className="relative">
            <input
              type="text"
              required
              value={agentHex}
              onChange={(e) => setAgentHex(e.target.value)}
              placeholder="e.g. 096da8e8a1b2c3d4e5f60718293a4b5c"
              disabled={isMinting}
              className={`w-full px-3 py-1.5 bg-slate-950 border rounded-xs text-[11px] font-mono text-slate-200 placeholder:text-slate-400 outline-none transition-colors ${
                agentHex.trim().length > 0 && !isValidHex
                  ? 'border-rose-700/80 focus:border-rose-500'
                  : 'border-slate-800 focus:border-purple-500/80'
              }`}
            />
            {isValidHex && (
              <Check className="w-3.5 h-3.5 text-emerald-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
            )}
          </div>
        </div>

        {/* Security Group Selector */}
        <div className="space-y-1">
          <label className="text-slate-400 text-[10px] uppercase font-sans tracking-wider font-semibold block">
            Target Security Policy Group
          </label>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            disabled={isMinting}
            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 focus:border-purple-500/80 rounded-xs text-[11px] font-mono text-slate-200 outline-none cursor-pointer"
          >
            {availableGroups.length > 0 ? (
              availableGroups.map((grp) => (
                <option key={grp} value={grp}>
                  {grp}
                </option>
              ))
            ) : (
              <>
                <option value="admin_group">admin_group (Unrestricted * ACL)</option>
                <option value="finance_worker">finance_worker (/rqm_finance/* ACL)</option>
                <option value="default_agent">default_agent (Standard Tier)</option>
              </>
            )}
          </select>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-2 rounded-xs bg-rose-950/60 border border-rose-800/80 text-rose-300 text-[11px]">
            {errorMsg}
          </div>
        )}

        {/* Mint Button */}
        <button
          type="submit"
          disabled={isMinting || !isValidHex}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xs bg-purple-950/70 hover:bg-purple-900/90 border border-purple-600/80 text-purple-200 font-mono text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
        >
          <Cpu className="w-3.5 h-3.5 text-purple-400" />
          <span>{isMinting ? '[ SIGNING PASSPORT... ]' : '[ MINT CAPABILITY PASSPORT ]'}</span>
        </button>
      </form>

      {/* Minted Certificate Output Box */}
      {certHex && (
        <div className="mt-2 pt-3 border-t border-slate-800/80 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-sans font-semibold">
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Signed Passport Generated
            </span>
            <span className="font-mono text-slate-400">{certHex.length / 2} BYTES</span>
          </div>

          <textarea
            readOnly
            value={certHex}
            className="w-full h-20 p-2 bg-slate-950 border border-emerald-800/60 rounded-xs text-[10px] font-mono text-emerald-400 outline-none resize-none leading-tight"
          />

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCert}
              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[10px] uppercase tracking-wider transition-colors"
            >
              {copiedCert ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>COPIED</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-slate-400" />
                  <span>COPY HEX</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadCert}
              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xs bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-700/80 text-emerald-300 font-mono text-[10px] uppercase tracking-wider transition-colors"
            >
              <Download className="w-3 h-3 text-emerald-400" />
              <span>DOWNLOAD .CERT</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
