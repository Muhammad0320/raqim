'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { ReactFlow, Background, BackgroundVariant, Handle, Position, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { fetchTopology } from '../actions/admin';
import { useSwarmStore, ClusterShard } from '../lib/store/useSwarmStore';

// Custom Styled Components for React Flow Nodes
const CoreNodeContainer = styled(motion.div)`
  background: #050505;
  border: 2px solid #00f3ff;
  border-radius: 50%;
  width: 90px;
  height: 90px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 25px rgba(0, 243, 255, 0.4), inset 0 0 15px rgba(0, 243, 255, 0.2);
  font-family: monospace;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    inset: -6px;
    border: 1px dashed rgba(0, 243, 255, 0.3);
    border-radius: 50%;
    animation: rotate 12s linear infinite;
  }

  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const CoreTitle = styled.div`
  color: #ffffff;
  font-size: 10px;
  font-weight: bold;
  letter-spacing: 1px;
  text-transform: uppercase;
  text-shadow: 0 0 5px #ffffff;
`;

const CoreSub = styled.div`
  color: #00f3ff;
  font-size: 8px;
  margin-top: 2px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: bold;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
`;

const NamespaceNodeContainer = styled(motion.div)`
  background: #09090b;
  border: 1px solid #27272a;
  border-top: 3px solid #00f3ff;
  border-radius: 4px;
  padding: 12px;
  width: 180px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
  font-family: monospace;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &:hover {
    border-color: #00f3ff;
    box-shadow: 0 0 15px rgba(0, 243, 255, 0.15);
  }
`;

const NamespaceHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  border-bottom: 1px solid #1f1f23;
  padding-bottom: 6px;
`;

const NamespaceTitle = styled.span`
  font-size: 10px;
  font-weight: bold;
  color: #fafafa;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 9px;
`;

const StatLabel = styled.span`
  color: #71717a;
`;

const StatValue = styled.span<{ $color?: string }>`
  color: ${props => props.$color || '#ffffff'};
  font-weight: bold;
`;

// Helper to estimate and format memory footprint
function formatMemoryFootprint(crdtOps: number): string {
  // Estimated base size of Loro doc is 250 bytes + 150 bytes per op
  const bytes = 250 + crdtOps * 150;
  if (bytes >= 1048576) {
    return (bytes / 1048576).toFixed(2) + ' MB';
  }
  return (bytes / 1024).toFixed(1) + ' KB';
}

// Custom Node Components
const CoreNode = () => (
  <CoreNodeContainer
    initial={{ scale: 0.5, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: 'spring', stiffness: 80, damping: 12 }}
  >
    <CoreTitle>Raqim</CoreTitle>
    <CoreSub>Core</CoreSub>
    <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
  </CoreNodeContainer>
);

const NamespaceNode = ({ data }: { data: any }) => (
  <NamespaceNodeContainer
    initial={{ scale: 0.8, opacity: 0, y: 15 }}
    animate={{ scale: 1, opacity: 1, y: 0 }}
    transition={{ type: 'spring', stiffness: 100, damping: 15, delay: data.index * 0.1 }}
  >
    <NamespaceHeader>
      <span className="material-symbols-outlined text-[12px] text-[#00f3ff]">folder_open</span>
      <NamespaceTitle title={data.namespace}>{data.namespace}</NamespaceTitle>
    </NamespaceHeader>
    <StatRow>
      <StatLabel>Timelines:</StatLabel>
      <StatValue $color="#00f3ff">{data.active_timelines}</StatValue>
    </StatRow>
    <StatRow>
      <StatLabel>Operations:</StatLabel>
      <StatValue>{data.total_crdt_operation}</StatValue>
    </StatRow>
    <StatRow>
      <StatLabel>Memory Est:</StatLabel>
      <StatValue $color="#a1a1aa">{formatMemoryFootprint(data.total_crdt_operation)}</StatValue>
    </StatRow>
    <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
  </NamespaceNodeContainer>
);

const nodeTypes = {
  core: CoreNode,
  namespace: NamespaceNode,
};

