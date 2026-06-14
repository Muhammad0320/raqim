import React from 'react';
import { cookies } from 'next/headers';
import { FirewallClientLayout } from './FirewallClientLayout';

export default async function FirewallPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('raqim_license')?.value || '';

  let initialMetrics = null;
  let initialQuarantineList = [];

  if (token) {
    try {
      // 1. Fetch initial Aegis metrics
      const metricsRes = await fetch('http://127.0.0.1:8081/v1/aegis/metrics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (metricsRes.ok) {
        initialMetrics = await metricsRes.json();
      } else {
        console.warn(`Failed to fetch Aegis metrics: ${metricsRes.status}`);
      }
    } catch (e) {
      console.error('Error fetching initial Aegis metrics:', e);
    }

    try {
      // 2. Fetch initial Aegis quarantine list
      const quarantineRes = await fetch('http://127.0.0.1:8081/v1/aegis/quarantine_list', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (quarantineRes.ok) {
        initialQuarantineList = await quarantineRes.json();
      } else {
        console.warn(`Failed to fetch Aegis quarantine list: ${quarantineRes.status}`);
      }
    } catch (e) {
      console.error('Error fetching initial Aegis quarantine list:', e);
    }
  }

  return (
    <FirewallClientLayout
      initialMetrics={initialMetrics}
      initialQuarantineList={initialQuarantineList}
      token={token}
    />
  );
}
