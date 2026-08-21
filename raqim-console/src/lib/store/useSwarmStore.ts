import { create } from 'zustand';
import { Node, Edge } from '@xyflow/react';
import {
  getClusterTopology,
  getAgentAliases,
  ClusterShard,
  QuarantineRecord,
  SystemHealthPayload,
  ClusterInfoData,
  VaultTelemetry,
  DashboardCardsData,
} from '../api';

export type { ClusterShard, QuarantineRecord, ClusterInfoData, VaultTelemetry, DashboardCardsData };

export interface AegisRecord {
  agent_hex: string;
  violation_type: 'CRYPTO_SPOOF' | 'NAMESPACE_BREACH' | 'RAG_POISONING' | string;
  attempted_path: string;
  payload_preview: string;
  timestamp: number;
}

export type UiEvent =
  | {
      event_type: 'ThoughtCommitted';
      agent_hex: string;
      intent_path: string;
      tx_id: number;
      tx_id_hex?: string;
      text: string;
    }
  | {
      event_type: 'A2aMessageRouted';
      source_hex: string;
      target_hex: string;
      namespace: string;
      question_payload: string;
      answer_payload: string;
      latency_ms: number;
    }
  | {
      event_type: 'AegisAlert';
      record: AegisRecord;
    }
  | {
      event_type: 'RealityForked';
      agent_id: string;
      original_namespace: string;
      phantom_namespace: string;
      step_ordinal: number;
      tx_id: string;
    };

export interface UiThought {
  agent_hex: string;
  intent_path: string;
  text: string;
  tx_id: number;
  tx_id_hex?: string;
  status: 'IDLE' | 'REASONING' | 'TOOL_EXEC' | 'HALTED' | 'COMMITTED' | 'PENDING' | 'FORKED' | 'REJECTED';
  is_a2a_query: boolean;
  parent_tx_id: number | null;
  timestamp?: number;
}

export interface SystemHealth {
  cpu_load_percent: number;
  wasm_memory_mb: number;
  core_temp_celcius: number;
  mesh_latency_ms: number;
  time: number;
}

export const formatTxIdHex = (txId: number | string): string => {
  if (typeof txId === 'string') {
    if (txId.startsWith('0x')) return txId;
    return '0x' + txId;
  }
  return '0x' + txId.toString(16).padStart(32, '0');
};

export interface SwarmState {
  // Connection State
  daemonOnline: boolean;
  daemonError: string | null;
  setDaemonOnline: (online: boolean, error?: string | null) => void;

  // Stream & Thought Pipeline
  thoughts: Record<number, UiThought>;
  thoughtOrder: number[];
  activeTxId: number | null;
  latestTxIdHex: string | null;
  tpsHistory: { time: number; tps: number }[];
  currentTps: number;
  agentLastSeen: Record<string, number>;
  thoughtsThisSecond: number;
  highestTxId: number;

  // Static / Polled Cluster Telemetry
  clusterInfo: ClusterInfoData | null;
  vaultTelemetry: VaultTelemetry | null;
  dashboardCards: DashboardCardsData | null;
  setClusterInfo: (info: ClusterInfoData | null) => void;
  setVaultTelemetry: (tel: VaultTelemetry | null) => void;
  setDashboardCards: (cards: DashboardCardsData | null) => void;

  // Topology State
  topologyNodes: Node[];
  topologyEdges: Edge[];
  namespaces: string[];
  activeTopology: ClusterShard[];
  agentAliases: Record<string, string>;

  // Firewall / Aegis State
  aegisAlerts: AegisRecord[];
  quarantinedAgents: string[];

  // Temporal Router / Stream State
  isPaused: boolean;
  isForking: boolean;

  // System Health Vitals
  vitalsHistory: SystemHealth[];
  currentVitals: SystemHealth | null;

  // Actions
  recordHealthVitals: (payload: SystemHealthPayload) => void;
  fetchInitialTopology: () => Promise<void>;
  batchAddThoughts: (thoughts: UiThought[]) => void;
  processUiEvents: (events: UiEvent[]) => void;
  pruneEphemeralEdges: () => void;
  tickRollingMetrics: () => void;
  setActiveTxId: (tx_id: number | null) => void;
  setLatestTxIdHex: (hex: string | null) => void;
  liftQuarantine: (agent_hex: string) => void;
  setIsPaused: (paused: boolean) => void;
  togglePause: () => void;
  setIsForking: (forking: boolean) => void;
  setActiveTopology: (topology: ClusterShard[]) => void;
  setQuarantinedAgents: (agents: string[]) => void;
  setAgentAliases: (aliases: Record<string, string>) => void;
  clearStream: () => void;
  clear: () => void;
}

