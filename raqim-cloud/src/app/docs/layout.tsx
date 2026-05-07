import Link from "next/link";
import { Book, Cpu, Code2, Box } from "lucide-react";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 flex flex-col md:flex-row font-sans selection:bg-zinc-800">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 border-r border-zinc-800/50 bg-zinc-950/50 flex-shrink-0">
        <div className="p-6 border-b border-zinc-800/50 flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="20" height="20" rx="4" className="fill-white" />
              <path d="M8 12L12 8L16 12M12 16V8" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-bold text-white tracking-tight">raqim docs</span>
          </Link>
        </div>
        
        <nav className="p-4 space-y-1">
          <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 mt-4">Getting Started</div>
          <Link href="/docs" className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-zinc-800/50 text-white">
            <Book className="w-4 h-4 mr-3 text-zinc-400" />
            Quickstart
          </Link>
          <Link href="/docs/architecture" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-900 transition-colors">
            <Box className="w-4 h-4 mr-3 text-zinc-400" />
            Architecture
          </Link>

          <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 mt-6">SDKs</div>
          <Link href="/docs/python" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-900 transition-colors">
            <Code2 className="w-4 h-4 mr-3 text-zinc-400" />
            Python SDK
          </Link>
          
          <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 mt-6">Compute</div>
          <Link href="/docs/wasm" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-900 transition-colors">
            <Cpu className="w-4 h-4 mr-3 text-zinc-400" />
            WASM Agents
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="max-w-4xl mx-auto px-8 py-12 lg:px-12 lg:py-16">
          {children}
        </div>
      </main>
    </div>
  );
}
