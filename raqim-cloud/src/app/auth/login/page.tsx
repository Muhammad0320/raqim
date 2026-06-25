"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Github } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const [companyDomain, setCompanyDomain] = useState("");

  const handleOAuthSignIn = async (provider: 'github' | 'google') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  };

  const handleSsamlSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyDomain) return;
    await supabase.auth.signInWithSSO({ domain: companyDomain });
  };

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-zinc-800">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex justify-center mb-6 hover:opacity-85 transition-opacity">
          {/* Unified, geometric, sharp inline SVG monolithic 'R' logo */}
          <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
            {/* Heavy vertical spine monolith */}
            <path d="M28 15v70" stroke="currentColor" strokeWidth="8" strokeLinecap="square" />
            {/* Sharp, geometric upper loop */}
            <path d="M28 19h36l12 16l-12 16H28" stroke="currentColor" strokeWidth="8" strokeLinecap="square" strokeLinejoin="miter" />
            {/* Intersecting sharp diagonal zero-copy bypass path */}
            <path d="M46 49l28 36" stroke="currentColor" strokeWidth="8" strokeLinecap="square" />
          </svg>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2 font-mono">
          Sign in to Raqim Cloud
        </h2>
        <p className="text-sm text-zinc-500 font-mono">
          Sovereign orchestration for bare-metal multi-agent fleets.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#09090b] py-8 px-4 sm:px-10 border border-zinc-800 rounded-none shadow-none">
          <div className="space-y-3">
            <button
              onClick={() => handleOAuthSignIn('github')}
              className="w-full flex justify-center items-center py-2.5 px-4 bg-black border border-zinc-800 text-white font-mono text-sm tracking-wide rounded-none transition-colors duration-150 ease-in-out hover:bg-zinc-900 focus:outline-none focus:border-zinc-700 cursor-pointer"
            >
              <Github className="w-5 h-5 mr-3 text-white" />
              Continue with GitHub
            </button>
            <button
              onClick={() => handleOAuthSignIn('google')}
              className="w-full flex justify-center items-center py-2.5 px-4 bg-black border border-zinc-800 text-white font-mono text-sm tracking-wide rounded-none transition-colors duration-150 ease-in-out hover:bg-zinc-900 focus:outline-none focus:border-zinc-700 cursor-pointer"
            >
              <svg className="w-5 h-5 mr-3 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider font-mono">
                <span className="px-3 bg-[#09090b] text-zinc-600">OR DIRECT CHANNEL</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <form onSubmit={handleSsamlSignIn} className="space-y-4">
              <div>
                <label htmlFor="companyDomain" className="block text-xs uppercase tracking-widest text-zinc-500 font-mono mb-2">
                  ENTERPRISE SAML IDENTITY
                </label>
                <input
                  id="companyDomain"
                  name="companyDomain"
                  type="text"
                  required
                  value={companyDomain}
                  onChange={(e) => setCompanyDomain(e.target.value)}
                  className="bg-black border border-zinc-800 text-white font-mono text-sm tracking-wide rounded-none focus:border-cyan-400 p-3 w-full focus:outline-none"
                  placeholder="e.g. jpmorgan.com"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 bg-black border border-zinc-800 text-white font-mono text-sm tracking-wide rounded-none transition-colors duration-150 ease-in-out hover:bg-zinc-900 focus:outline-none focus:border-zinc-700 cursor-pointer"
                >
                  [ Continue with SAML SSO ]
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
