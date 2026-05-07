import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, Key, Activity, Settings, LogOut, ChevronDown } from "lucide-react";
// Mock of Supabase server auth for demonstration. In a real app we'd use createServerClient from @supabase/ssr
// const supabase = createServerClient(...)
// const { data: { session } } = await supabase.auth.getSession()

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Simulate auth guard. If unauthenticated, redirect to /auth/login
  const isAuthenticated = true; // Set to true for layout demonstration
  
  if (!isAuthenticated) {
    redirect("/auth/login");
  }

  // Simulated data from `organizations` and `profiles` tables
  const orgName = "Acme Corp";
  const userAvatar = "https://github.com/shadcn.png";
  const userName = "Muhammad";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans flex flex-col selection:bg-zinc-800">
      {/* Top Bar */}
      <header className="h-14 border-b border-zinc-800/80 bg-zinc-950 flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center space-x-6">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="20" height="20" rx="4" className="fill-white" />
              <path d="M8 12L12 8L16 12M12 16V8" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-bold text-white tracking-tight">raqim cloud</span>
          </Link>
          
          <div className="h-4 w-px bg-zinc-800" />
          
          {/* Organization Switcher */}
          <button className="flex items-center space-x-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors">
            <div className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center text-xs text-white">
              A
            </div>
            <span>{orgName}</span>
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-zinc-400 hidden sm:block">{userName}</span>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-zinc-800">
              <img src={userAvatar} alt="User Avatar" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-56 border-r border-zinc-800/80 bg-zinc-950/50 flex flex-col">
          <nav className="flex-1 py-4 px-3 space-y-1">
            <Link href="/dashboard" className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-zinc-800/50 text-white">
              <LayoutDashboard className="w-4 h-4 mr-3 text-zinc-400" />
              Overview
            </Link>
            <Link href="/dashboard/keys" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-900 transition-colors">
              <Key className="w-4 h-4 mr-3 text-zinc-400" />
              License Keys
            </Link>
            <Link href="/dashboard/telemetry" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-900 transition-colors">
              <Activity className="w-4 h-4 mr-3 text-zinc-400" />
              Fleet Telemetry
            </Link>
            <Link href="/dashboard/settings" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-900 transition-colors mt-6">
              <Settings className="w-4 h-4 mr-3 text-zinc-400" />
              Settings
            </Link>
          </nav>
          
          <div className="p-4 border-t border-zinc-800/80">
            <button className="flex w-full items-center px-3 py-2 text-sm font-medium rounded-md text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors">
              <LogOut className="w-4 h-4 mr-3" />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-zinc-950">
          {children}
        </main>
      </div>
    </div>
  );
}
