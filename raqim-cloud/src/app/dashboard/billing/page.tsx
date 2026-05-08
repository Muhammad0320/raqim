"use client";

import React, { useState } from 'react';
import { PlanBadge } from '@/components/PlanBadge';
import { UpgradeModal } from '@/components/UpgradeModal';

export default function BillingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-zinc-800 selection:text-white p-8">
      <UpgradeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      <div className="max-w-4xl mx-auto space-y-16 py-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-white mb-2">Billing & Infrastructure</h1>
          <p className="text-zinc-500 text-sm">Manage your sovereign license plan, active modules, and invoices.</p>
        </div>

        {/* Section 1: Current Plan Status */}
        <section className="border border-zinc-800 rounded-xl bg-zinc-950/50 p-6 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-lg text-white font-medium">Current Plan</h2>
              <PlanBadge tier="STARTUP" />
            </div>
            <p className="text-sm text-zinc-500">
              Next billing cycle on <span className="text-zinc-300 font-mono">2026-06-01</span>
            </p>
          </div>
          <div className="mt-6 md:mt-0 flex space-x-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none px-4 py-2.5 text-sm font-medium rounded-lg border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition-colors text-zinc-300">
              Manage in Stripe
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex-1 md:flex-none px-4 py-2.5 text-sm font-semibold rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 transition-colors"
            >
              Upgrade Plan
            </button>
          </div>
        </section>

        {/* Section 2: Active Modules */}
        <section className="space-y-4">
          <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-6">Active Modules (AaaS)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-zinc-800 rounded-xl p-5 flex items-center justify-between bg-zinc-900/20">
              <div>
                <h4 className="text-white font-medium text-sm mb-1.5">Aegis Firewall</h4>
                <p className="text-xs text-zinc-500">Line-rate signature verification.</p>
              </div>
              <div className="flex items-center space-x-2 text-xs font-mono text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span>Active</span>
              </div>
            </div>
            <div className="border border-zinc-800 rounded-xl p-5 flex items-center justify-between bg-zinc-900/20">
              <div>
                <h4 className="text-white font-medium text-sm mb-1.5">Time Travel</h4>
                <p className="text-xs text-zinc-500">Temporal Reality Router.</p>
              </div>
              <div className="flex items-center space-x-2 text-xs font-mono text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span>Active</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Invoice History */}
        <section className="space-y-4">
          <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-6">Invoice History</h3>
          <div className="border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-900/50 text-zinc-400 font-mono text-xs border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-medium uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-widest text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 font-mono text-zinc-300">
                <tr className="hover:bg-zinc-900/20 transition-colors">
                  <td className="px-6 py-4 text-zinc-400">2026-05-01</td>
                  <td className="px-6 py-4 text-white">$299.00</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-300 border border-zinc-700">Paid</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-zinc-500 hover:text-white transition-colors inline-flex" title="Download PDF">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-zinc-900/20 transition-colors">
                  <td className="px-6 py-4 text-zinc-400">2026-04-01</td>
                  <td className="px-6 py-4 text-white">$299.00</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-300 border border-zinc-700">Paid</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-zinc-500 hover:text-white transition-colors inline-flex" title="Download PDF">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}
