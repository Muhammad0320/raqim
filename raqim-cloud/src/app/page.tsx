import Link from "next/link";
import { Terminal, Copy, Shield, Brain, GitBranch } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white selection:bg-zinc-800">
      <header className="flex items-center justify-between px-8 py-6 border-b border-zinc-800/50 backdrop-blur-sm sticky top-0 z-50 bg-zinc-950/80">
        <div className="flex items-center space-x-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="20" height="20" rx="4" className="fill-white" />
            <path d="M8 12L12 8L16 12M12 16V8" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-bold tracking-tight text-lg">raqim</span>
        </div>
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-zinc-400">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
        </nav>
        <div className="flex items-center space-x-4">
          <Link href="/auth/login" className="text-sm font-medium hover:text-zinc-300 transition-colors">
            Log In
          </Link>
          <Link href="/auth/login" className="px-4 py-2 text-sm font-medium bg-white text-black rounded-md hover:bg-zinc-200 transition-colors">
            Get Started
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 px-8 flex flex-col items-center text-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-zinc-800/20 via-zinc-950/0 to-zinc-950/0 -z-10" />
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 max-w-4xl bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
            The Deterministic Swarm OS.
          </h1>
          <p className="text-xl text-zinc-400 mb-10 max-w-2xl font-light">
            Zero-copy Rust infrastructure for multi-agent LLM systems. Build, deploy, and scale intelligent swarms with absolute determinism.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <Link href="/auth/login" className="h-12 px-8 rounded-md bg-white text-black font-medium flex items-center justify-center hover:bg-zinc-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)]">
              Start Building Free
            </Link>
            
            <div className="h-12 flex items-center bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden group">
              <div className="px-4 flex items-center border-r border-zinc-800 text-zinc-500 h-full">
                <Terminal className="w-4 h-4" />
              </div>
              <code className="px-4 text-sm font-mono text-zinc-300">curl -sL raqim.cloud/install | bash</code>
              <button className="px-4 h-full flex items-center hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white" title="Copy to clipboard">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-24 px-8 border-t border-zinc-800/50 bg-zinc-950">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-8 rounded-2xl border border-zinc-800/50 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors">
                <div className="w-12 h-12 bg-zinc-800/50 rounded-lg flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Ed25519 Aegis Firewall</h3>
                <p className="text-zinc-400 leading-relaxed text-sm">
                  Cryptographically secure inter-agent communication. Every thought, action, and state transition is verified with zero-trust networking baked in.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-2xl border border-zinc-800/50 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors">
                <div className="w-12 h-12 bg-zinc-800/50 rounded-lg flex items-center justify-center mb-6">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">CRDT Semantic Brain</h3>
                <p className="text-zinc-400 leading-relaxed text-sm">
                  Distributed memory architectures using Conflict-free Replicated Data Types. Swarms achieve consensus instantly without central bottlenecks.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-2xl border border-zinc-800/50 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors">
                <div className="w-12 h-12 bg-zinc-800/50 rounded-lg flex items-center justify-center mb-6">
                  <GitBranch className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Reality Forking</h3>
                <p className="text-zinc-400 leading-relaxed text-sm">
                  Branch your agent's execution state instantly. Test hypothetical scenarios, simulate outcomes, and merge optimal paths back to the main timeline.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-800/50 py-12 px-8 text-center text-zinc-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Raqim Systems Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