export function TopologyCanvas() {
  const [shards, setShards] = useState<ClusterShard[]>([]);
  const [loading, setLoading] = useState(true);
  const { setActiveTopology } = useSwarmStore();

  const loadTopology = async () => {
    try {
      const data = await fetchTopology();
      setShards(data);
      setActiveTopology(data);
    } catch (e) {
      console.error('Failed to load topology', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopology();
    
    // Poll topology updates every 5 seconds
    const interval = setInterval(loadTopology, 5000);
    return () => clearInterval(interval);
  }, []);

  // Compute Nodes and Edges dynamically
  const { nodes, edges } = useMemo(() => {
    const calculatedNodes: Node[] = [
      {
        id: 'core',
        type: 'core',
        position: { x: 0, y: 0 },
        data: {},
      },
    ];

    const calculatedEdges: Edge[] = [];
    const count = shards.length;
    const radius = 260; // radius of circle layout

    shards.forEach((shard, index) => {
      const angle = index * (Math.PI * 2 / count);
      const x = radius * Math.cos(angle) - 90; // offset node width center
      const y = radius * Math.sin(angle) - 30; // offset node height center

      calculatedNodes.push({
        id: `ns-${shard.namespace}`,
        type: 'namespace',
        position: { x, y },
        data: {
          namespace: shard.namespace,
          active_timelines: shard.active_timelines,
          total_crdt_operation: shard.total_crdt_operation,
          index,
        },
      });

      calculatedEdges.push({
        id: `edge-core-${shard.namespace}`,
        source: 'core',
        target: `ns-${shard.namespace}`,
        animated: true,
        style: { stroke: '#00f3ff', strokeWidth: 1.5, opacity: 0.6 },
      });
    });

    return { nodes: calculatedNodes, edges: calculatedEdges };
  }, [shards]);

  return (
    <div className="flex h-full w-full overflow-hidden">
      <section className="flex-1 bg-surface-container-lowest relative overflow-hidden flex flex-col">
        {/* Canvas Header Toolbar */}
        <div className="h-14 border-b border-outline-variant/15 bg-surface-container/80 backdrop-blur-md flex items-center justify-between px-6 z-10 shrink-0 absolute top-0 w-full pointer-events-none">
          <div className="flex items-center gap-4 pointer-events-auto">
            <h2 className="font-headline font-bold text-on-surface tracking-tight flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-outline text-lg">share</span>
              ACTIVE CRDT TOPOLOGY
            </h2>
            <div className="h-4 w-[1px] bg-outline-variant/30"></div>
            <div className="flex items-center gap-2 bg-[#09090b] px-2 py-1 rounded text-[10px] font-mono text-secondary uppercase tracking-wider border border-outline-variant/15">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f3ff] animate-pulse"></span>
              Observer Live
            </div>
          </div>
          <div className="flex items-center gap-3 pointer-events-auto bg-surface-container/90 px-3 py-1.5 rounded-sm border border-outline-variant/20">
            <span className="text-xs font-mono text-on-surface-variant">Active Shards: {shards.length.toString().padStart(2, '0')}</span>
          </div>
        </div>

        {/* React Flow Canvas */}
        <div className="flex-1 relative z-0 bg-[#020202]">
          {loading && shards.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50">
              <div className="font-mono text-xs text-[#00f3ff] tracking-widest animate-pulse">
                [ ESTABLISHING CONNECTION / RETRIEVING TOPOLOGY... ]
              </div>
            </div>
          ) : null}
          
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            colorMode="dark"
            fitView
            minZoom={0.2}
            maxZoom={2.5}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(0, 243, 255, 0.08)" />
          </ReactFlow>
        </div>
      </section>

      {/* Right Sidebar: Active Namespaces */}
      <aside className="w-80 bg-[#09090b] border-l border-zinc-800 flex flex-col h-full z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 bg-[#0c0c0e]">
          <h2 className="text-[11px] font-mono uppercase tracking-[0.1em] text-zinc-500 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-[#00f3ff]">folder_managed</span>
            Active CRDT Shards
          </h2>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#020202]">
          {shards.length === 0 ? (
            <div className="flex items-center justify-center h-full px-4 text-center">
              <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest animate-pulse">
                No active namespaces detected
              </span>
            </div>
          ) : (
            shards.map((shard) => (
              <div 
                key={shard.namespace}
                className="group bg-[#09090b] hover:bg-[#121215] border border-zinc-800 hover:border-zinc-700 rounded p-3 transition-all"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2 truncate">
                    <span className="material-symbols-outlined text-[13px] text-[#00f3ff]">account_tree</span>
                    <span className="font-mono text-[11px] text-white truncate font-bold">{shard.namespace}</span>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00f3ff]"></span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-zinc-900/50 text-[9px] font-mono text-zinc-400">
                  <div>Timelines: <span className="text-white font-bold">{shard.active_timelines}</span></div>
                  <div>Ops: <span className="text-white font-bold">{shard.total_crdt_operation}</span></div>
                  <div className="col-span-2 mt-1">Est Mem: <span className="text-[#00f3ff]">{formatMemoryFootprint(shard.total_crdt_operation)}</span></div>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
