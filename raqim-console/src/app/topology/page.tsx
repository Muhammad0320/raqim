'use client';

import { MainLayout } from '../../components/Layout/MainLayout';
import { useSwarmStore } from '../../lib/store/useSwarmStore';
import { useSwarmStream } from '../../lib/hooks/useSwarmStream';
import { ReactFlow, ReactFlowProvider, Background, BackgroundVariant, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AgentNode } from '../../components/Topology/AgentNode';
import { ClusterNode } from '../../components/Topology/ClusterNode';
import { A2aEdge } from '../../components/Topology/A2aEdge';
import { useMemo, useEffect } from 'react';

const nodeTypes = {
  agent: AgentNode,
  cluster: ClusterNode,
};

const edgeTypes = {
  a2a: A2aEdge,
};

function TopologyCanvas() {
  useSwarmStream(); // Hook into the SSE stream
  const topologyNodes = useSwarmStore(state => state.topologyNodes);
  const topologyEdges = useSwarmStore(state => state.topologyEdges);
  const namespaces = useSwarmStore(state => state.namespaces);
  const currentTps = useSwarmStore(state => state.currentTps);

  const { fitBounds } = useReactFlow();

  useEffect(() => {
    useSwarmStore.getState().fetchInitialTopology();
  }, []);

  const handleNamespaceClick = (ns: string) => {
    const node = topologyNodes.find(n => n.id === `cluster-${ns}`);
    if (node) {
      fitBounds(
        { x: node.position.x, y: node.position.y, width: 350, height: 300 }, 
        { duration: 800, padding: 0.5 }
      );
    }
  };

  // Helper to color namespaces deterministically
  const getNamespaceColor = (ns: string) => {
    let hash = 0;
    for (let i = 0; i < ns.length; i++) hash = ns.charCodeAt(i) + ((hash << 5) - hash);
    const hues = [180, 300, 120, 45, 210];
    return `hsl(${hues[Math.abs(hash) % hues.length]}, 100%, 65%)`;
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Swarm Topology Canvas */}
      <section className="flex-1 bg-surface-container-lowest relative overflow-hidden flex flex-col">
        {/* Canvas Header Toolbar */}
        <div className="h-14 border-b border-outline-variant/15 bg-surface-container/80 backdrop-blur-md flex items-center justify-between px-6 z-10 shrink-0 absolute top-0 w-full pointer-events-none">
          <div className="flex items-center gap-4 pointer-events-auto">
            <h2 className="font-headline font-bold text-on-surface tracking-tight flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-outline text-lg">share</span>
              SWARM TOPOLOGY
            </h2>
            <div className="h-4 w-[1px] bg-outline-variant/30"></div>
            <div className="flex items-center gap-2 bg-surface-container-highest px-2 py-1 rounded text-[10px] font-mono text-secondary uppercase tracking-wider border border-outline-variant/15">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              Network Healthy
            </div>
          </div>
          <div className="flex items-center gap-3 pointer-events-auto bg-surface-container/90 px-3 py-1.5 rounded-sm border border-outline-variant/20">
            <span className="text-xs font-mono text-on-surface-variant">Nodes: {topologyNodes.filter(n => n.type === 'agent').length.toString().padStart(2, '0')}</span>
            <span className={`text-xs font-mono ${currentTps > 0 ? 'text-[#00f3ff] drop-shadow-[0_0_5px_rgba(0,243,255,0.8)]' : 'text-on-surface-variant'}`}>
              TPS: {currentTps}
            </span>
          </div>
        </div>

        {/* React Flow Canvas */}
        <div className="flex-1 relative z-0 bg-[#09090b]">
          <ReactFlow
            nodes={topologyNodes}
            edges={topologyEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            colorMode="dark"
            fitView
            minZoom={0.2}
            maxZoom={4}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={32} size={1} color="rgba(255,255,255,0.05)" />
          </ReactFlow>
        </div>
      </section>

      {/* Right Sidebar: Active Namespaces */}
      <aside className="w-80 bg-surface border-l border-outline-variant/15 flex flex-col h-full z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-outline-variant/15 bg-surface-container-low">
          <h2 className="text-[11px] font-mono uppercase tracking-[0.1em] text-outline mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">folder_managed</span>
            Active Namespaces
          </h2>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1.5 text-[16px] text-outline">search</span>
            <input className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded text-xs py-1.5 pl-8 pr-3 text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/20 transition-all font-mono placeholder:text-outline-variant" placeholder="Filter namespaces..." type="text" />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-[#0a0a0a]">
          {namespaces.length === 0 ? (
            <div className="flex items-center justify-center h-full px-4 text-center">
              <span className="font-mono text-[10px] text-outline-variant uppercase tracking-widest animate-pulse">Awaiting semantic ingress...</span>
            </div>
          ) : (
            namespaces.map((ns) => {
              const nsColor = getNamespaceColor(ns);
              const nodeCount = topologyNodes.filter(n => n.type === 'agent' && n.data.intent_path === ns).length;
              
              return (
                <div 
                  key={ns}
                  onClick={() => handleNamespaceClick(ns)}
                  className="group bg-surface-container hover:bg-surface-container-high border border-transparent hover:border-outline-variant/30 rounded p-3 cursor-pointer transition-all shadow-sm"
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center gap-2 truncate">
                      <span className="material-symbols-outlined text-[14px]" style={{ color: nsColor }}>account_tree</span>
                      <span className="font-mono text-[11px] text-white truncate">{ns}</span>
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full shadow-[0_0_4px_currentColor] shrink-0" style={{ backgroundColor: nsColor, color: nsColor }}></span>
                  </div>
                  <div className="pl-6 mt-2 flex gap-2">
                    <span className="bg-surface-container-lowest text-outline px-1.5 py-0.5 rounded text-[9px] font-mono border border-outline-variant/10 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[10px]">memory</span>
                      {nodeCount} Nodes
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
}

export default function TopologyPage() {
  return (
    <MainLayout title="Swarm Topology">
      <ReactFlowProvider>
        <TopologyCanvas />
      </ReactFlowProvider>
    </MainLayout>
  );
}
