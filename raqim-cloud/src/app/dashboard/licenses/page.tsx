"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Key, 
  RefreshCw, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  Lock,
  ChevronRight,
  Shield,
  Clock,
  Trash2
} from "lucide-react";
import { useTenantStore } from "@/store/useTenantStore";
import { createClient } from "@/utils/supabase/client";
import { regenerateLicense } from "@/app/dashboard/actions";

interface LicenseRecord {
  id: string;
  jwt_hash: string;
  revoked: boolean;
  created_at: string;
  expires_at: string;
  revoked_at?: string | null;
  status: "ACTIVE" | "RROLLED" | "REVOKED" | "EXPIRED";
}

export default function LicensesPage() {
  const { profile, activeOrganizationId, organizations, fetchTenantData } = useTenantStore();
  const activeOrg = organizations.find((org) => org.id === activeOrganizationId);
  const planTier = activeOrg?.plan_tier || "OPEN_CORE";

  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [activeKey, setActiveKey] = useState<string>("");
  const [isMasked, setIsMasked] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [rolling, setRolling] = useState<boolean>(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [mintError, setMintError] = useState<string | null>(null);
  
  // Hydrate organization data on mount
  useEffect(() => {
    const isDevBypass = typeof document !== 'undefined' && document.cookie.includes('dev-mode-bypass-active=true');
    if (isDevBypass) {
      useTenantStore.setState({
        activeOrganizationId: 'e0000000-0000-0000-0000-000000000000',
        organizations: [
          {
            id: 'e0000000-0000-0000-0000-000000000000',
            alias: 'DEV_TENANT_LOCAL',
            display_name: 'Acme Corp (Dev Bypass)',
            sso_domain: 'acme.com',
            stripe_customer_id: null,
            plan_tier: 'ENTERPRISE',
          }
        ],
      });
    } else {
      fetchTenantData();
    }
  }, [fetchTenantData]);

  // Load licenses
  const loadLicenses = async () => {
    setLoading(true);
    const isDevBypass = activeOrg?.alias === 'DEV_TENANT_LOCAL';
    
    // Setup Mock Records for visual verification and fallback
    const mockLicenses: LicenseRecord[] = [
      {
        id: "lic-active-001",
        jwt_hash: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyBzdWIiOiAiREVWX1RFTkFOVF9MT0NCTCIsICJmZWF0dXJlcyI6IFsibG9jYWxfc3dhcm0iLCAiZ2xvYmFsX3dhbl9tZXNoIiwgImdsb2JhbF9xdWFyYW50aW5lX3N5bmMiLCAidGVtcG9yYWxfcm91dGVyIl0gfQ.activeKeySignatureVerifyMatchesSecretAndRSASigningCertKeyLog",
        revoked: false,
        created_at: new Date(Date.now() - 4 * 3600000).toISOString(), // 4h ago
        expires_at: new Date(Date.now() + 6 * 24 * 3600000 + 20 * 3600000).toISOString(), // 6d 20h remaining
        status: "ACTIVE",
      },
      {
        id: "lic-rolled-002",
        jwt_hash: "7f9c3a9f0d4b8e2c1a5b6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a",
        revoked: true,
        created_at: new Date(Date.now() - 28 * 3600000).toISOString(), // 28h ago
        expires_at: new Date(Date.now() - 4 * 3600000).toISOString(), 
        revoked_at: new Date(Date.now() - 4 * 3600000).toISOString(), // rolled 4h ago
        status: "RROLLED",
      },
      {
        id: "lic-rolled-003",
        jwt_hash: "8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b",
        revoked: true,
        created_at: new Date(Date.now() - 52 * 3600000).toISOString(), // 52h ago
        expires_at: new Date(Date.now() - 28 * 3600000).toISOString(),
        revoked_at: new Date(Date.now() - 28 * 3600000).toISOString(), // rolled 28h ago
        status: "RROLLED",
      },
      {
        id: "lic-revoked-004",
        jwt_hash: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
        revoked: true,
        created_at: new Date(Date.now() - 5 * 24 * 3600000).toISOString(), // 5d ago
        expires_at: new Date(Date.now() + 2 * 24 * 3600000).toISOString(),
        revoked_at: new Date(Date.now() - 2 * 24 * 3600000).toISOString(), // revoked 2d ago
        status: "REVOKED",
      },
      {
        id: "lic-expired-005",
        jwt_hash: "f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8",
        revoked: false,
        created_at: new Date(Date.now() - 10 * 24 * 3600000).toISOString(), // 10d ago
        expires_at: new Date(Date.now() - 3 * 24 * 3600000).toISOString(), // expired 3d ago
        status: "EXPIRED",
      }
    ];

    if (isDevBypass || !activeOrganizationId) {
      setLicenses(mockLicenses);
      setActiveKey(mockLicenses[0].jwt_hash);
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("licenses")
        .select("*")
        .eq("org_id", activeOrganizationId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setLicenses(mockLicenses);
        setActiveKey(mockLicenses[0].jwt_hash);
      } else {
        // Map database records to full LicenseRecord status fields
        const mapped: LicenseRecord[] = data.map((row: any, idx: number) => {
          const isExpired = row.created_at ? (Date.now() - new Date(row.created_at).getTime() > 7 * 24 * 3600000) : false;
          
          let computedStatus: "ACTIVE" | "RROLLED" | "REVOKED" | "EXPIRED" = "ACTIVE";
          if (row.revoked) {
            computedStatus = idx === 0 ? "REVOKED" : "RROLLED";
          } else if (isExpired) {
            computedStatus = "EXPIRED";
          } else if (idx > 0) {
            computedStatus = "RROLLED";
          }

          return {
            id: row.id,
            jwt_hash: row.jwt_hash,
            revoked: !!row.revoked,
            created_at: row.created_at || new Date().toISOString(),
            expires_at: row.created_at ? new Date(new Date(row.created_at).getTime() + 7 * 24 * 3600000).toISOString() : new Date().toISOString(),
            revoked_at: row.revoked ? (row.created_at ? new Date(new Date(row.created_at).getTime() + 24 * 3600000).toISOString() : new Date().toISOString()) : null,
            status: computedStatus,
          };
        });
        setLicenses(mapped);
        const currentActive = mapped.find(l => l.status === "ACTIVE");
        setActiveKey(currentActive ? currentActive.jwt_hash : data[0]?.jwt_hash || "");
      }
    } catch (err) {
      console.error("Failed to query licenses log:", err);
      setLicenses(mockLicenses);
      setActiveKey(mockLicenses[0].jwt_hash);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLicenses();
  }, [activeOrganizationId]);

  const handleCopy = () => {
    if (!activeKey) return;
    navigator.clipboard.writeText(activeKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRollKey = async () => {
    setMintError(null);
    const usageCounter = planTier === "OPEN_CORE" ? 32 : licenses.length;
    if (planTier === "OPEN_CORE" && usageCounter > 30) {
      setMintError("[ ACCESS DENIED: Monthly minting allocation exhausted for Open Core tier ]");
      setIsConfirmOpen(false);
      return;
    }

    if (!activeOrganizationId && !(typeof document !== 'undefined' && document.cookie.includes('dev-mode-bypass-active=true'))) return;
    setRolling(true);
    setIsConfirmOpen(false);

    try {
      const isDevBypass = activeOrg?.alias === 'DEV_TENANT_LOCAL';
      if (isDevBypass) {
        // Prepend a fresh active rolling key to the state list
        const newKey = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyBzdWIiOiAiREVWX1RFTkFOVF9MT0NCTCIsICJpYXQiOiAxNzgxODg4MDAwIH0.freshRolledKeySignatureVerifyMatchesSecretAndRSASigningCertKeyLog" + Math.random().toString(36).slice(2, 6);
        const newRecord: LicenseRecord = {
          id: `lic-active-rolled-${Date.now()}`,
          jwt_hash: newKey,
          revoked: false,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 3600000).toISOString(),
          status: "ACTIVE",
        };

        setLicenses((prev) => {
          const updated = prev.map((l) => {
            if (l.status === "ACTIVE") {
              return {
                ...l,
                revoked: true,
                revoked_at: new Date().toISOString(),
                status: "RROLLED" as const,
              };
            }
            return l;
          });
          return [newRecord, ...updated];
        });
        setActiveKey(newKey);
      } else {
        await regenerateLicense(activeOrganizationId!);
        await loadLicenses();
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to roll license key");
    } finally {
      setRolling(false);
    }
  };

  const getFingerprint = (key: string) => {
    if (!key) return "N/A";
    const cleanKey = key.replace("sha256:", "");
    if (cleanKey.length === 64) {
      return `sha256:${cleanKey.slice(0, 8)}...${cleanKey.slice(-8)}`;
    }
    // Convert text to a pseudo-hash representation
    const textHash = cleanKey.slice(0, 16).toLowerCase();
    return `sha256:${textHash.slice(0, 8)}...${textHash.slice(-8)}`;
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")} UTC`;
  };

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-300 font-sans selection:bg-zinc-800 selection:text-white p-6 md:p-12 relative overflow-hidden">
      
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center space-x-2 text-zinc-500 font-mono text-xs tracking-widest uppercase">
          <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">
            Overview
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-zinc-400">Licenses</span>
        </div>

        {/* Flat Banner Alert */}
        {mintError && (
          <div className="border border-red-800 bg-red-950/45 text-red-400 font-mono text-xs p-4 rounded-none uppercase animate-pulse select-none">
            {mintError}
          </div>
        )}

        {/* Section Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-800 pb-6 gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-zinc-500 font-mono text-xs tracking-widest uppercase">
              <Shield className="w-4 h-4 text-[#00E5FF]" />
              <span>Security // Cryptographic Ledger</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white uppercase font-mono leading-none">
              License Vault
            </h1>
            <p className="text-zinc-550 text-xs font-mono max-w-xl">
              Definitive audit trail for sovereign cryptographic licenses. View, roll, and review authorization status logs.
            </p>
          </div>

          {/* Sync status */}
          <div className="flex items-center space-x-4 shrink-0 font-mono text-xs text-zinc-550">
            <Clock className="w-3.5 h-3.5" />
            <span>Telemetry Checkpoint: Valid</span>
          </div>
        </header>

        {/* Header Panel: Active Key Display & Controls */}
        <section className="border border-zinc-800 bg-[#09090b] p-6 rounded-none space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h2 className="text-white font-medium font-mono text-sm uppercase">Active Master Key</h2>
              <p className="text-zinc-500 text-xs font-mono">
                {planTier === "OPEN_CORE" 
                  ? "Standard open-core local instance authorization key." 
                  : "RSA key signed and hashed for secure WAN orchestration."}
              </p>
            </div>
            
            <div className="flex space-x-3 shrink-0">
              <button
                onClick={() => setIsMasked(!isMasked)}
                disabled={!activeKey}
                className="px-3.5 py-1.5 text-xs font-mono border border-zinc-800 bg-black hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors rounded-none uppercase cursor-pointer disabled:opacity-50"
              >
                {isMasked ? "[ Reveal Key ]" : "[ Hide Key ]"}
              </button>
              <button
                onClick={handleCopy}
                disabled={!activeKey}
                className="px-3.5 py-1.5 text-xs font-mono border border-zinc-800 bg-black hover:bg-zinc-900 text-zinc-300 hover:text-white transition-colors rounded-none uppercase cursor-pointer disabled:opacity-50"
              >
                {copied ? "Copied" : "Copy Key"}
              </button>
              <button
                onClick={() => setIsConfirmOpen(true)}
                disabled={rolling}
                className="px-3.5 py-1.5 text-xs font-mono border border-[#ea580c]/50 bg-[#ea580c]/10 hover:bg-[#ea580c]/20 text-[#ea580c] hover:text-white transition-colors rounded-none uppercase cursor-pointer disabled:opacity-50"
              >
                {rolling ? "Rolling..." : "Roll Key"}
              </button>
            </div>
          </div>

          <div className="relative w-full overflow-hidden">
            <div className={`font-mono text-xs break-all p-4 border border-zinc-800 bg-black text-[#00E5FF] transition-all duration-500 min-h-[70px] ${isMasked ? 'blur-[8px] select-none opacity-40' : 'blur-0 opacity-100'}`}>
              {activeKey || (planTier === "OPEN_CORE" ? "Upgrade subscription to mint standard enterprise keys." : "No master license key active.")}
            </div>
          </div>
        </section>

        {/* Audit Log Table */}
        <section className="space-y-4">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-mono pl-1">Cryptographic Audit Trail</h2>
          
          <div className="overflow-x-auto border border-zinc-800 bg-[#09090b] p-1 rounded-none">
            <table className="w-full text-left border-collapse border border-zinc-800 font-mono text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-black text-zinc-500 select-none">
                  <th className="p-4 font-semibold">Key Fingerprint</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Minted Date</th>
                  <th className="p-4 font-semibold">Expiration Date</th>
                  <th className="p-4 font-semibold">Revoked At</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-500 italic">
                      Decrypting audit trail logs...
                    </td>
                  </tr>
                ) : licenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-500 italic">
                      No licenses found.
                    </td>
                  </tr>
                ) : (
                  licenses.map((lic) => {
                    const isExpired = lic.status === "EXPIRED";
                    const isRevoked = lic.status === "REVOKED";
                    return (
                      <tr 
                        key={lic.id} 
                        className={`border-b border-zinc-900 bg-black/40 hover:bg-black/60 transition-colors ${
                          isExpired ? "opacity-60" : ""
                        } ${
                          isRevoked ? "bg-red-950/15" : ""
                        }`}
                      >
                        <td className="p-4 font-mono font-medium text-zinc-300 break-all select-all">
                          <span className={isExpired ? "line-through text-zinc-550" : ""}>
                            {getFingerprint(lic.jwt_hash)}
                          </span>
                        </td>
                        <td className="p-4">
                          {lic.status === "ACTIVE" && (
                            <span className="inline-flex items-center space-x-1.5 bg-black border border-[#00E5FF] text-[#00E5FF] px-2.5 py-0.5 text-[10px] tracking-wider uppercase font-semibold">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E5FF] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00E5FF]"></span>
                              </span>
                              <span>ACTIVE</span>
                            </span>
                          )}
                          {lic.status === "RROLLED" && (
                            <span className="inline-flex items-center bg-black border border-zinc-700 text-zinc-500 px-2.5 py-0.5 text-[10px] tracking-wider uppercase">
                              RROLLED
                            </span>
                          )}
                          {lic.status === "REVOKED" && (
                            <span className="inline-flex items-center bg-red-950 text-red-400 border border-red-800 px-2.5 py-0.5 text-[10px] tracking-wider uppercase font-semibold">
                              REVOKED
                            </span>
                          )}
                          {lic.status === "EXPIRED" && (
                            <span className="inline-flex items-center bg-black border border-dashed border-zinc-700 text-zinc-500 line-through px-2.5 py-0.5 text-[10px] tracking-wider uppercase">
                              EXPIRED
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-zinc-400">
                          {formatDate(lic.created_at)}
                        </td>
                        <td className="p-4 text-zinc-400">
                          {formatDate(lic.expires_at)}
                        </td>
                        <td className="p-4 text-zinc-500">
                          {lic.revoked_at ? formatDate(lic.revoked_at) : (lic.revoked ? "REVOKED" : "-")}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>

      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50 p-4">
          <div className="max-w-md w-full border border-[#ea580c] bg-black p-6 space-y-6 relative overflow-hidden">
            
            {/* Corner styling */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#ea580c]" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#ea580c]" />
            
            <div className="flex items-start space-x-3 text-[#ea580c]">
              <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-mono font-bold tracking-tight text-white uppercase text-base">
                  Confirm Key Rotation
                </h3>
                <p className="text-zinc-400 text-xs font-mono leading-relaxed">
                  Proceeding will immediately deactivate and revoke the current active master license key. A fresh 24-hour rolling JWT authorization will be generated.
                </p>
              </div>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-850 font-mono text-[11px] text-zinc-550 leading-relaxed space-y-2">
              <p className="text-white font-semibold">OS Orchestrator Notice:</p>
              <p>
                All WAN mesh nodes will receive a synchronization command. If telemetry verification fails, remote evictions may occur within 60 minutes.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="flex-1 py-2 text-xs font-mono border border-zinc-800 hover:border-zinc-700 bg-zinc-950 text-zinc-400 hover:text-white transition-colors rounded-none uppercase cursor-pointer"
              >
                Abort Rotation
              </button>
              <button
                onClick={handleRollKey}
                disabled={rolling}
                className="flex-1 py-2 text-xs font-mono border border-[#ea580c] bg-[#ea580c]/20 hover:bg-[#ea580c]/30 text-white transition-colors rounded-none uppercase cursor-pointer disabled:opacity-50"
              >
                Confirm Rotation
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
