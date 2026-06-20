'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`block px-3 py-1.5 text-sm font-medium rounded-md transition-all border ${
        isActive
          ? "bg-zinc-800/80 text-white shadow-sm border-zinc-700/50"
          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 border-transparent"
      }`}
    >
      {children}
    </Link>
  );
}
