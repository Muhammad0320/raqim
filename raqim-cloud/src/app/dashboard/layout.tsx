import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, Key, Activity, Settings, LogOut } from "lucide-react";
import Header from "@/components/dashboard/Header";
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans flex flex-col selection:bg-zinc-800">
      {/* Top Bar */}
      <Header />

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
