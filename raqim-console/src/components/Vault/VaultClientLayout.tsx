'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MainLayout } from '../Layout/MainLayout';
import { VaultTelemetryRibbon } from './VaultTelemetryRibbon';
import { UnifiedSearchWorkbench } from './UnifiedSearchWorkbench';
import { MerkleProofInspector } from './MerkleProofInspector';
import { VaultTelemetry, VaultSearchResult, ClusterShard } from '../../lib/api';
import { fetchVaultTelemetry, fetchVaultSearchResults } from '../../actions/vault';
import { fetchTopology } from '../../actions/admin';
import { useSwarmStore } from '../../lib/store/useSwarmStore';
import { useSwarmStream } from '../../lib/hooks/useSwarmStream';
import { useSearchParams, useRouter } from 'next/navigation';

interface VaultClientLayoutProps {
  initialTelemetry: VaultTelemetry | null;
  initialResults: VaultSearchResult[];
  initialTxId: string | null;
  initialTopology: ClusterShard[];
}

export function VaultClientLayout({
  initialTelemetry,
  initialResults,
  initialTxId,
  initialTopology,
}: VaultClientLayoutProps) {
  useSwarmStream();

  const router = useRouter();
  const searchParams = useSearchParams();
  const queryTxId = searchParams.get('tx_id') || initialTxId;

  const [telemetry, setTelemetry] = useState<VaultTelemetry | null>(initialTelemetry);
  const [results, setResults] = useState<VaultSearchResult[]>(initialResults);
  const [selectedTxIdHex, setSelectedTxIdHex] = useState<string | null>(queryTxId);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [shards, setShards] = useState<ClusterShard[]>(initialTopology);

  const setStoreTelemetry = useSwarmStore((state) => state.setVaultTelemetry);

  useEffect(() => {
    if (initialTelemetry) setStoreTelemetry(initialTelemetry);
  }, [initialTelemetry, setStoreTelemetry]);

  // Sync telemetry every 5 seconds
  useEffect(() => {
    const syncData = async () => {
      try {
        const [tel, top] = await Promise.all([
          fetchVaultTelemetry(),
          fetchTopology(),
        ]);
        if (tel) {
          setTelemetry(tel);
          setStoreTelemetry(tel);
        }
        if (top) {
          setShards(top);
        }
      } catch (_e) {
        // Quiet poll error
      }
    };

    const interval = setInterval(syncData, 5000);
    return () => clearInterval(interval);
  }, [setStoreTelemetry]);

  // Extract distinct namespaces from shards
  const namespaces = useMemo(() => {
    const list = shards.map((s) => s.namespace);
    return Array.from(new Set(list));
  }, [shards]);

  const handleSearch = async (query: string, namespace: string, includeWal: boolean) => {
    setIsLoadingSearch(true);
    try {
      const searchRes = await fetchVaultSearchResults(query, namespace, includeWal);
      setResults(searchRes || []);
    } catch (_err) {
      setResults([]);
    } finally {
      setIsLoadingSearch(false);
    }
  };

  const handleSelectTxId = (txIdHex: string) => {
    setSelectedTxIdHex(txIdHex);
    // Update URL query parameter without full page reload
    router.replace(`/vault?tx_id=${encodeURIComponent(txIdHex)}`, { scroll: false });
  };

  return (
    <MainLayout title="Forensic Audit Vault // Cryptographic Verifier">
      <div className="flex flex-col h-full w-full bg-[#080C14] overflow-hidden p-3 gap-3">
        {/* 1. Vault Telemetry Ribbon */}
        <VaultTelemetryRibbon telemetry={telemetry} />

        {/* 2. 2-Column Tactical Workspace */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">
          {/* Left Column: Unified Search Workbench (55% width) */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col min-h-0 h-full overflow-hidden">
            <UnifiedSearchWorkbench
              results={results}
              onSearch={handleSearch}
              onSelectTxId={handleSelectTxId}
              selectedTxIdHex={selectedTxIdHex}
              isLoading={isLoadingSearch}
              namespaces={namespaces}
            />
          </div>

          {/* Right Column: Merkle Proof Inspector (45% width) */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col min-h-0 h-full overflow-hidden">
            <MerkleProofInspector
              initialTxIdHex={selectedTxIdHex}
              onTxIdChange={handleSelectTxId}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
