'use server';

import { cookies } from 'next/headers';

export interface SearchResult {
    tx_id: number;
    agent_hex: string;
    namespace: string;
    similarity_score: number;
    source: "HOT_WAL" | "LANCEDB";
    payload: string;
    timestamp: string;
}

export interface VaultTelemetry {
    total_vectors: number;
    index_size_mb: number;
    wal_pending_count: number;
    densest_namespace: string;
}

/**
 * Server Action to run the unified semantic and lexical search.
 */
export async function executeUnifiedSearch({
    query,
    namespace,
    include_wal
}: {
    query: string;
    namespace: string;
    include_wal: boolean;
}): Promise<SearchResult[]> {
    const cookieStore = await cookies();
    const token = cookieStore.get('raqim_license')?.value;

    if (!token) {
        throw new Error('Unauthorized: No raqim_license cookie present.');
    }

    const params = new URLSearchParams();
    params.append('query', query);
    if (namespace && namespace !== 'ALL') {
        params.append('namespace', namespace);
    }
    params.append('include_wal', include_wal.toString());

    try {
        const res = await fetch(`http://127.0.0.1:8081/v1/vault/search?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Unified search failed (${res.status}): ${errText}`);
        }

        const data = await res.json();
        return data as SearchResult[];
    } catch (err) {
        console.error('Error in executeUnifiedSearch server action:', err);
        throw err;
    }
}

/**
 * Fetch telemetry metrics from the Vault backend.
 */
export async function getVaultTelemetry(): Promise<VaultTelemetry> {
    const cookieStore = await cookies();
    const token = cookieStore.get('raqim_license')?.value;

    const fallback: VaultTelemetry = {
        total_vectors: 0,
        index_size_mb: 0.0,
        wal_pending_count: 0,
        densest_namespace: 'UNKNOWN (0%)',
    };

    if (!token) {
        console.warn('getVaultTelemetry: No raqim_license token found. Returning fallback.');
        return fallback;
    }

    try {
        const res = await fetch('http://127.0.0.1:8081/v1/vault/telemetry', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!res.ok) {
            console.warn(`getVaultTelemetry failed with status: ${res.status}`);
            return fallback;
        }

        const data = await res.json();
        return data as VaultTelemetry;
    } catch (err) {
        console.error('Error fetching vault telemetry:', err);
        return fallback;
    }
}
