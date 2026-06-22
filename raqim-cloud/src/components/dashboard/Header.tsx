"use client";

import React from 'react';
import Link from 'next/link';
import { Bell, MessageSquare } from 'lucide-react';
import { OrgSwitcher } from '@/components/OrgSwitcher';
import { useTenantStore } from '@/store/useTenantStore';

export default function Header() {
  const { profile } = useTenantStore();
  const userName = profile?.full_name || "Muhammad";
  const userAvatar = profile?.avatar_url || "https://github.com/shadcn.png";

  return (
    <header className="h-14 border-b border-zinc-800 bg-black flex items-center justify-between px-6 z-10 shrink-0">
      <div className="flex items-center space-x-6">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-white" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M28 15v70" stroke="currentColor" strokeWidth="8" strokeLinecap="square" />
            <path d="M28 19h36l12 16l-12 16H28" stroke="currentColor" strokeWidth="8" strokeLinecap="square" strokeLinejoin="miter" />
            <path d="M46 49l28 36" stroke="#00E5FF" strokeWidth="8" strokeLinecap="square" />
          </svg>
          <span className="font-bold text-white tracking-tight font-mono text-sm uppercase">raqim cloud</span>
        </Link>
        
        <div className="h-4 w-px bg-zinc-800" />
        
        {/* Dynamic Organization Switcher */}
        <OrgSwitcher />
      </div>

      <div className="flex items-center space-x-4">
        {/* Bell and MessageSquare Icons */}
        <button aria-label="Notifications" className="focus:outline-none cursor-pointer text-zinc-500 hover:text-zinc-200 transition-colors">
          <Bell className="w-4 h-4 cursor-pointer transition-colors hover:text-zinc-200" />
        </button>
        <button aria-label="Feedback" className="focus:outline-none cursor-pointer text-zinc-500 hover:text-zinc-200 transition-colors">
          <MessageSquare className="w-4 h-4 cursor-pointer transition-colors hover:text-zinc-200" />
        </button>
        
        <div className="h-4 w-px bg-zinc-800" />

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-zinc-400 hidden sm:block">{userName}</span>
          <div className="w-7 h-7 overflow-hidden border border-zinc-800 rounded-full bg-zinc-900">
            {userAvatar && (
              <img src={userAvatar} alt={userName} className="w-full h-full object-cover rounded-full" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
