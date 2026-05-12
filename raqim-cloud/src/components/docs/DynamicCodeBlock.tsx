"use client";

import React, { useState } from 'react';
import { useDocsContext } from '@/components/docs/DocsProvider';

interface DynamicCodeBlockProps {
  codeTemplate: string;
  language: string;
}

export function DynamicCodeBlock({ codeTemplate, language }: DynamicCodeBlockProps) {
  const { tenantAlias, licenseKey } = useDocsContext();
  const [copied, setCopied] = useState(false);

  // Replace placeholders with real user data from context
  const processedCode = codeTemplate
    .replace(/\{\{TENANT_ALIAS\}\}/g, tenantAlias)
    .replace(/\{\{LICENSE_KEY\}\}/g, licenseKey);

  const handleCopy = () => {
    navigator.clipboard.writeText(processedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl my-8 font-mono text-sm">
      {/* Mac OS Window Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 bg-zinc-900/30">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-zinc-700/50 border border-zinc-600/50"></div>
            <div className="w-3 h-3 rounded-full bg-zinc-700/50 border border-zinc-600/50"></div>
            <div className="w-3 h-3 rounded-full bg-zinc-700/50 border border-zinc-600/50"></div>
          </div>
          <span className="ml-4 text-xs text-zinc-500 uppercase tracking-widest">{language}</span>
        </div>
        
        <button 
          onClick={handleCopy}
          className="flex items-center space-x-1.5 text-xs px-2 py-1 rounded hover:bg-zinc-800 transition-all text-zinc-400 group"
        >
          {copied ? (
            <span className="text-emerald-400">Copied!</span>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 group-hover:opacity-100 transition-opacity"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-5 overflow-x-auto bg-[#0d0d0f] text-zinc-300">
        <pre className="m-0">
          <code>
            {processedCode.split('\n').map((line, i) => {
              let formattedLine = line;
              if (language === 'Python') {
                formattedLine = formattedLine
                  .replace(/from|import|await/g, '<span class="text-pink-400">$&</span>')
                  .replace(/agent = /g, 'agent = ')
                  .replace(/RaqimClient/g, '<span class="text-cyan-400">RaqimClient</span>')
                  .replace(/alias=|tenant=|license=/g, '<span class="text-purple-400">$&</span>')
                  .replace(/"[^"]*"/g, '<span class="text-emerald-400">$&</span>');
              } else if (language === 'Bash') {
                formattedLine = formattedLine
                  .replace(/curl|bash/g, '<span class="text-pink-400">$&</span>')
                  .replace(/--tenant|--license/g, '<span class="text-purple-400">$&</span>')
                  .replace(/https:\/\/[^\s]*/g, '<span class="text-cyan-400">$&</span>');
              }

              return (
                <div key={i} className="table-row">
                  <span className="table-cell text-zinc-700 pr-5 select-none text-right border-r border-zinc-800/50 mr-4">{i + 1}</span>
                  <span className="table-cell pl-4" dangerouslySetInnerHTML={{ __html: formattedLine }} />
                </div>
              );
            })}
          </code>
        </pre>
      </div>
    </div>
  );
}
