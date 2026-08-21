import { fetchTopology, fetchClusterDiagnostics } from '../../actions/admin';
import { fetchAgentAliases } from '../../actions/aliases';
import { TopologyClientLayout } from '../../components/Topology/TopologyClientLayout';

export default async function TopologyPage() {
  const [topology, clusterInfo, aliases] = await Promise.all([
    fetchTopology().catch(() => []),
    fetchClusterDiagnostics().catch(() => null),
    fetchAgentAliases().catch(() => ({})),
  ]);

  return (
    <TopologyClientLayout
      initialTopology={topology}
      initialClusterInfo={clusterInfo}
      initialAliases={aliases}
    />
  );
}
