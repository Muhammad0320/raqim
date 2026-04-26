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
  batchAddThoughts: (thoughts: UiThought[]) => void;
  setActiveTxId: (tx_id: number | null) => void;
  clear: () => void;
}

export const useSwarmStore = create<SwarmState>((set) => ({
  thoughts: {},
  thoughtOrder: [],
  activeTxId: null,

  batchAddThoughts: (newThoughts) =>
    set((state) => {
      const updatedThoughts = { ...state.thoughts };
      const newOrder = [...state.thoughtOrder];

      for (const t of newThoughts) {
        if (!updatedThoughts[t.tx_id]) {
          updatedThoughts[t.tx_id] = t;
          newOrder.push(t.tx_id);
        }
      }

      // Ensure thoughtOrder is sorted chronologically
      newOrder.sort((a, b) => a - b);

      return {
        thoughts: updatedThoughts,
        thoughtOrder: newOrder,
      };
    }),

  setActiveTxId: (tx_id) => set({ activeTxId: tx_id }),
  
  clear: () => set({ thoughts: {}, thoughtOrder: [], activeTxId: null }),
}));
