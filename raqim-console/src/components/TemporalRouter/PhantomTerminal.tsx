'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Terminal, Trash2, Radio, ArrowDownCircle } from 'lucide-react';
import { getPhantomStreamUrl } from '../../lib/api';

interface PhantomLog {
  id: string;
  timestamp: string;
  type: 'INFO' | 'DELTA' | 'FORK' | 'WARN';
  message: string;
}

export function PhantomTerminal() {
  const [logs, setLogs] = useState<PhantomLog[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      type: 'INFO',
      message: '[PHANTOM_STREAM] Initialized phantom simulation telemetry buffer.',
    },
    {
      id: 'init-2',
      timestamp: new Date().toLocaleTimeString(),
      type: 'INFO',
      message: '[SANDBOX] WASI copy-on-write memory hypervisor standing by.',
    },
  ]);
  const [isConnected, setIsConnected] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Connect to SSE stream at /v1/time-travel/stream
  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      const streamUrl = getPhantomStreamUrl();
      eventSource = new EventSource(streamUrl);

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const newLog: PhantomLog = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toLocaleTimeString(),
            type: data.type || (data.phantom_namespace ? 'FORK' : 'DELTA'),
            message:
              typeof data === 'string'
                ? data
                : data.message ||
                  data.text ||
                  `[DELTA] Step #${data.step_ordinal || 0} -> ${data.phantom_namespace || 'in-memory branch'}`,
          };
          setLogs((prev) => [...prev.slice(-200), newLog]);
        } catch {
          const rawLog: PhantomLog = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toLocaleTimeString(),
            type: 'INFO',
            message: event.data,
          };
          setLogs((prev) => [...prev.slice(-200), rawLog]);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
      };
    } catch {
      setIsConnected(false);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleClear = () => {
    setLogs([]);
  };

  const getLogColor = (type: PhantomLog['type']) => {
    switch (type) {
      case 'FORK':
        return 'text-purple-400';
      case 'DELTA':
        return 'text-cyan-300';
      case 'WARN':
        return 'text-amber-400';
      default:
        return 'text-emerald-400';
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-black/90 border border-slate-800 rounded-sm overflow-hidden shadow-lg font-mono text-xs">
      {/* Header */}
      <div className="bg-[#080C14] border-b border-slate-800 px-3 py-2 flex items-center justify-between gap-2 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-sans text-xs uppercase tracking-wider font-bold text-white">
            Phantom Simulation Stream Terminal
          </span>
          <div className="flex items-center gap-1 text-[10px]">
            <Radio className={`w-3 h-3 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span className={isConnected ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
              {isConnected ? 'STREAMING' : 'STANDBY'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px]">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-xs border transition-colors ${
              autoScroll
                ? 'bg-slate-900 border-slate-700 text-slate-200'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            <ArrowDownCircle className="w-3 h-3" />
            <span>AUTO-SCROLL: {autoScroll ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={handleClear}
            className="p-1 text-slate-400 hover:text-rose-400 rounded-xs hover:bg-slate-900 transition-colors"
            title="Clear Terminal Logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div className="flex-1 p-3 overflow-y-auto space-y-1 bg-[#03060C] text-[11px] leading-relaxed">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-2">
            <span className="text-slate-500 text-[10px] shrink-0 select-none">
              [{log.timestamp}]
            </span>
            <span className={`break-all ${getLogColor(log.type)}`}>
              {log.message}
            </span>
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}
