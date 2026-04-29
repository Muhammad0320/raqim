import { create } from 'zustand';

export interface UiThought {
  agent_hex: string;
  intent_path: string;
  text: string;
  tx_id: number;
  // Synthetic UI state added during ingest
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
  batchAddThoughts: (thoughts: UiThought[]) => void;
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

  setActiveTxId: (tx_id) => set({ activeTxId: tx_id }),
  
  clear: () => set({ 
    thoughts: {}, 
    thoughtOrder: [], 
    activeTxId: null,
    thoughtsThisSecond: 0,
    agentLastSeen: {},
    tpsHistory: Array(60).fill(0).map((_, i) => ({ time: Date.now() - (60 - i) * 1000, tps: 0 }))
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
}
