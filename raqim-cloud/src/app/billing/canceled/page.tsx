import Link from 'next/link';

export default function BillingCanceledPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 font-sans selection:bg-zinc-800 selection:text-white">
      <div className="max-w-md w-full flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-2">
          <svg className="w-8 h-8 text-zinc-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>
        
        <h1 className="text-3xl font-medium tracking-tight text-white">Upgrade Canceled.</h1>
        
        <p className="text-sm text-zinc-400 leading-relaxed">
          The infrastructure modification was halted. Your current sovereign license constraints remain intact. No mathematical changes have been applied.
        </p>

        <div className="w-full pt-6">
          <Link 
            href="/dashboard/billing"
            className="inline-flex justify-center items-center w-full py-3 px-4 border border-zinc-800 text-zinc-300 text-sm font-semibold rounded-lg hover:bg-zinc-900 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
          >
            Return to Command
          </Link>
        </div>
      </div>
    </div>
  );
}
