'use server';

import { getAgentAliases } from '../lib/api';

export async function fetchAgentAliases(): Promise<Record<string, string>> {
  const res = await getAgentAliases();
  if (res.success && res.data) {
    return res.data;
  }
  return {};
}
