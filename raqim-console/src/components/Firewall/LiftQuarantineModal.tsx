import React from 'react';

interface LiftQuarantineModalProps {
  agentHex: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LiftQuarantineModal({ agentHex, isOpen, onClose, onConfirm }: LiftQuarantineModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-error/50 shadow-[0_0_40px_rgba(255,0,0,0.2)] w-[500px] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-error/10 border-b border-error/30 px-6 py-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-error animate-pulse">warning</span>
          <h2 className="font-mono text-error text-lg uppercase tracking-widest font-bold">Enforce Entropy Reset</h2>
        </div>
        
        {/* Body */}
        <div className="p-6 flex flex-col gap-4">
          <p className="font-body text-on-surface-variant text-sm">
            You are about to lift the quarantine order for agent <span className="font-mono text-[#00f3ff] bg-[#00f3ff]/10 px-1 py-0.5 rounded">{agentHex}</span>.
          </p>
          <div className="bg-error/5 border border-error/20 p-4 rounded-sm">
            <p className="font-mono text-xs text-error/80 leading-relaxed">
              WARNING: This action bypasses the automated cryptographic heuristics engine. Reintroducing a compromised node may lead to full namespace poisoning.
            </p>
          </div>
          <p className="font-mono text-xs text-on-surface-variant mt-2">
            Do you wish to proceed and inject a forced entropy reset?
          </p>
        </div>

        {/* Footer */}
        <div className="bg-zinc-900/50 border-t border-outline-variant/10 px-6 py-4 flex justify-end gap-4">
          <button 
            onClick={onClose}
            className="font-mono text-xs text-on-surface-variant hover:text-white uppercase tracking-widest px-4 py-2 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="font-mono text-xs bg-error hover:bg-error/80 text-white uppercase tracking-widest font-bold px-6 py-2 shadow-[0_0_15px_rgba(255,0,0,0.5)] transition-all"
          >
            Confirm Lift
          </button>
        </div>
      </div>
    </div>
  );
}
