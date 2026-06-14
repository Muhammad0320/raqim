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
  handleA2aMessageRouted: (payload: { sourceHex: string, targetHex: string, namespace: string, question_payload: string }) => void;
  handleAegisAlert: (payload: { hex: string }) => void;
  processEvent: (event: any) => void;
  tickTps: () => void;
}

const ALIAS_DICT: Record<string, string> = {};

const resolveAlias = (hex: string) => {
  if (ALIAS_DICT[hex]) return ALIAS_DICT[hex];
  return `Agent-${hex.slice(0, 6).toUpperCase()}`;
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
            namespace,
            lastPulse: now,
          }
        };
      } else {
        // Compute simple dynamic layout position (circular/scattered)
        const count = state.nodes.length;
        const angle = count * (Math.PI / 4);
        const radius = 150 + Math.random() * 100;
        const x = 300 + Math.cos(angle) * radius;
        const y = 200 + Math.sin(angle) * radius;

        newNodes.push({
          id: hex,
          position: { x, y },
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

  handleA2aMessageRouted: ({ sourceHex, targetHex, namespace, question_payload }) => {
    const now = Date.now();
    
    // Upsert source node and target node
    get().handleThoughtCommited({ hex: sourceHex, namespace });
    get().handleThoughtCommited({ hex: targetHex, namespace });

    // Create unique edge id
    const edgeId = `${sourceHex}-${targetHex}-${now}-${Math.random()}`;
    
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

    // Auto-cleanup setTimeout to remove edge after 2500ms
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

  processEvent: (event) => {
    if (event.event_type === 'ThoughtCommited') {
      get().handleThoughtCommited({ hex: event.agent_hex, namespace: event.intent_path });
    } else if (event.event_type === 'A2aMessageRouted') {
      get().handleA2aMessageRouted({
        sourceHex: event.source_hex,
        targetHex: event.target_hex,
        namespace: event.namespace,
        question_payload: event.question_payload,
      });
    } else if (event.event_type === 'AegisAlert') {
      get().handleAegisAlert({ hex: event.record.agent_hex });
    }
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
