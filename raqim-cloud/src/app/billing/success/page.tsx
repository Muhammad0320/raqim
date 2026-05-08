import Link from 'next/link';

export default function BillingSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 font-sans selection:bg-zinc-800 selection:text-white">
      <div className="max-w-md w-full flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-2">
          <svg className="w-8 h-8 text-emerald-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        
        <h1 className="text-3xl font-medium tracking-tight text-white">Swarm Infrastructure Upgraded.</h1>
        
        <p className="text-sm text-zinc-400 leading-relaxed">
          Your sovereign license key has been mathematically updated. Your daemon will pull the new key on its next telemetry sync.
        </p>

        <div className="w-full pt-6">
          <Link 
            href="/dashboard/billing"
            className="inline-flex justify-center items-center w-full py-3 px-4 bg-white text-zinc-950 text-sm font-semibold rounded-lg hover:bg-zinc-200 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
          >
            Return to Command
          </Link>
        </div>
      </div>
    </div>
  );
}
