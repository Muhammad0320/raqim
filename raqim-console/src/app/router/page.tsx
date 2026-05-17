import { TemporalClientLayout } from '../../components/TemporalRouter/TemporalClientLayout';

export default async function RouterPage() {
  let agentAliases: Record<string, string> = {};

  try {
    // Attempt to fetch from backend
    // Since this is a server component, we need an absolute URL for fetch if we are running in node
    const res = await fetch("http://localhost:8081/v1/system/agents/aliases", {
      next: { revalidate: 10 }
    });
    
    if (res.ok) {
      agentAliases = await res.json();
    } else {
      console.warn("Failed to fetch agent aliases, using fallback mock data.");
    }
  } catch (err) {
    console.warn("Backend not reachable for agent aliases, using fallback mock data.");
    // Fallback data
    agentAliases = {
      "0x1492": "FINANCE-LEDGER-01",
      "0x1493": "LOGISTICS-CORE-02",
      "0x1494": "AUTH-GATEWAY-05"
    };
  }

  return <TemporalClientLayout agentAliases={agentAliases} />;
}
