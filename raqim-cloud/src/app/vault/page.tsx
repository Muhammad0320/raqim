import React from 'react';
import { cookies } from 'next/headers';
import VaultClientLayout from '../../components/vault/VaultClientLayout';

export default async function VaultPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('raqim_license')?.value;

  // Real implementation:
  // const res = await fetch('http://localhost:8080/v1/vault/telemetry', {
  //   headers: { Cookie: `raqim_license=${token}` }
  // });
  // const telemetry = await res.json();

  const mockTelemetry = {
    total_vectors: 1409204,
    index_size_mb: 3042.5,
    wal_pending_count: 124,
    densest_namespace: 'core_cognition_stream'
  };

  return <VaultClientLayout telemetry={mockTelemetry} />;
}
