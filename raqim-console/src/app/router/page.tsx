import { fetchAgentAliases } from '../../actions/aliases';
import { TemporalClientLayout } from '../../components/TemporalRouter/TemporalClientLayout';

export default async function RouterPage() {
  const agentAliases = await fetchAgentAliases();
  return <TemporalClientLayout agentAliases={agentAliases} />;
}
