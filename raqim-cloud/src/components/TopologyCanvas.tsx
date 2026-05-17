import React, { useMemo, useEffect, useState } from 'react';
import { ReactFlow, Background, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import styled from 'styled-components';
import { useTopologyStore } from '../store/topologyStore';
import AgentNode from './AgentNode';
import A2aEdge from './A2aEdge';

const nodeTypes = {
  agentNode: AgentNode,
};

const edgeTypes = {
  a2aEdge: A2aEdge,
};

const Container = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #09090b;
  color: #fafafa;
  font-family: 'Inter', monospace;
`;

const Sidebar = styled.aside`
  width: 250px;
  border-right: 1px solid #27272a;
  background-color: #09090b;
  display: flex;
  flex-direction: column;
`;

const SidebarHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #27272a;
  font-weight: bold;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #fff;
`;

const NamespaceList = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const NamespaceItem = styled.div<{ $active: boolean }>`
  padding: 8px 12px;
  border: 1px solid ${props => props.$active ? '#fafafa' : '#27272a'};
  color: ${props => props.$active ? '#09090b' : '#a1a1aa'};
  background-color: ${props => props.$active ? '#fafafa' : 'transparent'};
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${props => props.$active ? '#fafafa' : '#52525b'};
  }
`;

const MainArea = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const TopBar = styled.header`
  height: 60px;
  border-bottom: 1px solid #27272a;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background-color: rgba(9, 9, 11, 0.8);
  backdrop-filter: blur(8px);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
`;

const MetricBox = styled.div`
  display: flex;
  flex-direction: column;
`;

const MetricLabel = styled.div`
  font-size: 10px;
  color: #a1a1aa;
  text-transform: uppercase;
`;

const MetricValue = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  font-variant-numeric: tabular-nums;
`;

export const TopologyCanvas = () => {
  const nodes = useTopologyStore(state => state.nodes);
  const edges = useTopologyStore(state => state.edges);
  const tps = useTopologyStore(state => state.eventsPerSecond);

  const [selectedNamespace, setSelectedNamespace] = useState<string | null>(null);

  const namespaces = useMemo(() => {
    return Array.from(new Set(nodes.map(n => n.data.namespace)));
  }, [nodes]);

  const displayNodes = useMemo(() => {
    if (!selectedNamespace) return nodes;
    return nodes.map(n => ({
      ...n,
      style: {
        ...n.style,
        opacity: n.data.namespace === selectedNamespace ? 1 : 0.2,
        transition: 'opacity 0.3s ease',
      }
    }));
  }, [nodes, selectedNamespace]);

  useEffect(() => {
    // SSE Firehose simulation - Hook up to true endpoint here:
    // const es = new EventSource('/v1/system/firehose');
    // es.onmessage = (event) => { /* Process events using useTopologyStore.getState().handle... */ }
    // return () => es.close();
  }, []);

  return (
    <Container>
      <Sidebar>
        <SidebarHeader>Active Namespaces</SidebarHeader>
        <NamespaceList>
          <NamespaceItem 
            $active={selectedNamespace === null}
            onClick={() => setSelectedNamespace(null)}
          >
            ALL
          </NamespaceItem>
          {namespaces.map(ns => (
            <NamespaceItem 
              key={ns} 
              $active={selectedNamespace === ns}
              onClick={() => setSelectedNamespace(ns)}
            >
              {ns}
            </NamespaceItem>
          ))}
        </NamespaceList>
      </Sidebar>
      <MainArea>
        <TopBar>
          <MetricBox>
            <MetricLabel>Active Nodes</MetricLabel>
            <MetricValue>{nodes.length}</MetricValue>
          </MetricBox>
          <MetricBox style={{ alignItems: 'flex-end' }}>
            <MetricLabel>System TPS</MetricLabel>
            <MetricValue>{tps}</MetricValue>
          </MetricBox>
        </TopBar>
        <ReactFlow
          nodes={displayNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
          minZoom={0.1}
          maxZoom={4}
          colorMode="dark"
        >
          <Background color="#27272a" gap={20} size={1} />
        </ReactFlow>
      </MainArea>
    </Container>
  );
};

export default TopologyCanvas;
