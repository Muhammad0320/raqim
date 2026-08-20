'use client';

import React, { useState } from 'react';
import { QuarantineRecord } from '../../lib/api';
import { liftQuarantine } from '../../actions/admin';
import { ShieldAlert, X, Copy, Check, Terminal, AlertTriangle, Send } from 'lucide-react';

interface RemediationDrawerProps {
  record: QuarantineRecord | null;
  onClose: () => void;
  onSuccess: (agentHex: string) => void;
  onError: (msg: string) => void;
}

export function RemediationDrawer({
  record,
  onClose,
  onSuccess,
  onError,
}: RemediationDrawerProps) {
  const [promptOverride, setPromptOverride] = useState(
    '[INJECT: HIGH_PRIORITY_EVICTION]\nForget previous execution branch and poisoned memory context.\nYou are rebooting into the canonical swarm timeline with zero corrupted state.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedHex, setCopiedHex] = useState(false);

  if (!record) return null;

  const handleCopyHex = () => {
    navigator.clipboard.writeText(record.agent_hex);
    setCopiedHex(true);
    setTimeout(() => setCopiedHex(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptOverride.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await liftQuarantine(record.agent_hex, promptOverride.trim());
      if (res.success) {
        onSuccess(record.agent_hex);
        onClose();
      } else {
        onError(res.error || 'Failed to dispatch eviction directive.');
      }
    } catch (err: any) {
      onError(err.message || 'Network error executing quarantine lift.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Click outside to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-over drawer */}
      <aside className="w-full sm:w-[500px] bg-[#070B12] border-l border-rose-900/60 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="bg-[#0B101B] border-b border-rose-900/40 p-3.5 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span className="font-sans text-xs uppercase tracking-wider font-bold text-white">
              Remediation &amp; Context Eviction
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-xs hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
          {/* Target Agent Hex */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-sans tracking-wider">
              <span>Target Agent Identity</span>
              <button
                type="button"
                onClick={handleCopyHex}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
              >
                {copiedHex ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>COPIED</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>COPY HEX</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xs border border-rose-900/50 text-rose-400 font-bold break-all">
              {record.agent_hex}
            </div>
          </div>

          {/* Breach Forensics Panel */}
          <div className="bg-slate-950/80 p-3 rounded-xs border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-1.5 text-amber-400 font-sans text-[11px] font-bold uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Interdiction Forensics</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-sans block">Violation Type</span>
                <span className="text-rose-400 font-bold">{record.violation_type}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-sans block">Attempted Path</span>
                <span className="text-amber-300 font-medium truncate block">{record.attempted_path}</span>
              </div>
            </div>

            {record.payload_preview && (
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-slate-400 text-[10px] uppercase font-sans block mb-1">
                  Payload Intercept Preview
                </span>
                <pre className="bg-black/80 p-2 rounded-xs border border-slate-900 text-slate-300 text-[10px] whitespace-pre-wrap break-words max-h-24 overflow-y-auto">
                  {record.payload_preview}
                </pre>
              </div>
            )}
          </div>

          {/* Out-Of-Band System Prompt Re-Seed */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 text-[11px] uppercase font-sans tracking-wider font-bold flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Out-Of-Band Re-Seed System Prompt</span>
              </label>
              <span className="text-[10px] text-cyan-400/80">ZENOH MEMORY FLUSH</span>
            </div>
            <textarea
              required
              value={promptOverride}
              onChange={(e) => setPromptOverride(e.target.value)}
              placeholder="Enter clean system prompt to flush corrupted Python memory context..."
              disabled={isSubmitting}
              className="w-full h-36 p-3 bg-slate-950 border border-slate-800 focus:border-cyan-500/70 rounded-xs text-[11px] font-mono text-slate-200 placeholder:text-slate-400 outline-none resize-y leading-relaxed"
            />
            <p className="text-[10px] text-slate-400 normal-case leading-normal">
              Injecting this prompt will overwrite poisoned RAM vectors, lift the Aegis firewall block, and re-admit the enclave to the cluster.
            </p>
          </div>

          {/* Drawer Actions Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 rounded-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-sans text-xs font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !promptOverride.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xs bg-rose-950/80 hover:bg-rose-900 border border-rose-600 text-rose-200 font-mono text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-[0_0_12px_rgba(244,63,94,0.25)]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? '[ EVICTING & RESEEDING... ]' : '[ DISPATCH EVICTION & RESTORE RUNTIME ]'}</span>
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