export const useSwarmStore = create<SwarmState>((set, get) => ({
  daemonOnline: false,
  daemonError: null,
  setDaemonOnline: (online, error = null) =>
    set({ daemonOnline: online, daemonError: error }),

  thoughts: {},
  thoughtOrder: [],
  activeTxId: null,
  latestTxIdHex: null,
  tpsHistory: Array(60)
    .fill(0)
    .map((_, i) => ({ time: Date.now() - (60 - i) * 1000, tps: 0 })),
  currentTps: 0,
  agentLastSeen: {},
  thoughtsThisSecond: 0,
  highestTxId: 0,

  clusterInfo: null,
  vaultTelemetry: null,
  dashboardCards: null,
  setClusterInfo: (info) => set({ clusterInfo: info }),
  setVaultTelemetry: (tel) => set({ vaultTelemetry: tel }),
  setDashboardCards: (cards) => set({ dashboardCards: cards }),

  topologyNodes: [],
  topologyEdges: [],
  namespaces: [],
  activeTopology: [],
  agentAliases: {},

  aegisAlerts: [],
  quarantinedAgents: [],

  isPaused: false,
  isForking: false,

  vitalsHistory: [],
  currentVitals: null,

  recordHealthVitals: (payload) =>
    set((state) => {
      const now = Date.now();
      const newVitals: SystemHealth = {
        cpu_load_percent: payload.cpu_load_percent,
        wasm_memory_mb: payload.wasm_memory_mb,
        core_temp_celcius: payload.core_temp_celcius,
        mesh_latency_ms: payload.mesh_latency_ms,
        time: now,
      };

      const newHistory = [...state.vitalsHistory, newVitals];
      if (newHistory.length > 60) {
        newHistory.shift();
      }

      return {
        daemonOnline: true,
        daemonError: null,
        currentVitals: newVitals,
        vitalsHistory: newHistory,
      };
    }),

  fetchInitialTopology: async () => {
    try {
      const [topRes, aliasRes] = await Promise.all([
        getClusterTopology(),
        getAgentAliases(),
      ]);

      if (topRes.success && topRes.data) {
        const shards = topRes.data;
        const aliases = aliasRes.success && aliasRes.data ? aliasRes.data : {};

        set((state) => {
          const newNamespaces = new Set(state.namespaces);
          const newNodes: Node[] = [];

          shards.forEach((shard, index) => {
            const ns = shard.namespace;
            newNamespaces.add(ns);
            const radius = 450;
            const angle = index * (Math.PI / 3);

            newNodes.push({
              id: `cluster-${ns}`,
              type: 'cluster',
              position: {
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
              },
              data: {
                label: ns,
                active_timelines: shard.active_timelines,
                total_crdt_operation: shard.total_crdt_operation,
              },
              style: {
                width: 350,
                height: 300,
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px dashed rgba(255,255,255,0.1)',
                borderRadius: '16px',
              },
            });
          });

          return {
            daemonOnline: true,
            daemonError: null,
            activeTopology: shards,
            agentAliases: aliases,
            topologyNodes: newNodes,
            namespaces: Array.from(newNamespaces),
          };
        });
      } else {
        set({
          daemonOnline: false,
          daemonError: topRes.error || 'DAEMON_UNREACHABLE',
        });
      }
    } catch (_err) {
      set({ daemonOnline: false, daemonError: 'DAEMON_UNREACHABLE' });
    }
  },

  batchAddThoughts: (newThoughts) =>
    set((state) => {
      const updatedThoughts = { ...state.thoughts };
      const newOrder = [...state.thoughtOrder];
      let newThoughtsThisSecond = state.thoughtsThisSecond;
      const newAgentLastSeen = { ...state.agentLastSeen };
      let maxTx = state.highestTxId;
      let lastHex = state.latestTxIdHex;
      const now = Date.now();

      for (const t of newThoughts) {
        if (!updatedThoughts[t.tx_id]) {
          updatedThoughts[t.tx_id] = t;
          newOrder.push(t.tx_id);
          newThoughtsThisSecond++;
          newAgentLastSeen[t.agent_hex] = now;
          if (t.tx_id > maxTx) {
            maxTx = t.tx_id;
            lastHex = t.tx_id_hex || formatTxIdHex(t.tx_id);
          }
        }
      }

      if (newOrder.length > 2000) {
        const excess = newOrder.length - 2000;
        const removed = newOrder.splice(0, excess);
        for (const id of removed) {
          delete updatedThoughts[id];
        }
      }

      return {
        daemonOnline: true,
        daemonError: null,
        thoughts: updatedThoughts,
        thoughtOrder: newOrder,
        thoughtsThisSecond: newThoughtsThisSecond,
        agentLastSeen: newAgentLastSeen,
        highestTxId: maxTx,
        latestTxIdHex: lastHex,
      };
    }),

  processUiEvents: (events) =>
    set((state) => {
      const newNodes = [...state.topologyNodes];
      const newEdges = [...state.topologyEdges];
      const newNamespaces = new Set(state.namespaces);
      const newAlerts = [...state.aegisAlerts];
      const newQuarantined = new Set(state.quarantinedAgents);
      const now = Date.now();

      const ensureNamespaceNode = (ns: string) => {
        if (!newNamespaces.has(ns)) {
          newNamespaces.add(ns);
          const index = newNamespaces.size - 1;
          const radius = 450;
          const angle = index * (Math.PI / 3);
          newNodes.push({
            id: `cluster-${ns}`,
            type: 'cluster',
            position: {
              x: Math.cos(angle) * radius,
              y: Math.sin(angle) * radius,
            },
            data: { label: ns },
            style: {
              width: 350,
              height: 300,
              backgroundColor: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(255,255,255,0.1)',
              borderRadius: '16px',
            },
          });
        }
      };

      for (const ev of events) {
        if (ev.event_type === 'ThoughtCommitted') {
          ensureNamespaceNode(ev.intent_path);

          const agentNodeId = `agent-${ev.agent_hex}`;
          const existingNodeIndex = newNodes.findIndex(
            (n) => n.id === agentNodeId
          );

          if (existingNodeIndex >= 0) {
            newNodes[existingNodeIndex] = {
              ...newNodes[existingNodeIndex],
              data: {
                ...newNodes[existingNodeIndex].data,
                pulseTimestamp: now,
                lastTx: ev.tx_id,
                lastText: ev.text,
              },
            };
          } else {
            const siblingsCount = newNodes.filter(
              (n) => n.parentId === `cluster-${ev.intent_path}`
            ).length;
            const col = siblingsCount % 3;
            const row = Math.floor(siblingsCount / 3);

            newNodes.push({
              id: agentNodeId,
              type: 'agent',
              parentId: `cluster-${ev.intent_path}`,
              extent: 'parent',
              position: { x: 40 + col * 100, y: 70 + row * 100 },
              data: {
                agent_hex: ev.agent_hex,
                intent_path: ev.intent_path,
                pulseTimestamp: now,
                lastTx: ev.tx_id,
                lastText: ev.text,
              },
            });
          }
        } else if (ev.event_type === 'A2aMessageRouted') {
          if (newNodes.some((n) => n.id === `agent-${ev.target_hex}`)) {
            newEdges.push({
              id: `edge-${now}-${Math.random()}`,
              source: `agent-${ev.source_hex}`,
              target: `agent-${ev.target_hex}`,
              type: 'a2a',
              data: {
                timestamp: now,
                latency: ev.latency_ms,
                question_payload: ev.question_payload,
              },
              animated: true,
            });
          }
        } else if (ev.event_type === 'AegisAlert') {
          newAlerts.push(ev.record);
          newQuarantined.add(ev.record.agent_hex);
        }
      }

      return {
        daemonOnline: true,
        daemonError: null,
        topologyNodes: newNodes,
        topologyEdges: newEdges,
        namespaces: Array.from(newNamespaces),
        aegisAlerts: newAlerts.slice(-200),
        quarantinedAgents: Array.from(newQuarantined),
      };
    }),

  pruneEphemeralEdges: () =>
    set((state) => {
      const now = Date.now();
      const activeEdges = state.topologyEdges.filter((e) => {
        const timestamp = (e.data as any)?.timestamp || 0;
        return now - timestamp < 2000;
      });

      let nodesChanged = false;
      const updatedNodes = state.topologyNodes.map((n) => {
        const data = n.data as any;
        if (
          n.type === 'agent' &&
          data?.pulseTimestamp &&
          now - data.pulseTimestamp > 3000
        ) {
          nodesChanged = true;
          return { ...n, data: { ...data, pulseTimestamp: null } };
        }
        return n;
      });

      if (activeEdges.length !== state.topologyEdges.length || nodesChanged) {
        return { topologyEdges: activeEdges, topologyNodes: updatedNodes };
      }
      return {};
    }),

  tickRollingMetrics: () =>
    set((state) => {
      const now = Date.now();
      const currentTps = state.thoughtsThisSecond;

      const newHistory = [...state.tpsHistory, { time: now, tps: currentTps }];
      if (newHistory.length > 60) {
        newHistory.shift();
      }

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
        ...(agentsChanged ? { agentLastSeen: newAgentLastSeen } : {}),
      };
    }),

  setActiveTxId: (tx_id) => set({ activeTxId: tx_id }),
  setLatestTxIdHex: (hex) => set({ latestTxIdHex: hex }),
  liftQuarantine: (agent_hex) =>
    set((state) => ({
      quarantinedAgents: state.quarantinedAgents.filter((a) => a !== agent_hex),
    })),
  setIsPaused: (paused) => set({ isPaused: paused }),
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  setIsForking: (forking) => set({ isForking: forking }),
  setActiveTopology: (topology) => set({ activeTopology: topology }),
  setQuarantinedAgents: (agents) => set({ quarantinedAgents: agents }),
  setAgentAliases: (aliases) => set({ agentAliases: aliases }),

  clearStream: () =>
    set({
      thoughts: {},
      thoughtOrder: [],
    }),

  clear: () =>
    set({
      thoughts: {},
      thoughtOrder: [],
      activeTxId: null,
      latestTxIdHex: null,
      thoughtsThisSecond: 0,
      agentLastSeen: {},
      tpsHistory: Array(60)
        .fill(0)
        .map((_, i) => ({ time: Date.now() - (60 - i) * 1000, tps: 0 })),
      topologyNodes: [],
      topologyEdges: [],
      namespaces: [],
      activeTopology: [],
    }),
}));
