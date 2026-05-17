import React from 'react';
import TemporalClientLayout from '../../components/TemporalClientLayout';

export const metadata = {
  title: 'Temporal Router | Raqim OS',
};

async function getAgentAliases() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const res = await fetch(`${backendUrl}/v1/system/agents/aliases`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error('Failed to fetch aliases');
    }
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch agent aliases:', err);
    // Return mock data for UI testing if backend is down
    return {
      'CORE_ROUTER': '0x7F4C9B2',
      'VAULT_KEEPER': '0x1A2B3C4',
      'NAMESPACE_MGR': '0x9E8D7C6'
    };
  }
}

export default async function TemporalRouterPage() {
  const aliases = await getAgentAliases();
  
  return (
    <TemporalClientLayout agentAliases={aliases} />
  );
}
