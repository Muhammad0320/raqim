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
  
  const isDevBypass = process.env.NEXT_PUBLIC_DEV_MODE_BYPASS === 'true';
  const planTier = isDevBypass ? "ENTERPRISE" : (activeOrg?.plan_tier || "OPEN_CORE");
  const activeOrgAlias = isDevBypass ? "DEV_TENANT_LOCAL" : (activeOrg?.alias || "NO_TENANT");

  const [telemetryData, setTelemetryData] = useState<TelemetryMetric[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch telemetry metrics on active organization change
  const loadTelemetry = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isDevBypass) {
        // Generate beautiful rolling 30-day mock data to guarantee visual completion
        const mockData = [];
        for (let i = 29; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          
          const dayFactor = Math.sin((30 - i) / 3);
          const randFactor = Math.random() * 0.4 + 0.8;
          
          const merges = Math.round((800000 + dayFactor * 300000) * randFactor);
          const bytes = Math.round((2.5 * 1024 * 1024 * 1024 + dayFactor * 1.2 * 1024 * 1024 * 1024) * randFactor);
          const forks = Math.max(0, Math.round(4 + dayFactor * 3.5 + (Math.random() - 0.5) * 2));

          mockData.push({
            id: `mock-${i}`,
            org_id: 'e0000000-0000-0000-0000-000000000000',
            day: d.toISOString(),
            date: d.toISOString().split("T")[0],
            crdt_merges: merges,
            a2a_bytes: bytes,
            time_travels: forks,
            created_at: d.toISOString(),
          });
        }
        setTelemetryData(mockData);
      } else {
        const data = await fetchTelemetryMetrics();
        setTelemetryData(data);
      }
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

  // Gating checks
  const isBandwidthLocked = planTier === "OPEN_CORE";
  const isTemporalLocked = planTier === "OPEN_CORE" || planTier === "STARTUP";

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-zinc-800 selection:text-white p-6 md:p-12 relative overflow-hidden">
      
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Observability Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-800 pb-6 gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-zinc-500 font-mono text-xs tracking-widest uppercase">
              <Activity className="w-4 h-4 text-cyan-500" />
              <span>observability // fleet telemetry</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white uppercase font-mono leading-none">
                {activeOrgAlias}
              </h1>
              
              {/* Dynamic RBAC Badge */}
              <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-none border text-xs font-mono tracking-widest uppercase ${
                planTier === "ENTERPRISE" ? "bg-cyan-950/20 border-cyan-900/50 text-cyan-400 animate-pulse" :
                planTier === "STARTUP" ? "bg-blue-950/20 border-blue-900/50 text-blue-400" :
                "bg-zinc-900 border-zinc-800 text-zinc-500"
              }`}>
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <span>{planTier.replace("_", " ")}</span>
              </div>
            </div>
            
            <p className="text-zinc-550 text-xs font-mono max-w-xl">
              Rolling 30-day chronological snapshot of distributed state synchronization, global bandwidth utilization, and timeline query anomalies.
            </p>
          </div>

          {/* Interactive controls */}
          <div className="flex items-center space-x-4 shrink-0">
            <button
              onClick={loadTelemetry}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold font-mono rounded-none border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all duration-200 disabled:opacity-50 cursor-pointer uppercase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh Metrics</span>
            </button>
            <Link
              href="/dashboard"
              className="flex items-center space-x-1 px-4 py-2 text-xs font-semibold font-mono rounded-none border border-zinc-800 bg-white text-black hover:bg-zinc-200 transition-colors uppercase"
            >
              <span>View API Keys</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </header>

        {/* Dashboard Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Main Visualizations Pane (col-span-8) */}
          <div className="lg:col-span-8 flex flex-col gap-6 h-full">
            
            {error && (
              <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-none flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-red-400 text-sm font-mono font-medium">[ERROR: FETCH FAILED]</p>
                  <p className="text-red-500/80 text-xs font-mono leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="w-full h-full min-h-[500px] border border-zinc-800 rounded-none flex flex-col items-center justify-center space-y-4 bg-black">
                <Cpu className="w-10 h-10 text-cyan-500 animate-pulse" />
                <p className="text-zinc-500 text-xs font-mono tracking-widest uppercase animate-pulse">
                  Decrypting telemetry array...
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6 h-full">
                
                {/* Zone 1: Compute (CRDT Merges) */}
                <div className="flex-1 h-full min-h-[250px]">
                  <ComputeChart data={telemetryData} />
                </div>

                {/* Zone 2: Bandwidth (Global A2A) - Gated for Open Core */}
                <div className="flex-1 h-full min-h-[250px]">
                  <LockedFeatureOverlay
                    isLocked={isBandwidthLocked}
                    requiredTier="STARTUP"
                    currentTier={planTier}
                  >
                    <BandwidthChart data={telemetryData} />
                  </LockedFeatureOverlay>
                </div>

                {/* Zone 3: Temporal (Reality Forks) - Gated for Startup / Open Core */}
                <div className="flex-1 h-full min-h-[250px]">
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

          {/* Right Column: Sticky Billing Ledger Side-panel (col-span-4) */}
          <div className="lg:col-span-4 h-full">
            <ProjectedBill data={telemetryData} planTier={planTier} />
          </div>

        </div>
      </div>
    </div>
  );
}
