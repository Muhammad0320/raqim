import { create } from 'zustand';

// Representing `SystemEvent::ThoughtCommitted` structure based on requirement hints
export interface ThoughtCommitted {
  tx_id: string; // The primary chronological/logical identifier
  parent_tx_id: string | null; // For DAG branching
  agent_id: string;
  status: 'PENDING' | 'COMMITTED' | 'REJECTED' | 'FORKED';
  intent_path: string;
  entropy_seeds: number[];
  cryptographic_hash: string;
  timestamp: number;
  payload: string; // the full text or thought content
  is_a2a_query: boolean;
}

interface SwarmState {
  thoughts: Record<string, ThoughtCommitted>;
  thoughtOrder: string[]; // Ordered list of tx_ids to render timeline
  activeTxId: string | null; // The scrubber's current position
  addThought: (thought: ThoughtCommitted) => void;
  batchAddThoughts: (thoughts: ThoughtCommitted[]) => void;
  setActiveTxId: (tx_id: string | null) => void;
  clear: () => void;
}

export const useSwarmStore = create<SwarmState>((set) => ({
  thoughts: {},
  thoughtOrder: [],
  activeTxId: null,

  addThought: (thought) =>
    set((state) => {
      // Ignore if exists
      if (state.thoughts[thought.tx_id]) return state;

      return {
        thoughts: { ...state.thoughts, [thought.tx_id]: thought },
        thoughtOrder: [...state.thoughtOrder, thought.tx_id],
      };
    }),

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

      return {
        thoughts: updatedThoughts,
        thoughtOrder: newOrder,
      };
    }),

  setActiveTxId: (tx_id) => set({ activeTxId: tx_id }),
  
  clear: () => set({ thoughts: {}, thoughtOrder: [], activeTxId: null }),
}));
