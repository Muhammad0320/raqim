import { create } from 'zustand';
import { Node, Edge } from '@xyflow/react';

export type AgentStatus = 'Active' | 'Quarantined';

export interface AgentData extends Record<string, unknown> {
  hex: string;
  alias: string;
  namespace: string;
  status: AgentStatus;
  lastPulse: number;
}

export type AgentNode = Node<AgentData, 'agentNode'>;

export interface A2aEdgeData extends Record<string, unknown> {
  question_payload: string;
}

export type A2aEdge = Edge<A2aEdgeData, 'a2aEdge'>;

interface TopologyState {
  nodes: AgentNode[];
  edges: A2aEdge[];
  eventsPerSecond: number;
  _eventCount: number;
  
  handleThoughtCommited: (payload: { hex: string, namespace: string }) => void;
  handleA2aMessageRouted: (payload: { sourceHex: string, targetHex: string, sourceNamespace: string, targetNamespace: string, question_payload: string }) => void;
  handleAegisAlert: (payload: { hex: string }) => void;
  
  tickTps: () => void;
}

const ALIAS_DICT: Record<string, string> = {
  // Mock dictionary, in a real scenario this would map hex to known aliases
};

const resolveAlias = (hex: string) => {
  if (ALIAS_DICT[hex]) return ALIAS_DICT[hex];
  return `Agent-${hex.slice(0, 4)}`;
};

export const useTopologyStore = create<TopologyState>((set, get) => ({
  nodes: [],
  edges: [],
  eventsPerSecond: 0,
  _eventCount: 0,

  handleThoughtCommited: ({ hex, namespace }) => {
    set((state) => {
      const now = Date.now();
      const existingIdx = state.nodes.findIndex(n => n.id === hex);
      const newNodes = [...state.nodes];
      
      if (existingIdx >= 0) {
        newNodes[existingIdx] = {
          ...newNodes[existingIdx],
          data: {
            ...newNodes[existingIdx].data,
            lastPulse: now,
          }
        };
      } else {
        newNodes.push({
          id: hex,
          position: { x: Math.random() * 600, y: Math.random() * 400 }, // Initial layout, can be improved with a layout engine
          data: {
            hex,
            alias: resolveAlias(hex),
            namespace,
            status: 'Active',
            lastPulse: now,
          },
          type: 'agentNode',
        });
      }

      return { nodes: newNodes, _eventCount: state._eventCount + 1 };
    });
  },

  handleA2aMessageRouted: ({ sourceHex, targetHex, sourceNamespace, targetNamespace, question_payload }) => {
    const now = Date.now();
    
    // Upsert nodes
    get().handleThoughtCommited({ hex: sourceHex, namespace: sourceNamespace });
    get().handleThoughtCommited({ hex: targetHex, namespace: targetNamespace });

    // Create edge
    const edgeId = `${sourceHex}-${targetHex}-${now}`;
    
    set((state) => {
      const newEdge: A2aEdge = {
        id: edgeId,
        source: sourceHex,
        target: targetHex,
        type: 'a2aEdge',
        data: { question_payload },
        animated: true,
      };

      return { edges: [...state.edges, newEdge], _eventCount: state._eventCount + 1 };
    });

    // Cleanup edge
    setTimeout(() => {
      set((s) => ({
        edges: s.edges.filter(e => e.id !== edgeId)
      }));
    }, 2500);
  },

  handleAegisAlert: ({ hex }) => {
    set((state) => {
      const newNodes = state.nodes.map(n => {
        if (n.id === hex) {
          return {
            ...n,
            data: { ...n.data, status: 'Quarantined' as AgentStatus, lastPulse: Date.now() }
          };
        }
        return n;
      });
      return { nodes: newNodes, _eventCount: state._eventCount + 1 };
    });
  },

  tickTps: () => {
    set((state) => ({
      eventsPerSecond: state._eventCount,
      _eventCount: 0
    }));
  }
}));

// Setup global TPS ticker
if (typeof window !== 'undefined') {
  setInterval(() => {
    useTopologyStore.getState().tickTps();
  }, 1000);
}
