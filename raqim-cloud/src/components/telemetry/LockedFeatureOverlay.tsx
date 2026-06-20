"use client";

import React from "react";
import Link from "next/link";
import { Lock, ArrowRight, ShieldAlert } from "lucide-react";

interface LockedFeatureOverlayProps {
  children: React.ReactNode;
  isLocked: boolean;
  requiredTier: "STARTUP" | "ENTERPRISE";
  currentTier: string;
}

export function LockedFeatureOverlay({
  children,
  isLocked,
  requiredTier,
  currentTier,
}: LockedFeatureOverlayProps) {
  if (!isLocked) {
    return <>{children}</>;
  }

  // Neon theme configs based on required tier
  const isEnterprise = requiredTier === "ENTERPRISE";
  const glowColor = isEnterprise ? "shadow-fuchsia-500/20" : "shadow-cyan-500/20";
  const borderColor = isEnterprise ? "border-fuchsia-500/40" : "border-cyan-500/40";
  const badgeColor = isEnterprise
    ? "bg-fuchsia-950/40 border-fuchsia-900/60 text-fuchsia-400"
    : "bg-cyan-950/40 border-cyan-900/60 text-cyan-400";
  const btnGradient = isEnterprise
    ? "from-fuchsia-500 to-purple-600 hover:from-fuchsia-400 hover:to-purple-500 shadow-fuchsia-500/20"
    : "from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 shadow-cyan-500/20";

  return (
    <div className="relative w-full h-full min-h-[300px] overflow-hidden rounded-2xl border border-zinc-900/60 bg-zinc-950">
      {/* Grayscale/blurred backdrop wrapper of actual chart */}
      <div className="w-full h-full select-none pointer-events-none filter grayscale contrast-75 brightness-50 opacity-30 blur-[1.5px]">
        {children}
      </div>

      {/* Cyber Gating Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/75 backdrop-blur-[6px] z-20 p-6 text-center transition-all duration-300">
        
        {/* Decorative corner lines (cyber-industrial aesthetic) */}
        <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-zinc-800" />
        <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-zinc-800" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-zinc-800" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-zinc-800" />

        <div className={`max-w-md p-8 rounded-xl border ${borderColor} bg-zinc-900/80 backdrop-blur-md shadow-2xl ${glowColor} space-y-6 relative overflow-hidden group`}>
          
          {/* Subtle grid pattern inside overlay box */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

          {/* Secure Padlock Icon with Pulsing Effect */}
          <div className="relative flex justify-center">
            <div className="absolute -inset-1 rounded-full bg-zinc-800/50 blur-lg animate-pulse" />
            <div className="relative w-12 h-12 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors duration-300">
              <Lock className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300" />
            </div>
          </div>

          {/* Status Label */}
          <div className="space-y-2">
            <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border text-[10px] font-mono tracking-widest uppercase ${badgeColor}`}>
              <ShieldAlert className="w-3 h-3" />
              <span>GATED FEATURE</span>
            </div>
            
            <h4 className="text-lg font-bold tracking-tight text-white uppercase font-mono">
              {requiredTier} Telemetry Stream
            </h4>
            
            <p className="text-zinc-400 text-xs font-mono leading-relaxed">
              Real-time analytics is restricted. Upgrade from your current{" "}
              <span className="text-zinc-500 font-bold underline decoration-zinc-700 decoration-wavy">
                {currentTier.replace("_", " ")}
              </span>{" "}
              tier to unlock deeper fleet insights.
            </p>
          </div>

          {/* CTA Button */}
          <div className="pt-2">
            <Link
              href="/pricing"
              className={`w-full py-3 px-5 inline-flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r text-white font-semibold font-mono text-xs tracking-wider uppercase shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer`}
            >
              <span>Upgrade to {requiredTier}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
