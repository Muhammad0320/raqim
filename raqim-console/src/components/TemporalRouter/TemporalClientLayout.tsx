'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '../Layout/MainLayout';
import { TemporalHeaderRibbon } from './TemporalHeaderRibbon';
import { StepScrubberDeck } from './StepScrubberDeck';
import { EffectDiffInspector } from './EffectDiffInspector';
import { PhantomTerminal } from './PhantomTerminal';
import { WasmHypervisorPanel } from './WasmHypervisorPanel';
import { TimelineNode, formatTxIdHex } from '../../lib/api';
import { fetchAgentTimeline } from '../../actions/admin';
import { useSwarmStore } from '../../lib/store/useSwarmStore';
import { useSwarmStream } from '../../lib/hooks/useSwarmStream';
import {
  Terminal,
  Cpu,
  Lock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface TemporalClientLayoutProps {
  agentAliases: Record<string, string>;
  initialTimeline?: TimelineNode[];
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  text: string;
}

export function TemporalClientLayout({
  agentAliases,
  initialTimeline = [],
}: TemporalClientLayoutProps) {
  useSwarmStream();

  const agentEntries = Object.keys(agentAliases);
  const defaultAgent = agentEntries.length > 0 ? agentEntries[0] : '096da8e8a1b2c3d4e5f60718293a4b5c';

  const [selectedAgentHex, setSelectedAgentHex] = useState(defaultAgent);
  const [timeline, setTimeline] = useState<TimelineNode[]>(initialTimeline);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [activeTab, setActiveTab] = useState<'PHANTOM_STREAM' | 'WASM_HYPERVISOR'>('PHANTOM_STREAM');

  const [mode, setMode] = useState<'RECORD' | 'REPLAY' | 'FORK'>('RECORD');
  const [divergentIndex, setDivergentIndex] = useState<number | null>(null);
  const [forkedBranchPath, setForkedBranchPath] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const setStoreAliases = useSwarmStore((state) => state.setAgentAliases);

  useEffect(() => {
    if (agentAliases && Object.keys(agentAliases).length > 0) {
      setStoreAliases(agentAliases);
    }
  }, [agentAliases, setStoreAliases]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Load timeline for selected agent
  const loadTimeline = useCallback(async (agentHex: string) => {
    setIsLoadingTimeline(true);
    try {
      const nodes = await fetchAgentTimeline(agentHex);
      setTimeline(nodes || []);
      if (nodes && nodes.length > 0) {
        setSelectedIndex(nodes.length - 1);
      } else {
        setSelectedIndex(0);
      }
    } catch {
      setTimeline([]);
    } finally {
      setIsLoadingTimeline(false);
    }
  }, []);

  useEffect(() => {
    loadTimeline(selectedAgentHex);
  }, [selectedAgentHex, loadTimeline]);

  // Auto-play replay timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying && timeline.length > 0) {
      timer = setInterval(() => {
        setSelectedIndex((prev) => {
          if (prev < timeline.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, timeline.length]);

  const currentNode = timeline[selectedIndex] || null;
  const activeTxIdHex = currentNode ? formatTxIdHex(currentNode.tx_id) : null;
  const activeTxIdNumber = currentNode ? (typeof currentNode.tx_id === 'number' ? currentNode.tx_id : parseInt(String(currentNode.tx_id), 16) || 0) : 0;

  const handleForkAtStep = (step: number) => {
    setDivergentIndex(step);
    setMode('FORK');
    const branch = `phantom_${selectedAgentHex.slice(0, 8)}_step${step}`;
    setForkedBranchPath(branch);
    setActiveTab('WASM_HYPERVISOR');
    showToast(`BRANCH FORKED AT STEP #${step} -> ${branch}`, 'success');
  };

  const handleForkSuccess = (phantomNamespace: string) => {
    setForkedBranchPath(phantomNamespace);
    setMode('FORK');
    setDivergentIndex(selectedIndex);
    showToast(`REALITY FORK DEPLOYED TO ${phantomNamespace}`, 'success');
  };

  const handleStepForward = () => {
    if (selectedIndex < timeline.length - 1) {
      setSelectedIndex((prev) => prev + 1);
      setMode('REPLAY');
    }
  };

  const handleResetToHead = () => {
    setSelectedIndex(Math.max(timeline.length - 1, 0));
    setMode('RECORD');
    setDivergentIndex(null);
    setForkedBranchPath(null);
    setIsPlaying(false);
    showToast('REVERTED TO MAIN CANONICAL TIMELINE', 'success');
  };

  return (
    <MainLayout title="Temporal Fork Observatory // Effect Replay Deck">
      <div className="flex flex-col h-full w-full bg-[#080C14] overflow-hidden p-3 gap-3">
        {/* 1. Header Ribbon Controls */}
        <TemporalHeaderRibbon
          agentAliases={agentAliases}
          selectedAgentHex={selectedAgentHex}
          onSelectAgent={(hex) => {
            setSelectedAgentHex(hex);
            setDivergentIndex(null);
            setForkedBranchPath(null);
            setMode('RECORD');
          }}
          mode={mode}
          activeTxIdHex={activeTxIdHex}
          onOpenForkModal={() => setActiveTab('WASM_HYPERVISOR')}
          onStepForward={handleStepForward}
          onResetToHead={handleResetToHead}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
        />

        {/* 2. Full-Width Sequential Effect Scrubber */}
        <StepScrubberDeck
          timeline={timeline}
          selectedIndex={selectedIndex}
          onSelectIndex={(idx) => {
            setSelectedIndex(idx);
            if (idx < timeline.length - 1) {
              setMode('REPLAY');
            } else {
              setMode('RECORD');
            }
          }}
          isLoading={isLoadingTimeline}
          divergentIndex={divergentIndex}
        />

        {/* 3. Lower Workspace: 2-Column Comparative Split */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">
          {/* Left: Side-Effect Boundary & Diff Inspector (55% width) */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col min-h-0 h-full overflow-hidden">
            <EffectDiffInspector
              currentNode={currentNode}
              stepIndex={selectedIndex}
              agentHex={selectedAgentHex}
              isForked={divergentIndex !== null && selectedIndex >= divergentIndex}
              forkedBranchPath={forkedBranchPath}
              onForkAtStep={handleForkAtStep}
            />
          </div>

          {/* Right: Tabbed Panel (Phantom Stream + Monaco Hypervisor) (45% width) */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col min-h-0 h-full overflow-hidden bg-[#0D1322] border border-slate-800 rounded-sm shadow-lg">
            {/* Tab Selector Header */}
            <div className="bg-[#080C14] border-b border-slate-800 px-3 py-1 flex items-center justify-between gap-2 shrink-0 select-none">
              <div className="flex items-center gap-1 font-mono text-xs">
                <button
                  onClick={() => setActiveTab('PHANTOM_STREAM')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs font-bold uppercase transition-colors ${
                    activeTab === 'PHANTOM_STREAM'
                      ? 'bg-slate-900 border border-slate-700 text-cyan-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Phantom Log Stream</span>
                </button>

                <button
                  onClick={() => setActiveTab('WASM_HYPERVISOR')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs font-bold uppercase transition-colors ${
                    activeTab === 'WASM_HYPERVISOR'
                      ? 'bg-purple-950/80 border border-purple-700 text-purple-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Lock className="w-3 h-3 text-purple-400" />
                  <span>Enterprise WASI</span>
                </button>
              </div>

              <span className="font-mono text-[9px] text-slate-500 uppercase">
                {activeTab === 'PHANTOM_STREAM' ? 'ISOLATED SSE' : 'SYNTHETIC INJECTOR'}
              </span>
            </div>

            {/* Tab Body */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {activeTab === 'PHANTOM_STREAM' ? (
                <PhantomTerminal />
              ) : (
                <WasmHypervisorPanel
                  agentHex={selectedAgentHex}
                  targetTxId={activeTxIdNumber}
                  onForkSuccess={handleForkSuccess}
                  onError={(err) => showToast(`FORK ERROR: ${err}`, 'error')}
                />
              )}
            </div>
          </div>
        </div>

        {/* 4. Floating Confirmation Toasts */}
        <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 font-mono text-xs select-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xs border shadow-2xl animate-in slide-in-from-bottom-2 duration-150 ${
                toast.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500/80 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'bg-rose-950/90 border-rose-500/80 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
              <span>{toast.text}</span>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
