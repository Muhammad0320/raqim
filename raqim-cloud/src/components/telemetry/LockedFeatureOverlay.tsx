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

  return (
    <div className="relative w-full h-full min-h-[250px] overflow-hidden rounded-none border border-zinc-800 bg-[#09090b]">
      {/* Grayscale/blurred backdrop wrapper of actual chart */}
      <div className="w-full h-full select-none pointer-events-none filter grayscale contrast-75 brightness-50 opacity-30">
        {children}
      </div>

      {/* Cyber Gating Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-20 p-6 text-center transition-all duration-300">
        
        {/* Decorative corner lines (cyber-industrial aesthetic) */}
        <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-zinc-800" />
        <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-zinc-800" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-zinc-800" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-zinc-800" />

        <div className="max-w-md p-8 rounded-none border border-zinc-800 bg-black space-y-6 relative overflow-hidden group">
          
          {/* Subtle grid pattern inside overlay box */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

          {/* Secure Padlock Icon */}
          <div className="relative flex justify-center">
            <div className="relative w-12 h-12 rounded-none bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors duration-300">
              <Lock className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300" />
            </div>
          </div>

          {/* Status Label */}
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-none border border-zinc-800 bg-zinc-900 text-zinc-400 text-[10px] font-mono tracking-widest uppercase">
              <ShieldAlert className="w-3 h-3 text-amber-500" />
              <span>GATED FEATURE</span>
            </div>
            
            <h4 className="text-lg font-bold tracking-tight text-white uppercase font-mono">
              {requiredTier} Telemetry Stream
            </h4>
            
            <p className="text-zinc-550 text-xs font-mono leading-relaxed">
              Real-time analytics is restricted. Upgrade from your current{" "}
              <span className="text-zinc-400 font-bold underline decoration-zinc-800 decoration-wavy">
                {currentTier.replace("_", " ")}
              </span>{" "}
              tier to unlock deeper fleet insights.
            </p>
          </div>

          {/* CTA Button */}
          <div className="pt-2">
            <Link
              href="/pricing"
              className="w-full py-3 px-5 inline-flex items-center justify-center space-x-2 rounded-none border border-zinc-800 bg-white hover:bg-zinc-200 text-black font-semibold font-mono text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer"
            >
              <span>Upgrade to Unlock Global Mesh</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
