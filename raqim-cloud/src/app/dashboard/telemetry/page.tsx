"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, Shield, Cpu, RefreshCw, AlertTriangle, ArrowUpRight } from "lucide-react";
import { useTenantStore } from "@/store/useTenantStore";
import { fetchTelemetryMetrics, TelemetryMetric } from "@/actions/telemetry";
import { LockedFeatureOverlay } from "@/components/telemetry/LockedFeatureOverlay";
import { ProjectedBill } from "@/components/telemetry/ProjectedBill";
import { ComputeChart, BandwidthChart, TemporalChart } from "@/components/telemetry/TelemetryCharts";

export default function TelemetryDashboardPage() {
  const { organizations, activeOrganizationId, isLoading: isStoreLoading } = useTenantStore();
  const activeOrg = organizations.find((o) => o.id === activeOrganizationId);
  const planTier = activeOrg?.plan_tier || "OPEN_CORE";

  const [telemetryData, setTelemetryData] = useState<TelemetryMetric[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch telemetry metrics on active organization change
  const loadTelemetry = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTelemetryMetrics();
      setTelemetryData(data);
    } catch (err: any) {
      console.error("Telemetry load failed:", err);
      setError(
        err.message || 
        "Failed to query telemetry metrics. Verify if the database is seeded and next-dev server is running."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only query if the store has completed initial loading of tenant context
    if (!isStoreLoading) {
      loadTelemetry();
    }
  }, [activeOrganizationId, isStoreLoading]);

  // Shadow gating checks
  const isBandwidthLocked = planTier === "OPEN_CORE";
  const isTemporalLocked = planTier === "OPEN_CORE" || planTier === "STARTUP";

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-zinc-800 selection:text-white p-6 md:p-12 relative overflow-hidden">
      
      {/* Cyber Grid Background Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808003_1px,transparent_1px),linear-gradient(to_bottom,#80808003_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-fuchsia-500/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Observability Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-900 pb-6 gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-zinc-500 font-mono text-xs tracking-widest uppercase">
              <Activity className="w-4 h-4 text-cyan-500" />
              <span>observability // telemetry</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-medium tracking-tight text-white uppercase font-mono">
                {activeOrg?.alias || "NO_TENANT"}
              </h1>
              
              {/* Dynamic RBAC Badge */}
              <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full border text-xs font-mono tracking-widest uppercase ${
                planTier === "ENTERPRISE" ? "bg-fuchsia-950/20 border-fuchsia-900/50 text-fuchsia-400" :
                planTier === "STARTUP" ? "bg-cyan-950/20 border-cyan-900/50 text-cyan-400" :
                "bg-zinc-900/50 border-zinc-850 text-zinc-400"
              }`}>
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <span>{planTier.replace("_", " ")}</span>
              </div>
            </div>
            
            <p className="text-zinc-500 text-xs font-mono max-w-xl">
              Rolling 30-day chronological snapshot of distributed state synchronization, global bandwidth utilization, and timeline query anomalies.
            </p>
          </div>

          {/* Interactive controls */}
          <div className="flex items-center space-x-4">
            <button
              onClick={loadTelemetry}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold font-mono rounded-lg border border-zinc-850 bg-zinc-950/50 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh Metrics</span>
            </button>
            <Link
              href="/pricing"
              className="flex items-center space-x-1 px-4 py-2 text-xs font-semibold font-mono rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-850 transition-colors"
            >
              <span>Pricing</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </header>

        {/* Dashboard Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Main Visualizations Pane */}
          <div className="lg:col-span-3 space-y-6">
            
            {error && (
              <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-xl flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-red-400 text-sm font-mono font-medium">[ERROR: FETCH FAILED]</p>
                  <p className="text-red-500/80 text-xs font-mono leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="w-full h-[650px] border border-zinc-900 rounded-2xl flex flex-col items-center justify-center space-y-4 bg-zinc-950/40">
                <div className="relative">
                  <Cpu className="w-10 h-10 text-cyan-500 animate-pulse" />
                  <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-xl filter animate-ping" />
                </div>
                <p className="text-zinc-500 text-xs font-mono tracking-widest uppercase animate-pulse">
                  Decrypting telemetry array...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Zone 1: Compute (CRDT Merges) - Spans full width */}
                <div className="md:col-span-2">
                  <ComputeChart data={telemetryData} />
                </div>

                {/* Zone 2: Bandwidth (Global A2A) - Gated for Open Core */}
                <div className="md:col-span-1">
                  <LockedFeatureOverlay
                    isLocked={isBandwidthLocked}
                    requiredTier="STARTUP"
                    currentTier={planTier}
                  >
                    <BandwidthChart data={telemetryData} />
                  </LockedFeatureOverlay>
                </div>

                {/* Zone 3: Temporal (Reality Forks) - Gated for Startup / Open Core */}
                <div className="md:col-span-1">
                  <LockedFeatureOverlay
                    isLocked={isTemporalLocked}
                    requiredTier="ENTERPRISE"
                    currentTier={planTier}
                  >
                    <TemporalChart data={telemetryData} />
                  </LockedFeatureOverlay>
                </div>

              </div>
            )}
          </div>

          {/* Sticky Billing Ledger Side-panel */}
          <div className="lg:col-span-1 lg:sticky lg:top-6">
            <ProjectedBill data={telemetryData} planTier={planTier} />
          </div>

        </div>
      </div>
    </div>
  );
}
