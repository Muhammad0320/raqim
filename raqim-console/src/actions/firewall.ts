'use server';

import {
  liftAegisQuarantine,
  getAegisMetrics,
  getAegisQuarantineList,
} from '../lib/api';

import type { AegisMetricsData, QuarantineRecord } from '../lib/api';

export async function resurrectAgent(
  agentHex: string,
  systemPromptOverride: string
): Promise<{ success: boolean; error?: string }> {
  const res = await liftAegisQuarantine({
    agent_hex: agentHex,
    system_prompt_override: systemPromptOverride,
  });

  if (res.success) {
    return { success: true };
  }
  return { success: false, error: res.error || 'Failed to lift quarantine' };
}

export async function fetchAegisMetrics(): Promise<AegisMetricsData | null> {
  const res = await getAegisMetrics();
  if (res.success && res.data) {
    return res.data;
  }
  return null;
}

export async function fetchQuarantineList(): Promise<QuarantineRecord[]> {
  const res = await getAegisQuarantineList();
  if (res.success && res.data) {
    return res.data;
  }
  return [];
}
