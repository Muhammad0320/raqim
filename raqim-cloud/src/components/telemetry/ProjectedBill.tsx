"use client";

import React from "react";
import { Receipt, Info, Sparkles, TrendingUp } from "lucide-react";
import { TelemetryMetric } from "@/actions/telemetry";

interface ProjectedBillProps {
  data: TelemetryMetric[];
  planTier: string;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function ProjectedBill({ data, planTier }: ProjectedBillProps) {
  // 1. Calculate Aggregates over the 30-day telemetry metrics
  const totalMerges = data.reduce((sum, item) => sum + (item.crdt_merges || 0), 0);
  const totalA2A = data.reduce((sum, item) => sum + (item.a2a_bytes || 0), 0);
  
  // Total A2A in Gigabytes for billing formula
  const totalA2AGB = totalA2A / (1024 * 1024 * 1024);

  // 2. Compute Billing Details
  const currentTierFormatted = planTier.toUpperCase();
  const isOpenCore = currentTierFormatted === "OPEN_CORE";
  const isStartup = currentTierFormatted === "STARTUP";
  const isEnterprise = currentTierFormatted === "ENTERPRISE";

  // Base Fees
  let baseFee = 0;
  if (isStartup) baseFee = 49.0;
  if (isEnterprise) baseFee = 499.0;

  // Bandwidth Cost: $0.05 per GB
  const bandwidthCost = isOpenCore ? 0.0 : totalA2AGB * 0.05;

  // Compute Cost: $0.50 per 1,000,000 CRDT merges
  const computeCost = isOpenCore ? 0.0 : (totalMerges / 1000000) * 0.50;

  // Total monthly bill
  const totalBill = isOpenCore ? 0.0 : baseFee + bandwidthCost + computeCost;

  // Calculate simulated details for Open Core user preview (for high-end UX marketing)
  const simulatedBase = 49.0;
  const simulatedBandwidth = totalA2AGB * 0.05;
  const simulatedCompute = (totalMerges / 1000000) * 0.50;
  const simulatedTotal = simulatedBase + simulatedBandwidth + simulatedCompute;

  return (
    <div className="w-full h-full bg-[#09090b] border border-zinc-800 rounded-none overflow-hidden relative flex flex-col justify-between">
      
      {/* Receipt header */}
      <div className="p-6 border-b border-zinc-800 bg-[#09090b] relative shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <h3 className="font-mono font-bold tracking-tight text-white uppercase text-sm">
              Ledger // Projected
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 bg-black px-2 py-0.5 rounded-none border border-zinc-800 uppercase tracking-widest">
            Cycle Live
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
        
        {/* Metric Summaries inside Ledger */}
        <div className="grid grid-cols-2 gap-4 shrink-0">
          <div className="bg-black border border-zinc-800 p-3 rounded-none flex flex-col justify-center">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              Total Merges
            </span>
            <span className="text-base font-mono text-zinc-200 mt-1 font-semibold">
              {totalMerges.toLocaleString()}
            </span>
          </div>
          <div className="bg-black border border-zinc-800 p-3 rounded-none flex flex-col justify-center">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              A2A Bandwidth
            </span>
            <span className="text-base font-mono text-zinc-200 mt-1 font-semibold">
              {formatBytes(totalA2A)}
            </span>
          </div>
        </div>

        {/* Invoice Receipt Container */}
        <div className="border border-zinc-800 bg-black rounded-none p-5 font-mono text-xs relative overflow-hidden flex-1 my-4 flex flex-col justify-between min-h-[220px]">
          
          <div>
            <div className="border-t border-dashed border-zinc-800 my-2" />

            {/* Billing Details */}
            <div className="space-y-3 py-2">
              
              {/* Base Fee */}
              <div className="flex justify-between items-center text-zinc-400">
                <div className="flex flex-col">
                  <span>Base Subscription</span>
                  <span className="text-[10px] text-zinc-600">
                    Tier: {isOpenCore ? "OPEN CORE" : isStartup ? "STARTUP" : "ENTERPRISE"}
                  </span>
                </div>
                <span className="text-zinc-200 font-semibold">
                  ${isOpenCore ? "0.00" : baseFee.toFixed(2)}
                </span>
              </div>

              {/* Bandwidth Cost */}
              <div className="flex justify-between items-center text-zinc-400">
                <div className="flex flex-col">
                  <span>Global A2A Bandwidth</span>
                  <span className="text-[10px] text-zinc-600">
                    {totalA2AGB.toFixed(2)} GB @ $0.05/GB
                  </span>
                </div>
                <span className="text-zinc-200 font-semibold">
                  ${isOpenCore ? "0.00" : bandwidthCost.toFixed(2)}
                </span>
              </div>

              {/* Compute Cost */}
              <div className="flex justify-between items-center text-zinc-400">
                <div className="flex flex-col">
                  <span>CRDT Merges (Compute)</span>
                  <span className="text-[10px] text-zinc-600">
                    {(totalMerges / 1000000).toFixed(4)}M @ $0.50/M
                  </span>
                </div>
                <span className="text-zinc-200 font-semibold">
                  ${isOpenCore ? "0.00" : computeCost.toFixed(2)}
                </span>
              </div>

              {/* Free Tier Discount (if applicable) */}
              {isOpenCore && (
                <div className="flex justify-between items-center text-emerald-500/80 bg-emerald-950/10 border border-emerald-950/30 p-2 rounded-none my-1">
                  <div className="flex flex-col">
                    <span>Open Core Waiver</span>
                    <span className="text-[9px] text-emerald-600">
                      Non-commercial plan exception
                    </span>
                  </div>
                  <span>-${simulatedTotal.toFixed(2)}</span>
                </div>
              )}

            </div>
          </div>

          <div>
            {/* Dotted separator */}
            <div className="border-t border-dashed border-zinc-800 my-4" />

            {/* Total projected */}
            <div className="flex justify-between items-end pt-1">
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                  Projected Total
                </span>
                <span className="text-[9px] text-zinc-600 font-mono mt-0.5">
                  ESTIMATED MONTHLY INVOICE
                </span>
              </div>
              <span className="text-2xl font-semibold tracking-tighter text-emerald-400 font-mono">
                ${totalBill.toFixed(2)}
              </span>
            </div>

            <div className="border-b border-dashed border-zinc-800 my-4" />
            
            {/* Cyber bar code design */}
            <div className="flex flex-col items-center justify-center opacity-30 mt-2 space-y-1">
              <div className="flex space-x-[1px] h-6 w-full justify-center">
                {[...Array(28)].map((_, idx) => (
                  <div
                    key={idx}
                    className="bg-zinc-400"
                    style={{ width: `${(idx % 3 === 0 ? 3 : idx % 2 === 0 ? 1 : 2)}px` }}
                  />
                ))}
              </div>
              <span className="text-[8px] text-zinc-500 font-mono tracking-widest uppercase">
                *RAQIM-CLOUD-{isOpenCore ? "OC" : isStartup ? "ST" : "ENT"}-{totalMerges}-{Math.floor(totalA2AGB)}*
              </span>
            </div>
          </div>

        </div>

        {/* Info panel */}
        <div className="p-4 bg-black border border-zinc-800 rounded-none space-y-2 shrink-0">
          <div className="flex items-start space-x-2 text-zinc-500">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-cyan-500" />
            <p className="text-[10px] leading-relaxed font-mono">
              Usage fees are aggregated dynamically from WAN mesh logs. Rates exclude local node licensing. Charges are calculated at the end of each billing cycle.
            </p>
          </div>
          
          {isOpenCore && (
            <div className="flex items-center space-x-2 text-zinc-450 pt-2 border-t border-zinc-800">
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-500 animate-pulse" />
              <p className="text-[10px] leading-relaxed font-mono font-medium text-amber-400">
                You could save network latency. Upgrade to unlock full edge telemetry and routing.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
