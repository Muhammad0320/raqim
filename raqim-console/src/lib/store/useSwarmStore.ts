import { create } from 'zustand';
import { Node, Edge } from '@xyflow/react';

export type UiEvent = 
  | { event_type: "ThoughtCommitted"; agent_hex: string; intent_path: string; tx_id: number; }
  | { event_type: "A2aMessageRouted"; source_agent_hex: string; target_capability: string; latency_ms: number; };

export interface UiThought {
  agent_hex: string;
  intent_path: string;
  text: string;
  tx_id: number;
  status: 'PENDING' | 'COMMITTED' | 'REJECTED' | 'FORKED';
  is_a2a_query: boolean;
  parent_tx_id: number | null;
}

interface SwarmState {
  thoughts: Record<number, UiThought>;
  thoughtOrder: number[];
  activeTxId: number | null;
  tpsHistory: { time: number; tps: number }[];
  currentTps: number;
  agentLastSeen: Record<string, number>;
  thoughtsThisSecond: number;
  highestTxId: number;

  // Topology State
  topologyNodes: Node[];
  topologyEdges: Edge[];
  namespaces: string[];

  batchAddThoughts: (thoughts: UiThought[]) => void;
  processUiEvents: (events: UiEvent[]) => void;
  pruneEphemeralEdges: () => void;
  setActiveTxId: (tx_id: number | null) => void;
  clear: () => void;
}

export const useSwarmStore = create<SwarmState>((set) => ({
  thoughts: {},
  thoughtOrder: [],
  activeTxId: null,
  tpsHistory: Array(60).fill(0).map((_, i) => ({ time: Date.now() - (60 - i) * 1000, tps: 0 })),
  currentTps: 0,
  agentLastSeen: {},
  thoughtsThisSecond: 0,
  highestTxId: 0,

  batchAddThoughts: (newThoughts) =>
    set((state) => {
      const updatedThoughts = { ...state.thoughts };
      const newOrder = [...state.thoughtOrder];
      let newThoughtsThisSecond = state.thoughtsThisSecond;
      const newAgentLastSeen = { ...state.agentLastSeen };
      let maxTx = state.highestTxId;
      const now = Date.now();

      for (const t of newThoughts) {
        if (!updatedThoughts[t.tx_id]) {
          updatedThoughts[t.tx_id] = t;
          newOrder.push(t.tx_id);
          newThoughtsThisSecond++;
          newAgentLastSeen[t.agent_hex] = now;
          if (t.tx_id > maxTx) maxTx = t.tx_id;
        }
      }

      // Ensure thoughtOrder is sorted chronologically
      newOrder.sort((a, b) => a - b);

      return {
        thoughts: updatedThoughts,
        thoughtOrder: newOrder,
        thoughtsThisSecond: newThoughtsThisSecond,
        agentLastSeen: newAgentLastSeen,
        highestTxId: maxTx,
      };
    }),

  processUiEvents: (events) =>
    set((state) => {
      let newNodes = [...state.topologyNodes];
      let newEdges = [...state.topologyEdges];
      const newNamespaces = new Set(state.namespaces);
      const now = Date.now();

      // Ensure namespaces are placed in a circle
      const ensureNamespaceNode = (ns: string) => {
        if (!newNamespaces.has(ns)) {
          newNamespaces.add(ns);
          const index = newNamespaces.size - 1;
          const radius = 500;
          const angle = index * (Math.PI / 3); // Position around center
          newNodes.push({
            id: `cluster-${ns}`,
            type: 'cluster',
            position: { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius },
            data: { label: ns },
            style: { width: 300, height: 300, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px' },
          });
        }
      };

      for (const ev of events) {
        if (ev.event_type === 'ThoughtCommitted') {
          ensureNamespaceNode(ev.intent_path);
          
          const agentNodeId = `agent-${ev.agent_hex}`;
          const existingNodeIndex = newNodes.findIndex(n => n.id === agentNodeId);
          
          if (existingNodeIndex >= 0) {
            // Update pulse state
            newNodes[existingNodeIndex] = {
              ...newNodes[existingNodeIndex],
              data: { ...newNodes[existingNodeIndex].data, pulseTimestamp: now, lastTx: ev.tx_id }
            };
          } else {
            // Create new agent node
            newNodes.push({
              id: agentNodeId,
              type: 'agent',
              parentId: `cluster-${ev.intent_path}`,
              position: { x: 50 + Math.random() * 200, y: 50 + Math.random() * 200 }, // Relative to parent
              data: { agent_hex: ev.agent_hex, intent_path: ev.intent_path, pulseTimestamp: now, lastTx: ev.tx_id },
            });
          }
        } else if (ev.event_type === 'A2aMessageRouted') {
          ensureNamespaceNode(ev.target_capability);
          
          newEdges.push({
            id: `edge-${now}-${Math.random()}`,
            source: `agent-${ev.source_agent_hex}`,
            target: `cluster-${ev.target_capability}`,
            type: 'a2a',
            data: { timestamp: now, latency: ev.latency_ms },
            animated: true,
          });
        }
      }

      return {
        topologyNodes: newNodes,
        topologyEdges: newEdges,
        namespaces: Array.from(newNamespaces)
      };
    }),

  pruneEphemeralEdges: () =>
    set((state) => {
      const now = Date.now();
      // Keep edges created within the last 800ms
      const activeEdges = state.topologyEdges.filter(e => now - (e.data?.timestamp || 0) < 800);
      
      // Also turn off pulse for old nodes
      let nodesChanged = false;
      const updatedNodes = state.topologyNodes.map(n => {
        if (n.type === 'agent' && n.data?.pulseTimestamp && now - n.data.pulseTimestamp > 500) {
          nodesChanged = true;
          return { ...n, data: { ...n.data, pulseTimestamp: null } };
        }
        return n;
      });

      if (activeEdges.length !== state.topologyEdges.length || nodesChanged) {
        return { topologyEdges: activeEdges, topologyNodes: updatedNodes };
      }
      return {};
    }),

  setActiveTxId: (tx_id) => set({ activeTxId: tx_id }),
  
  clear: () => set({ 
    thoughts: {}, 
    thoughtOrder: [], 
    activeTxId: null,
    thoughtsThisSecond: 0,
    agentLastSeen: {},
    tpsHistory: Array(60).fill(0).map((_, i) => ({ time: Date.now() - (60 - i) * 1000, tps: 0 })),
    topologyNodes: [],
    topologyEdges: [],
    namespaces: []
  }),
}));

// Initialize the 1-second rolling window interval on the client side
if (typeof window !== 'undefined') {
  setInterval(() => {
    useSwarmStore.setState((state) => {
      const now = Date.now();
      const currentTps = state.thoughtsThisSecond;
      
      // Update TPS history
      const newHistory = [...state.tpsHistory, { time: now, tps: currentTps }];
      if (newHistory.length > 60) {
        newHistory.shift();
      }

      // Clean up agentLastSeen (older than 60 seconds)
      const newAgentLastSeen = { ...state.agentLastSeen };
      let agentsChanged = false;
      for (const [hex, timestamp] of Object.entries(newAgentLastSeen)) {
        if (now - timestamp > 60000) {
          delete newAgentLastSeen[hex];
          agentsChanged = true;
        }
      }

      return {
        thoughtsThisSecond: 0,
        currentTps,
        tpsHistory: newHistory,
        ...(agentsChanged ? { agentLastSeen: newAgentLastSeen } : {})
      };
    });
  }, 1000);

  // Fast 100ms interval for pruning ephemeral visual edges
  setInterval(() => {
    useSwarmStore.getState().pruneEphemeralEdges();
  }, 100);
}
