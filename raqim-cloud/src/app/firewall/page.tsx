import React from 'react';
import { cookies } from 'next/headers';
import FirewallClientLayout from '../../components/firewall/FirewallClientLayout';

export default async function FirewallPage() {
  const cookieStore = await cookies();
  const license = cookieStore.get('raqim_license')?.value;

  // Real implementation: Fetch from Rust daemon
  // const [metricsRes, quarantineRes] = await Promise.all([
  //   fetch('http://localhost:8080/v1/aegis/metrics', { headers: { Cookie: `raqim_license=${license}` } }),
  //   fetch('http://localhost:8080/v1/aegis/quarantine_list', { headers: { Cookie: `raqim_license=${license}` } })
  // ]);
  // const metrics = await metricsRes.json();
  // const quarantineList = await quarantineRes.json();

  // Mock data for the RSC payload
  const mockMetrics = { activeThreats: 12, quarantinedAgents: 3, uptime: '99.99%' };
  const mockQuarantineList = [
    { agent_hex: '0x1A4B9F22', reason: 'UNAUTHORIZED_CROSS_NAMESPACE', timestamp: Date.now() - 50000 },
    { agent_hex: '0x8F3C91A0', reason: 'RATE_LIMIT_EXCEEDED', timestamp: Date.now() - 120000 },
    { agent_hex: '0xDEADBEEF', reason: 'MEMORY_CORRUPTION_DETECTED', timestamp: Date.now() - 300000 },
  ];

  return <FirewallClientLayout metrics={mockMetrics} quarantineList={mockQuarantineList} />;
}
