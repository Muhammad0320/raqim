import { UiThought, UiEvent } from './store/useSwarmStore';

const MOCK_AGENTS = ['AX-901', 'KR-442', 'US-110', 'BR-771'];

// Generates a mock Hex ID
function genHex(length = 16) {
  return [...Array(length)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}

export function generateMockThought(tx_id: number, parent_tx: number | null = null): UiThought {
  const isA2A = Math.random() > 0.8;
  return {
    tx_id: tx_id,
    parent_tx_id: parent_tx,
    agent_hex: MOCK_AGENTS[Math.floor(Math.random() * MOCK_AGENTS.length)],
    intent_path: isA2A ? '/a2a/negotiation' : '/mem/retrieve',
    text: JSON.stringify({ action: "observe", target: "local_state", confidence: Math.random() }),
    status: Math.random() > 0.9 ? 'FORKED' : 'COMMITTED',
    is_a2a_query: isA2A
  };
}

// Function to start streaming mock data to the buffer ref locally
export function startMockStream(pushToBuffer: (t: UiThought, evs: UiEvent[]) => void) {
  let currentTxId = 1;
  
  const genInterval = setInterval(() => {
    // sometimes fork reality
    const parent = Math.random() > 0.3 && currentTxId > 1 ? currentTxId - 1 : null; 
    const t = generateMockThought(currentTxId, parent);
    currentTxId++;

    const events: UiEvent[] = [];
    
    // Always emit a ThoughtCommitted
    events.push({
      event_type: "ThoughtCommitted",
      agent_hex: t.agent_hex,
      intent_path: t.intent_path,
      tx_id: t.tx_id
    });

    // Randomly emit an A2A routing event
    if (Math.random() > 0.6) {
      const targets = ['rqm_finance', 'rqm_logistics', 'rqm_auth', 'rqm_telemetry'];
      events.push({
        event_type: "A2aMessageRouted",
        source_agent_hex: t.agent_hex,
        target_capability: targets[Math.floor(Math.random() * targets.length)],
        latency_ms: Math.floor(200 + Math.random() * 600)
      });
    }

    pushToBuffer(t, events);
  }, 150); // Emits fast for visual density

  return () => clearInterval(genInterval);
}
