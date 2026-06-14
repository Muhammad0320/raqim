import { MainLayout } from '@/components/Layout/MainLayout';
import { getVaultTelemetry } from '@/actions/vault';
import { fetchAgentAliases } from '@/actions/aliases';
import { VaultClientLayout } from '@/components/Vault/VaultClientLayout';

export default async function VaultPage() {
    // Fetch initial telemetry and agent aliases server-side
    const telemetry = await getVaultTelemetry();
    const aliases = await fetchAgentAliases();

    return (
        <MainLayout title="Audit Vault">
            <VaultClientLayout telemetry={telemetry} initialAliases={aliases} />
        </MainLayout>
    );
}
