import Link from "next/link";
import { Github, Mail } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-zinc-800">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex justify-center mb-6 hover:opacity-80 transition-opacity">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="20" height="20" rx="4" className="fill-white" />
            <path d="M8 12L12 8L16 12M12 16V8" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
          Sign in to Raqim
        </h2>
        <p className="text-sm text-zinc-400">
          Enterprise orchestration for agentic workflows
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-950 py-8 px-4 sm:px-10 border border-zinc-800/80 rounded-xl shadow-2xl">
          
          <div className="space-y-3">
            <button className="w-full flex justify-center items-center py-2.5 px-4 border border-zinc-800 rounded-md shadow-sm bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 transition-colors">
              <Github className="w-5 h-5 mr-3 text-white" />
              Continue with GitHub
            </button>
            <button className="w-full flex justify-center items-center py-2.5 px-4 border border-zinc-800 rounded-md shadow-sm bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 transition-colors">
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-zinc-950 text-zinc-500">or</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <form action="#" method="POST" className="space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-zinc-600" aria-hidden="true" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none block w-full pl-10 px-3 py-2.5 border border-zinc-800 bg-zinc-900 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-600 sm:text-sm transition-colors"
                    placeholder="Enter your work email"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 transition-colors"
                >
                  Continue with SAML SSO
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
