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

  const highlightPython = (line: string) => {
    // First escape HTML entities to prevent rendering arbitrary HTML
    const escapedLine = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return escapedLine.replace(
      /("[^"]*")|(\b(?:from|import|await)\b)|(\bRaqimClient\b)|(\b(?:alias|tenant|license|private_key_path|license_key)=)/g,
      (match, p1, p2, p3, p4) => {
        if (p1) return `<span class="text-emerald-400">${p1}</span>`;
        if (p2) return `<span class="text-pink-400">${p2}</span>`;
        if (p3) return `<span class="text-cyan-400">${p3}</span>`;
        if (p4) return `<span class="text-purple-400">${p4}</span>`;
        return match;
      }
    );
  };

  const highlightBash = (line: string) => {
    const escapedLine = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return escapedLine.replace(
      /(https?:\/\/[^\s|]+)|(\b(?:curl|bash)\b)|(-[a-zA-Z0-9]+|--[a-zA-Z0-9-]+)/g,
      (match, p1, p2, p3) => {
        if (p1) return `<span class="text-cyan-400">${p1}</span>`;
        if (p2) return `<span class="text-pink-400">${p2}</span>`;
        if (p3) return `<span class="text-purple-400">${p3}</span>`;
        return match;
      }
    );
  };

  return (
    <div className="rounded-none overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl my-8 font-mono text-sm">
      {/* Mac OS Window Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-none bg-zinc-800 border border-zinc-700"></div>
            <div className="w-2.5 h-2.5 rounded-none bg-zinc-800 border border-zinc-700"></div>
            <div className="w-2.5 h-2.5 rounded-none bg-zinc-800 border border-zinc-700"></div>
          </div>
          <span className="ml-4 text-xs text-zinc-500 uppercase tracking-widest">{language}</span>
        </div>
        
        <button 
          onClick={handleCopy}
          className="flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-none hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all text-zinc-400 group"
        >
          {copied ? (
            <span className="text-cyan-400 font-mono">[ COPIED ]</span>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className="opacity-50 group-hover:opacity-100 transition-opacity">
                <rect x="9" y="9" width="13" height="13"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span className="font-mono">[ COPY ]</span>
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
                formattedLine = highlightPython(line);
              } else if (language === 'Bash') {
                formattedLine = highlightBash(line);
              }

              return (
                <div key={i} className="table-row">
                  <span className="table-cell text-zinc-700 pr-5 select-none text-right border-r border-zinc-850 mr-4">{i + 1}</span>
                  <span className="table-cell pl-4 whitespace-pre" dangerouslySetInnerHTML={{ __html: formattedLine }} />
                </div>
              );
            })}
          </code>
        </pre>
      </div>
    </div>
  );
}
