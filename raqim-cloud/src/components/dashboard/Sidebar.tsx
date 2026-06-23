"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Key, Activity, Settings, LogOut } from 'lucide-react';
import { useTenantStore } from '@/store/useTenantStore';

export default function Sidebar() {
  const pathname = usePathname();
  const clearTenantData = useTenantStore((state) => state.clearTenantData);

  const links = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/licenses', label: 'License Keys', icon: Key },
    { href: '/dashboard/telemetry', label: 'Fleet Telemetry', icon: Activity },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  const handleSignOut = () => {
    clearTenantData();
    window.location.href = '/auth/login';
  };

  return (
    <aside className="w-56 border-r border-zinc-800 bg-black flex flex-col shrink-0">
      <nav className="flex-1 py-4 px-3 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center px-3 py-2 text-sm font-medium transition-all duration-200 rounded-none border ${
                isActive
                  ? 'bg-zinc-800/80 text-white shadow-sm border border-zinc-700/50'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
              {link.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center px-3 py-2 text-sm font-medium transition-all duration-200 rounded-none text-zinc-400 hover:text-white hover:bg-zinc-900/50 border border-transparent cursor-pointer"
        >
          <LogOut className="w-4 h-4 mr-3 text-zinc-500" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
