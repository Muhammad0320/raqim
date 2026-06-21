"use client";

import React from 'react';
import { useDocsContext } from '@/components/docs/DocsProvider';
import { Lock } from 'lucide-react';
import Link from 'next/link';

interface RequiresEnterpriseProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function RequiresEnterprise({ children, title, description }: RequiresEnterpriseProps) {
  const { planTier } = useDocsContext();

  if (planTier === 'ENTERPRISE') {
    return <>{children}</>;
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-zinc-800 my-8">
      {/* Blurred children container */}
      <div className="blur-[6px] opacity-30 select-none pointer-events-none p-6 pb-24 bg-zinc-950">
        {children}
      </div>
      
      {/* Absolute overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-zinc-950/40 backdrop-blur-[2px]">
        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center mb-4 shadow-2xl">
          <Lock className="w-5 h-5 text-zinc-400" />
        </div>
        <h3 className="text-xl font-medium text-white mb-2">{title || "Enterprise Feature"}</h3>
        <p className="text-sm text-zinc-400 max-w-md mb-6">
          {description || "The Aegis Firewall interdiction engine is reserved for Enterprise-tier Swarms. Upgrade your organization to access deep-packet cryptographic inspection."}
        </p>
        <Link 
          href="/dashboard/billing" 
          className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)]"
        >
          Upgrade to Enterprise
        </Link>
      </div>
    </div>
  );
}
