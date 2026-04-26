import { ThoughtCommitted } from '../store/useSwarmStore';

const MOCK_AGENTS = ['AX-901-DELTA', 'KR-442-OMEGA', 'US-110-SIGMA', 'BR-771-ALPHA'];
const STATUSES: ThoughtCommitted['status'][] = ['COMMITTED', 'COMMITTED', 'COMMITTED', 'PENDING', 'FORKED'];

// Generates a mock Hex ID
function genHex(length = 16) {
  return [...Array(length)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}

export function generateMockThought(parent_tx: string | null = null): ThoughtCommitted {
  const isA2A = Math.random() > 0.8;
  return {
    tx_id: '0x' + genHex(16),
    parent_tx_id: parent_tx,
    agent_id: MOCK_AGENTS[Math.floor(Math.random() * MOCK_AGENTS.length)],
    status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
    intent_path: isA2A ? '/a2a/negotiation' : '/mem/retrieve',
    entropy_seeds: [Math.random(), Math.random()],
    cryptographic_hash: 'sha256:' + genHex(64),
    timestamp: Date.now(),
    payload: JSON.stringify({ action: "observe", target: "local_state", confidence: Math.random() }),
    is_a2a_query: isA2A
  };
}

// Function to start streaming mock data to the buffer ref locally
export function startMockStream(pushToBuffer: (t: ThoughtCommitted) => void) {
  let lastTxId: string | null = null;
  
  const genInterval = setInterval(() => {
    // sometimes fork reality
    const parent = Math.random() > 0.3 ? lastTxId : null; 
    const t = generateMockThought(parent);
    lastTxId = t.tx_id;
    pushToBuffer(t);
  }, 300); // Emits every 300ms for visual density without immediately overwhelming visual tests

  return () => clearInterval(genInterval);
}
