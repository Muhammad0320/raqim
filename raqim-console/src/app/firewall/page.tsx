import React from 'react';
import { fetchAegisMetrics, fetchQuarantineList } from '../../actions/firewall';
import { FirewallClientLayout } from './FirewallClientLayout';

export default async function FirewallPage() {
  const [initialMetrics, initialQuarantineList] = await Promise.all([
    fetchAegisMetrics(),
    fetchQuarantineList(),
  ]);

  return (
    <FirewallClientLayout
      initialMetrics={initialMetrics}
      initialQuarantineList={initialQuarantineList}
    />
  );
}
