import React, { useMemo, useEffect, useState } from 'react';
import { ReactFlow, Background, BackgroundVariant } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import styled from 'styled-components';
import { fetchEventSource } from '@microsoft/fetch-event-source';
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
  font-family: monospace;
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
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
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
  border: 1px solid ${props => props.$active ? '#06b6d4' : '#27272a'};
  color: ${props => props.$active ? '#06b6d4' : '#a1a1aa'};
  background-color: ${props => props.$active ? 'rgba(6, 182, 212, 0.08)' : 'transparent'};
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${props => props.$active ? '#06b6d4' : '#52525b'};
    color: ${props => props.$active ? '#06b6d4' : '#fff'};
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
  background-color: rgba(9, 9, 11, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
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
  letter-spacing: 1px;
`;

const MetricValue = styled.div`
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  font-variant-numeric: tabular-nums;
`;

const getCookie = (name: string) => {
  if (typeof document === 'undefined') return '';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
  return '';
};

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
    const token = getCookie('raqim_license') || 'mock_license_key_123';
    const controller = new AbortController();

    const base = typeof window !== 'undefined' && window.location.port === '3000' ? 'http://127.0.0.1:8081' : '';
    const url = `${base}/v1/system/firehose`;

    fetchEventSource(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream',
      },
      signal: controller.signal,
      onmessage(event) {
        try {
          const parsed = JSON.parse(event.data);
          useTopologyStore.getState().processEvent(parsed);
        } catch (e) {
          console.error('Failed to parse firehose event frame', e);
        }
      },
      onerror(err) {
        console.error('Firehose EventSource Error', err);
        throw err;
      }
    });

    return () => {
      controller.abort();
    };
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
            [ ALL ]
          </NamespaceItem>
          {namespaces.map(ns => (
            <NamespaceItem 
              key={ns} 
              $active={selectedNamespace === ns}
              onClick={() => setSelectedNamespace(ns)}
            >
              {ns.toUpperCase()}
            </NamespaceItem>
          ))}
        </NamespaceList>
      </Sidebar>
      <MainArea>
        <TopBar>
          <MetricBox>
            <MetricLabel>Active Nodes</MetricLabel>
            <MetricValue>{nodes.length.toString().padStart(2, '0')}</MetricValue>
          </MetricBox>
          <MetricBox style={{ alignItems: 'flex-end' }}>
            <MetricLabel>System TPS</MetricLabel>
            <MetricValue>{tps.toString().padStart(2, '0')}</MetricValue>
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
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.05)" />
        </ReactFlow>
      </MainArea>
    </Container>
  );
};

export default TopologyCanvas;
