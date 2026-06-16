"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useTenantStore } from "@/store/useTenantStore";
import { X, Check, Copy, AlertTriangle, Loader, Shield, Globe, Clock, Lock } from "lucide-react";

// Modal Shell components in styled-components
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
  animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalBox = styled.div`
  background: #09090b;
  border: 1px solid #27272a;
  border-radius: 16px;
  width: 100%;
  max-width: 580px;
  box-shadow: 0 0 50px rgba(0, 0, 0, 0.8), 0 0 20px rgba(6, 182, 212, 0.05);
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;

  @keyframes scaleIn {
    from {
      transform: scale(0.95) translateY(10px);
      opacity: 0;
    }
    to {
      transform: scale(1) translateY(0);
      opacity: 1;
    }
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, #06b6d4, transparent);
  }
`;

const ModalHeader = styled.div`
  padding: 24px;
  border-b: 1px solid rgba(39, 39, 42, 0.5);
  display: flex;
  justify-content: space-between;
  align-items: start;
`;

const ModalTitle = styled.h2`
  color: #ffffff;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #71717a;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.15s ease;

  &:hover {
    color: #ffffff;
    background: #18181b;
  }
`;

// Toggles (Complex Inputs) in styled-components
const ToggleRow = styled.div<{ $locked?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: ${props => props.$locked ? 'rgba(24, 24, 27, 0.4)' : '#09090b'};
  border: 1px solid #18181b;
  border-radius: 12px;
  transition: all 0.2s ease;
  opacity: ${props => props.$locked ? 0.75 : 1};

  &:hover {
    border-color: ${props => props.$locked ? '#18181b' : '#27272a'};
    background: ${props => props.$locked ? 'rgba(24, 24, 27, 0.4)' : '#121214'};
  }
`;

const ToggleInfo = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const IconWrapper = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: ${props => props.$active ? 'rgba(6, 182, 212, 0.1)' : '#18181b'};
  color: ${props => props.$active ? '#22d3ee' : '#71717a'};
  border: 1px solid ${props => props.$active ? 'rgba(6, 182, 212, 0.2)' : 'transparent'};
  transition: all 0.2s ease;
`;

const ToggleText = styled.div`
  display: flex;
  flex-direction: column;
`;

const ToggleLabel = styled.span`
  color: #f4f4f5;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ToggleDesc = styled.span`
  color: #71717a;
  font-size: 12px;
  margin-top: 2px;
`;

const SwitchTrack = styled.div<{ $checked: boolean; $disabled?: boolean }>`
  width: 44px;
  height: 24px;
  background: ${props => props.$checked ? '#06b6d4' : '#27272a'};
  border-radius: 9999px;
  position: relative;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  border: 1px solid ${props => props.$checked ? '#22d3ee' : '#3f3f46'};
  box-shadow: ${props => props.$checked ? '0 0 10px rgba(6, 182, 212, 0.15)' : 'none'};
`;

const SwitchThumb = styled.div<{ $checked: boolean }>`
  width: 18px;
  height: 18px;
  background: #ffffff;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: ${props => props.$checked ? '22px' : '2px'};
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
`;

const Badge = styled.span`
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
  color: #fbbf24;
  font-size: 10px;
  font-family: monospace;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  display: flex;
  align-items: center;
  gap: 4px;
`;

// Success and warning components
const SuccessIconBox = styled.div`
  width: 48px;
  height: 48px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  color: #10b981;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
`;

const WarningBox = styled.div`
  background: rgba(239, 68, 68, 0.04);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 10px;
  padding: 14px 16px;
  color: #f87171;
  font-size: 13px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 16px;
  line-height: 1.5;

  strong {
    color: #ef4444;
  }
`;

const JWTDisplayBox = styled.div`
  background: #000000;
  border: 1px solid #18181b;
  border-radius: 10px;
  padding: 16px;
  margin-top: 16px;
  position: relative;
  max-width: 100%;
`;

const JWTPresentation = styled.pre`
  color: #22d3ee;
  font-family: monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 150px;
  overflow-y: auto;
  line-height: 1.6;
  padding-right: 24px;
  margin: 0;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: #000;
  }
  &::-webkit-scrollbar-thumb {
    background: #27272a;
    border-radius: 3px;
  }
`;

const CopyButton = styled.button<{ $copied: boolean }>`
  position: absolute;
  top: 10px;
  right: 10px;
  background: #18181b;
  border: 1px solid #27272a;
  color: ${props => props.$copied ? '#10b981' : '#a1a1aa'};
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: #ffffff;
    border-color: #3f3f46;
    background: #27272a;
  }
