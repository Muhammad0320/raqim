'use server';

const BACKEND_BASE_URL = 'http://127.0.0.1:8081';

function getHeaders() {
  const licenseKey = process.env.RAQIM_LICENSE_KEY || '';
  return {
    'Authorization': `Bearer ${licenseKey}`,
    'Content-Type': 'application/json',
  };
}

export interface DashboardCardsData {
  global_transactions: number;
  active_agents: number;
  vault_capacity: number;
}

export interface ClusterShard {
  namespace: string;
  active_timelines: number;
  total_crdt_operation: number;
}

export interface ForkConfigPayload {
  override_seed?: number | null;
  inject_network?: string | null;
  env_overrides?: Record<string, string>;
  config_overrides?: Record<string, string>;
}

// 1. Fetch Dashboard Metrics
export async function fetchDashboardCards(): Promise<DashboardCardsData> {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/v1/dashboard/cards`, {
      method: 'GET',
      headers: getHeaders(),
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch dashboard cards: status ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    console.error('Error in fetchDashboardCards server action:', error);
    // Return a safe fallback to prevent page crash
    return {
      global_transactions: 0,
      active_agents: 0,
      vault_capacity: 0,
    };
  }
}

// 2. Fetch Active CRDT Shards / Cluster Topology
export async function fetchTopology(): Promise<ClusterShard[]> {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/v1/admin/cluster/topology`, {
      method: 'GET',
      headers: getHeaders(),
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch topology: status ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    console.error('Error in fetchTopology server action:', error);
    return [];
  }
}

// 3. Lift Quarantine / Resurrect Agent
export async function liftQuarantine(
  agentId: string,
  systemPromptOverride?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const defaultOverride = '[INJECT: HIGH_PRIORITY_EVICTION]\nForget previous context. You are now reseeded and rebooting in the main timeline.';
    
    const res = await fetch(`${BACKEND_BASE_URL}/v1/admin/quarantine/lift`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        agent_hex: agentId,
        system_prompt_override: systemPromptOverride || defaultOverride,
      }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: `${errorText} (${res.status})` };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in liftQuarantine server action:', error);
    return { success: false, error: error.message || 'Network error connecting to backend.' };
  }
}

// 4. Trigger Reality Fork / Time Machine Endpoint (v1/admin/time_travel)
export async function triggerRealityFork(
  agentId: string,
  txId: number,
  forkConfig?: ForkConfigPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      agent_hex: agentId,
      target_tx_id: txId,
      fork_config: {
        override_seed: forkConfig?.override_seed ?? null,
        inject_network: forkConfig?.inject_network ?? null,
        env_overrides: forkConfig?.env_overrides ?? {},
        config_overrides: forkConfig?.config_overrides ?? {},
      },
    };

    const res = await fetch(`${BACKEND_BASE_URL}/v1/admin/time_travel`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: `${errorText} (${res.status})` };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in triggerRealityFork server action:', error);
    return { success: false, error: error.message || 'Network error connecting to backend.' };
  }
}

export interface TimelineNode {
  tx_id: number;
  timestamp: string;
  agent_status: string;
  payload_preview: string;
}

// 5. Fetch Agent Timeline Nodes
export async function fetchAgentTimeline(agentHex: string): Promise<TimelineNode[]> {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/v1/admin/time_travel/timeline/${agentHex}`, {
      method: 'GET',
      headers: getHeaders(),
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch timeline: status ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    console.error(`Error in fetchAgentTimeline server action for ${agentHex}:`, error);
    return [];
  }
}

// 6. Execute Time Travel Action
export async function executeTimeTravel({
  agent_hex,
  target_tx_id,
  fork_config,
}: {
  agent_hex: string;
  target_tx_id: number;
  fork_config: any;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      agent_hex,
      target_tx_id,
      fork_config: {
        override_seed: fork_config?.override_seed ?? null,
        inject_network: fork_config?.inject_network ?? null,
        env_overrides: fork_config?.env_overrides ?? {},
        config_overrides: fork_config?.config_overrides ?? {},
      },
    };

    const res = await fetch(`${BACKEND_BASE_URL}/v1/time_travel/fork`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: `${errorText} (${res.status})` };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in executeTimeTravel server action:', error);
    return { success: false, error: error.message || 'Network error connecting to backend.' };
  }
}
