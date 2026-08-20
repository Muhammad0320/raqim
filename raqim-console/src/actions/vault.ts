'use server';

import {
  searchVault,
  getVaultTelemetry as getCanonicalVaultTelemetry,
} from '../lib/api';

import type { VaultSearchResult, VaultTelemetry } from '../lib/api';

/**
 * Server Action to run the unified semantic and lexical search.
 */
export async function executeUnifiedSearch({
  query,
  namespace,
  include_wal,
}: {
  query: string;
  namespace: string;
  include_wal: boolean;
}): Promise<VaultSearchResult[]> {
  const res = await searchVault({
    query,
    namespace,
    include_wal,
  });

  if (res.success && res.data) {
    return res.data;
  }
  return [];
}

/**
 * Server Action to fetch Vault Index Vitals & Telemetry.
 */
export async function getVaultTelemetry(): Promise<VaultTelemetry> {
  const res = await getCanonicalVaultTelemetry();
  if (res.success && res.data) {
    return res.data;
  }
  return {
    total_vectors: 0,
    index_size_mb: 0,
    wal_pending_count: 0,
    densest_namespace: 'UNKNOWN (0%)',
  };
}
