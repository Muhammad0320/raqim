"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ShieldAlert, 
  Settings, 
  Trash2, 
  Mail, 
  Building, 
  Fingerprint, 
  Save, 
  ChevronRight,
  Clock,
  CheckCircle2
} from "lucide-react";
import { useTenantStore } from "@/store/useTenantStore";
import { createClient } from "@/utils/supabase/client";
import { revokeAndDestroyAllKeys } from "@/app/dashboard/actions";

export default function SettingsPage() {
  const { profile, activeOrganizationId, organizations, fetchTenantData } = useTenantStore();
  const activeOrg = organizations.find((org) => org.id === activeOrganizationId);
  const activeOrgAlias = activeOrg?.alias || (process.env.NEXT_PUBLIC_DEV_MODE_BYPASS === 'true' ? 'DEV_TENANT_LOCAL' : 'NO_TENANT');
  const planTier = activeOrg?.plan_tier || "OPEN_CORE";

  const [orgAliasInput, setOrgAliasInput] = useState<string>("");
  const [orgNameInput, setOrgNameInput] = useState<string>("");
  const [billingEmail, setBillingEmail] = useState<string>("");
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [confirmText, setConfirmText] = useState<string>("");
  
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [revokeLoading, setRevokeLoading] = useState<boolean>(false);
  
  // Validation States
  const [emailError, setEmailError] = useState<boolean>(false);
  const [aliasError, setAliasError] = useState<boolean>(false);

  // Initialize inputs on mount/load
  useEffect(() => {
    const isDevBypass = process.env.NEXT_PUBLIC_DEV_MODE_BYPASS === 'true';
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
      setOrgAliasInput("DEV_TENANT_LOCAL");
      setOrgNameInput("Acme Corp (Dev Bypass)");
      setBillingEmail("billing@acme.com");
    } else {
      fetchTenantData();
    }
  }, [fetchTenantData]);

  // Load database organization info
  useEffect(() => {
    if (activeOrg) {
      setOrgAliasInput(activeOrg.alias || "");
      setOrgNameInput(activeOrg.display_name || "");
      setBillingEmail(activeOrg.sso_domain ? `billing@${activeOrg.sso_domain}` : "billing@raqim.cloud");
    }
  }, [activeOrg]);

  // Handle email validation on change
  const handleEmailChange = (val: string) => {
    setBillingEmail(val);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailError(val.length > 0 && !emailRegex.test(val));
  };

  // Handle org details save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailError || aliasError) return;
    if (!orgAliasInput.trim() || !orgNameInput.trim()) {
      setAliasError(!orgAliasInput.trim());
      return;
    }

    setSaveLoading(true);
    setSaveSuccess(false);

    try {
      const isDevBypass = process.env.NEXT_PUBLIC_DEV_MODE_BYPASS === 'true';
      if (isDevBypass) {
        // Simulate local state save
        useTenantStore.setState((prev) => ({
          organizations: prev.organizations.map(o => 
            o.id === activeOrganizationId 
              ? { ...o, alias: orgAliasInput, display_name: orgNameInput }
              : o
          )
        }));
      } else if (activeOrganizationId) {
        const supabase = createClient();
        const { error } = await supabase
          .from("organizations")
          .update({
            alias: orgAliasInput.trim(),
            display_name: orgNameInput.trim(),
          })
          .eq("id", activeOrganizationId);

        if (error) throw error;
        await fetchTenantData();
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save config failure:", err);
      alert("Failed to update organization configuration.");
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle Emergency Revocation
  const handleEmergencyRevoke = async () => {
    if (confirmText !== activeOrgAlias) return;
    setRevokeLoading(true);
    setIsConfirmOpen(false);

    try {
      const isDevBypass = process.env.NEXT_PUBLIC_DEV_MODE_BYPASS === 'true';
      if (isDevBypass) {
        // Simulate downgrading tier and revoking key
        useTenantStore.setState((prev) => ({
          organizations: prev.organizations.map(o => 
            o.id === activeOrganizationId 
              ? { ...o, plan_tier: "OPEN_CORE" }
              : o
          )
        }));
        alert("EMERGENCY PROTOCOL ACTIVATED: Plan downgraded to OPEN_CORE and all licenses revoked.");
      } else if (activeOrganizationId) {
        await revokeAndDestroyAllKeys(activeOrganizationId);
        await fetchTenantData();
        alert("EMERGENCY PROTOCOL ACTIVATED: WAN replication deactivated and active licenses revoked.");
      }
      setConfirmText("");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to trigger emergency revocation.");
    } finally {
      setRevokeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-300 font-sans selection:bg-zinc-800 selection:text-white p-6 md:p-12 relative overflow-hidden">
      
      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center space-x-2 text-zinc-500 font-mono text-xs tracking-widest uppercase">
          <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">
            Overview
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-zinc-400">Settings</span>
        </div>

        {/* Section Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-800 pb-6 gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-zinc-500 font-mono text-xs tracking-widest uppercase">
              <Settings className="w-4 h-4 text-cyan-400" />
              <span>Admin // Configuration cockpit</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white uppercase font-mono leading-none">
              System Settings
            </h1>
            <p className="text-zinc-550 text-xs font-mono max-w-xl">
              Configure your organization footprint, verify credentials, or trigger emergency circuit breakers.
            </p>
          </div>
          
          <div className="flex items-center space-x-4 shrink-0 font-mono text-xs text-zinc-550">
            <Clock className="w-3.5 h-3.5" />
            <span>State: Synced</span>
          </div>
        </header>

        {/* Section 1: Organization Footprint Form */}
        <section className="border border-zinc-800 bg-[#09090b] p-6 rounded-none space-y-6">
          <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
            <div className="flex items-center space-x-2.5">
              <Building className="w-4 h-4 text-zinc-500" />
              <h2 className="text-white font-medium font-mono text-sm uppercase">Organization Footprint</h2>
            </div>
            {saveSuccess && (
              <span className="flex items-center text-xs font-mono text-emerald-400 space-x-1 uppercase animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Configuration Saved</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Org Display Name */}
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-mono uppercase tracking-widest block">
                  Organization Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={orgNameInput}
                    onChange={(e) => setOrgNameInput(e.target.value)}
                    className="border border-zinc-800 focus:border-cyan-400 bg-black text-white font-mono rounded-none px-4 py-2 w-full outline-none transition-all"
                    placeholder="Acme Corp"
                  />
                </div>
              </div>

              {/* Org Alias */}
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-mono uppercase tracking-widest block">
                  Organization Alias
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={orgAliasInput}
                    onChange={(e) => {
                      setOrgAliasInput(e.target.value.toUpperCase().replace(/\s+/g, "_"));
                      setAliasError(e.target.value.trim() === "");
                    }}
                    className={`border bg-black text-white font-mono rounded-none px-4 py-2 w-full outline-none transition-all ${
                      aliasError ? "border-red-500 focus:border-red-500" : "border-zinc-800 focus:border-cyan-400"
                    }`}
                    placeholder="ACME_CORP"
                  />
                  {aliasError && (
                    <span className="text-[10px] text-red-500 font-mono mt-1 block">Alias is required.</span>
                  )}
                </div>
              </div>

              {/* Tenant Space Identity (UUID) */}
              <div className="space-y-2">
                <label className="text-xs text-zinc-550 font-mono uppercase tracking-widest block">
                  Tenant Space Identity (UUID)
                </label>
                <div className="relative flex items-center">
                  <Fingerprint className="absolute left-3 w-4 h-4 text-zinc-600" />
                  <input
                    type="text"
                    disabled
                    value={activeOrganizationId || "NO_ACTIVE_IDENTITY"}
                    className="border border-zinc-900 bg-zinc-950/80 text-zinc-500 font-mono rounded-none pl-10 pr-4 py-2 w-full outline-none select-all"
                  />
                </div>
                <p className="text-[10px] text-zinc-600 font-mono">
                  Immutable space reference ID for core API routing logs.
                </p>
              </div>

              {/* Billing Contact Email */}
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-mono uppercase tracking-widest block">
                  Billing Contact Email
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={billingEmail}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className={`border bg-black text-white font-mono rounded-none pl-10 pr-4 py-2 w-full outline-none transition-all ${
                      emailError ? "border-red-500 focus:border-red-500" : "border-zinc-800 focus:border-cyan-400"
                    }`}
                    placeholder="billing@acme.com"
                  />
                </div>
                {emailError && (
                  <span className="text-[10px] text-red-500 font-mono mt-1 block">Please enter a valid email address.</span>
                )}
              </div>

            </div>

            <div className="border-t border-zinc-900 pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saveLoading || emailError || aliasError}
                className="flex items-center space-x-2 px-4 py-2 text-xs font-mono border border-zinc-800 bg-white text-black hover:bg-zinc-200 transition-colors uppercase rounded-none cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saveLoading ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </form>
        </section>

        {/* Section 2: The Emergency Circuit Breaker */}
        <section className="border-l-4 border-red-500 bg-zinc-950/40 p-6 space-y-4 rounded-none border border-y-zinc-900 border-r-zinc-900">
          <div className="flex items-start space-x-3.5">
            <ShieldAlert className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h2 className="text-white font-bold font-mono text-sm uppercase leading-none">
                Emergency Infrastructure Revocation
              </h2>
              <p className="text-zinc-400 text-xs font-mono leading-relaxed">
                If your private pem key files or cluster containers have been breached, activate this lever immediately. This action terminates WAN replication limits, drops all connected daemons to open-core mode within 24 hours, and forces a manual regeneration of your organization's Certificate Authority keys.
              </p>
            </div>
          </div>

          <div className="border-t border-zinc-900 pt-4 flex justify-end">
            <button
              onClick={() => setIsConfirmOpen(true)}
              disabled={revokeLoading}
              className="flex items-center space-x-2 px-4 py-2 text-xs font-mono border border-red-900 bg-red-950/20 hover:bg-red-900/40 text-red-500 hover:text-white transition-colors uppercase rounded-none cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{revokeLoading ? "Deactivating..." : "Revoke & Destroy All Keys"}</span>
            </button>
          </div>
        </section>

      </div>

      {/* Revocation Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50 p-4">
          <div className="max-w-md w-full border border-red-500 bg-black p-6 space-y-6 relative overflow-hidden">
            
            {/* Corner lines */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-red-500" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-red-500" />

            <div className="flex items-start space-x-3 text-red-500">
              <ShieldAlert className="w-6 h-6 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-mono font-bold tracking-tight text-white uppercase text-base">
                  Critical Destruction Protocol
                </h3>
                <p className="text-zinc-400 text-xs font-mono leading-relaxed">
                  You are activating the emergency circuit breaker. This action immediately deactivates all master credentials for organization <strong>{activeOrgAlias}</strong>.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-zinc-950 border border-zinc-900 font-mono text-[10px] text-zinc-500 leading-relaxed">
              To execute this operation, you must type the active organization alias to confirm:
              <div className="mt-2 text-white font-bold select-all bg-black p-1 border border-zinc-900 text-center">
                {activeOrgAlias}
              </div>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                required
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="border border-zinc-800 focus:border-red-500 bg-black text-white font-mono rounded-none px-4 py-2 w-full outline-none text-center"
                placeholder="Type organization alias"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setIsConfirmOpen(false);
                  setConfirmText("");
                }}
                className="flex-1 py-2 text-xs font-mono border border-zinc-800 hover:border-zinc-700 bg-zinc-950 text-zinc-400 hover:text-white transition-colors rounded-none uppercase cursor-pointer"
              >
                Abort Protocol
              </button>
              <button
                onClick={handleEmergencyRevoke}
                disabled={confirmText !== activeOrgAlias}
                className="flex-1 py-2 text-xs font-mono border border-red-900 bg-red-950/20 hover:bg-red-950/40 text-red-500 hover:text-white transition-colors rounded-none uppercase cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Destruction
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
