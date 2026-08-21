import { fetchDashboardCards, fetchClusterDiagnostics } from '../actions/admin';
import { getVaultTelemetry } from '../actions/vault';
import { fetchAgentAliases } from '../actions/aliases';
import { CommandDeckClient } from '../components/CommandDeck/CommandDeckClient';

export default async function CommandFlightDeckPage() {
  const [cards, vaultTelemetry, clusterInfo, aliases] = await Promise.all([
    fetchDashboardCards().catch(() => null),
    getVaultTelemetry().catch(() => null),
    fetchClusterDiagnostics().catch(() => null),
    fetchAgentAliases().catch(() => ({})),
  ]);

  return (
    <CommandDeckClient
      initialCards={cards}
      initialVaultTelemetry={vaultTelemetry}
      initialClusterInfo={clusterInfo}
      initialAliases={aliases}
    />
  );
}
