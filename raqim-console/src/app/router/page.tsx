import { TemporalClientLayout } from '../../components/TemporalRouter/TemporalClientLayout';

export default async function RouterPage() {
  let agentAliases: Record<string, string> = {};

  try {
    const licenseKey = process.env.RAQIM_LICENSE_KEY || '';
    const res = await fetch("http://127.0.0.1:8081/v1/system/agents/aliases", {
      headers: {
        'Authorization': `Bearer ${licenseKey}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 10 }
    });
    
    if (res.ok) {
      agentAliases = await res.json();
    } else {
      console.warn("Failed to fetch agent aliases, status:", res.status);
    }
  } catch (err) {
    console.error("Backend not reachable for agent aliases, using fallback mock data.", err);
    // Fallback data
    agentAliases = {
      "0x1492": "FINANCE-LEDGER-01",
      "0x1493": "LOGISTICS-CORE-02",
      "0x1494": "AUTH-GATEWAY-05"
    };
  }

  return <TemporalClientLayout agentAliases={agentAliases} />;
}
