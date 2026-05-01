import { create } from 'zustand';
import { Node, Edge } from '@xyflow/react';

export interface AegisRecord {
    agent_hex: string;
    violation_type: "CRYPTO_SPOOF" | "NAMESPACE_BREACH" | "RAG_POISONING";
    attempted_path: string;
    payload_preview: string;
    timestamp: number;
}

export type UiEvent = 
  | { event_type: "ThoughtCommitted"; agent_hex: string; intent_path: string; tx_id: number; text: string; }
  | { event_type: "A2aMessageRouted"; source_hex: string; target_hex: string; namespace: string; question_payload: string; answer_payload: string; latency_ms: number; }
  | { event_type: "AegisAlert"; record: AegisRecord };

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

  // Firewall State
  aegisAlerts: AegisRecord[];
  quarantinedAgents: string[];

  fetchInitialTopology: () => Promise<void>;
  batchAddThoughts: (thoughts: UiThought[]) => void;
  processUiEvents: (events: UiEvent[]) => void;
  pruneEphemeralEdges: () => void;
  setActiveTxId: (tx_id: number | null) => void;
  liftQuarantine: (agent_hex: string) => void;
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

  // Topology State
  topologyNodes: [],
  topologyEdges: [],
  namespaces: [],

  // Firewall State
  aegisAlerts: [],
  quarantinedAgents: [],

  liftQuarantine: (agent_hex: string) => 
    set((state) => ({
      quarantinedAgents: state.quarantinedAgents.filter(a => a !== agent_hex)
    })),

  fetchInitialTopology: async () => {
    // In a real app, this would be a fetch to /v1/swarm/topology/snapshot
    // For now we mock it with the imported mock function
    const { fetchMockTopologySnapshot } = await import('../mockGenerator');
    const snapshot = await fetchMockTopologySnapshot();
    
    set((state) => {
      const newNodes: Node[] = [];
      const newNamespaces = new Set<string>();

      // Render Parent Nodes for active namespaces
      snapshot.active_namespaces.forEach((ns, index) => {
        newNamespaces.add(ns);
        const radius = 500;
        const angle = index * (Math.PI * 2 / snapshot.active_namespaces.length); 
        newNodes.push({
          id: `cluster-${ns}`,
          type: 'cluster',
          position: { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius },
          data: { label: ns },
          style: { width: 350, height: 300, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px' },
        });
      });

      // Render children with deterministic grid placement
      const agentCounts: Record<string, number> = {};
      snapshot.agents.forEach((agent) => {
        const ns = agent.namespace;
        agentCounts[ns] = (agentCounts[ns] || 0);
        const i = agentCounts[ns];
        agentCounts[ns]++;

        // Grid of 3 columns
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = 40 + col * 100;
        const y = 70 + row * 100;

        newNodes.push({
          id: `agent-${agent.agent_hex}`,
          type: 'agent',
          parentId: `cluster-${agent.namespace}`,
          extent: 'parent',
          position: { x, y }, 
          data: { agent_hex: agent.agent_hex, intent_path: agent.namespace, pulseTimestamp: null, lastTx: 0, lastText: "" },
        });
      });

      return {
        topologyNodes: newNodes,
        namespaces: Array.from(newNamespaces)
      };
    });
  },

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
            style: { width: 350, height: 300, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px' },
          });
        }
      };

      for (const ev of events) {
        if (ev.event_type === 'ThoughtCommitted') {
          ensureNamespaceNode(ev.intent_path);
          
          const agentNodeId = `agent-${ev.agent_hex}`;
          const existingNodeIndex = newNodes.findIndex(n => n.id === agentNodeId);
          
          if (existingNodeIndex >= 0) {
            // Update pulse state and save the text for the tooltip
            newNodes[existingNodeIndex] = {
              ...newNodes[existingNodeIndex],
              data: { ...newNodes[existingNodeIndex].data, pulseTimestamp: now, lastTx: ev.tx_id, lastText: ev.text }
            };
          } else {
            // Should not happen frequently if bootstrap worked, but fallback to grid logic
            const siblingsCount = newNodes.filter(n => n.parentId === `cluster-${ev.intent_path}`).length;
            const col = siblingsCount % 3;
            const row = Math.floor(siblingsCount / 3);
            
            newNodes.push({
              id: agentNodeId,
              type: 'agent',
              parentId: `cluster-${ev.intent_path}`,
              extent: 'parent',
              position: { x: 40 + col * 100, y: 70 + row * 100 },
              data: { agent_hex: ev.agent_hex, intent_path: ev.intent_path, pulseTimestamp: now, lastTx: ev.tx_id, lastText: ev.text },
            });
          }
        } else if (ev.event_type === 'A2aMessageRouted') {
          // Edge to target agent! If agent doesn't exist yet, we still create the edge to the presumed id.
          // React flow handles missing targets gracefully (it just doesn't render the edge, or renders it to 0,0, but usually ignores it).
          // We will create the edge if the target agent node exists.
          
          if (newNodes.some(n => n.id === `agent-${ev.target_hex}`)) {
            newEdges.push({
              id: `edge-${now}-${Math.random()}`,
              source: `agent-${ev.source_hex}`,
              target: `agent-${ev.target_hex}`,
              type: 'a2a',
              data: { timestamp: now, latency: ev.latency_ms, question_payload: ev.question_payload },
              animated: true,
            });
          }
        } else if (ev.event_type === 'AegisAlert') {
          newAlerts.push(ev.record);
          newQuarantined.add(ev.record.agent_hex);
        }
      }

      return {
        topologyNodes: newNodes,
        topologyEdges: newEdges,
        namespaces: Array.from(newNamespaces),
        aegisAlerts: newAlerts.slice(-200), // Keep last 200 alerts
        quarantinedAgents: Array.from(newQuarantined)
      };
    }),

  pruneEphemeralEdges: () =>
    set((state) => {
      const now = Date.now();
      // Keep edges created within the last 2000ms so popup can live
      const activeEdges = state.topologyEdges.filter(e => now - (e.data?.timestamp || 0) < 2000);
      
      // Also turn off pulse for old nodes
      let nodesChanged = false;
      const updatedNodes = state.topologyNodes.map(n => {
        if (n.type === 'agent' && n.data?.pulseTimestamp && now - n.data.pulseTimestamp > 3000) {
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