`;

const ErrorToast = styled.div`
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #f87171;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  animation: slideDown 0.2s ease-out;

  @keyframes slideDown {
    from { transform: translateY(-10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

interface MintLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessCallback?: () => void;
}

export function MintLicenseModal({ isOpen, onClose, onSuccessCallback }: MintLicenseModalProps) {
  const { organizations, activeOrganizationId } = useTenantStore();
  
  // Find current active organization
  const activeOrg = organizations.find((org) => org.id === activeOrganizationId);
  const planTier = activeOrg?.plan_tier || "OPEN_CORE";
  const orgId = activeOrganizationId;

  // Features claims selected state
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());
  
  // States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mintedKey, setMintedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Re-sync plan settings when modal is opened or plan changed
  useEffect(() => {
    if (isOpen) {
      setSelectedFeatures(new Set());
      setMintedKey(null);
      setErrorMessage(null);
      setCopied(false);
    }
  }, [isOpen, planTier]);

  if (!isOpen) return null;

  const isStartup = planTier === "STARTUP";
  const isOpenCore = planTier === "OPEN_CORE";
  const isLocked = isStartup || isOpenCore;

  // Toggle switch handler with constraint dependencies
  const handleFeatureToggle = (feature: string) => {
    // If feature is plan-locked, block it
    if ((feature === "time_travel" || feature === "aegis") && isLocked) {
      return;
    }

    const nextFeatures = new Set(selectedFeatures);

    if (feature === "global_crdt") {
      const isChecking = !nextFeatures.has("global_crdt");
      if (isChecking) {
        nextFeatures.add("global_crdt");
        nextFeatures.add("global_a2a"); // Auto-check global_a2a dependency
      } else {
        nextFeatures.delete("global_crdt");
      }
    } else if (feature === "global_a2a") {
      const isChecking = !nextFeatures.has("global_a2a");
      if (isChecking) {
        nextFeatures.add("global_a2a");
      } else {
        nextFeatures.delete("global_a2a");
        nextFeatures.delete("global_crdt"); // Auto-uncheck global_crdt because it requires WAN mesh
      }
    } else {
      if (nextFeatures.has(feature)) {
        nextFeatures.delete(feature);
      } else {
        nextFeatures.add(feature);
      }
    }

    setSelectedFeatures(nextFeatures);
  };

  // Submit and mint license
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) {
      setErrorMessage("No active organization found in Zustand store context.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          requested_features: Array.from(selectedFeatures),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Failed to generate license key.`);
      }

      setMintedKey(data.license_key);
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected network error occurred during cryptographic minting.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!mintedKey) return;
    navigator.clipboard.writeText(mintedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Overlay onClick={(e) => e.target === e.currentTarget && !isLoading && onClose()}>
      <ModalBox>
        {/* Header */}
        <ModalHeader>
          <div>
            <ModalTitle>
              {mintedKey ? "Sovereign License Key Minted" : "Provision Cryptographic Features"}
            </ModalTitle>
            <p className="text-zinc-500 text-xs mt-1">
              Active Tenant: <span className="font-mono text-zinc-300 font-semibold">{activeOrg?.alias || "NO_TENANT"}</span> ({planTier.replace("_", " ")})
            </p>
          </div>
          <CloseButton onClick={onClose} disabled={isLoading}>
            <X className="w-5 h-5" />
          </CloseButton>
        </ModalHeader>

        {/* Success View */}
        {mintedKey ? (
          <div className="p-6 pt-2 flex flex-col">
            <div className="flex flex-col items-center justify-center text-center mt-2">
              <SuccessIconBox>
                <Check className="w-6 h-6" />
              </SuccessIconBox>
              <h3 className="text-white font-medium text-lg">Cryptographic Passport Generated</h3>
              <p className="text-zinc-400 text-sm mt-1 max-w-sm">
                Your RSA-signed JWT is ready to authenticate local swarms at the edge.
              </p>
            </div>

            <JWTDisplayBox>
              <JWTPresentation>{mintedKey}</JWTPresentation>
              <CopyButton $copied={copied} onClick={handleCopy} title="Copy JWT to clipboard">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </CopyButton>
            </JWTDisplayBox>

            <WarningBox>
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <div>
                <strong>Security Notice:</strong> This is a cryptographically signed identity passport. It will only be shown once. Copy it to your <code>raqim.toml</code> file immediately.
              </div>
            </WarningBox>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-semibold text-sm hover:bg-zinc-800 transition-colors"
              >
                Close Machine Interface
              </button>
            </div>
          </div>
        ) : (
          /* Feature Provisioning Toggles View */
          <form onSubmit={handleSubmit} className="p-6 pt-2 flex flex-col">
            {errorMessage && (
              <ErrorToast>
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <div className="flex-1">{errorMessage}</div>
                <CloseButton type="button" onClick={() => setErrorMessage(null)} className="!p-1">
                  <X className="w-4 h-4" />
                </CloseButton>
              </ErrorToast>
            )}

            <div className="space-y-4">
              {/* Toggle 1: Global WAN Mesh */}
              <ToggleRow onClick={() => handleFeatureToggle("global_a2a")}>
                <ToggleInfo>
                  <IconWrapper $active={selectedFeatures.has("global_a2a")}>
                    <Globe className="w-5 h-5" />
                  </IconWrapper>
                  <ToggleText>
                    <ToggleLabel>Global WAN Mesh</ToggleLabel>
                    <ToggleDesc>Zenoh-powered inter-agent routing</ToggleDesc>
                  </ToggleText>
                </ToggleInfo>
                <SwitchTrack $checked={selectedFeatures.has("global_a2a")}>
                  <SwitchThumb $checked={selectedFeatures.has("global_a2a")} />
                </SwitchTrack>
              </ToggleRow>

              {/* Toggle 2: Distributed CRDT Sync */}
              <ToggleRow onClick={() => handleFeatureToggle("global_crdt")}>
                <ToggleInfo>
                  <IconWrapper $active={selectedFeatures.has("global_crdt")}>
                    <Shield className="w-5 h-5" />
                  </IconWrapper>
                  <ToggleText>
                    <ToggleLabel>Distributed CRDT Sync</ToggleLabel>
                    <ToggleDesc>Conflict-free merge replication (Requires WAN Mesh)</ToggleDesc>
                  </ToggleText>
                </ToggleInfo>
                <SwitchTrack $checked={selectedFeatures.has("global_crdt")}>
                  <SwitchThumb $checked={selectedFeatures.has("global_crdt")} />
                </SwitchTrack>
              </ToggleRow>

              {/* Toggle 3: Temporal Routing */}
              <ToggleRow $locked={isLocked} onClick={() => handleFeatureToggle("time_travel")}>
                <ToggleInfo>
                  <IconWrapper $active={selectedFeatures.has("time_travel")}>
                    <Clock className="w-5 h-5" />
                  </IconWrapper>
                  <ToggleText>
                    <ToggleLabel>
                      Temporal Routing
                      {isLocked && <Badge><Lock className="w-2.5 h-2.5" /> Upgrade to Pro</Badge>}
                    </ToggleLabel>
                    <ToggleDesc>Deterministic memory scrub and replay engine</ToggleDesc>
                  </ToggleText>
                </ToggleInfo>
                <SwitchTrack $checked={selectedFeatures.has("time_travel")} $disabled={isLocked}>
                  <SwitchThumb $checked={selectedFeatures.has("time_travel")} />
                </SwitchTrack>
              </ToggleRow>

              {/* Toggle 4: Aegis Firewall */}
              <ToggleRow $locked={isLocked} onClick={() => handleFeatureToggle("aegis")}>
                <ToggleInfo>
                  <IconWrapper $active={selectedFeatures.has("aegis")}>
                    <Shield className="w-5 h-5" />
                  </IconWrapper>
                  <ToggleText>
                    <ToggleLabel>
                      Aegis Firewall
                      {isLocked && <Badge><Lock className="w-2.5 h-2.5" /> Upgrade to Pro</Badge>}
                    </ToggleLabel>
                    <ToggleDesc>Line-rate cryptographic firewall rules</ToggleDesc>
                  </ToggleText>
                </ToggleInfo>
                <SwitchTrack $checked={selectedFeatures.has("aegis")} $disabled={isLocked}>
                  <SwitchThumb $checked={selectedFeatures.has("aegis")} />
                </SwitchTrack>
              </ToggleRow>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-lg border border-zinc-800 text-zinc-400 font-semibold text-sm hover:text-white hover:bg-zinc-900 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 rounded-lg bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>Minting Passport...</span>
                  </>
                ) : (
                  <span>Mint License Key</span>
                )}
              </button>
            </div>
          </form>
        )}
      </ModalBox>
    </Overlay>
  );
}
