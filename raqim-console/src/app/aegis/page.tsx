import { fetchAegisMetrics, fetchQuarantineList } from '../../actions/firewall';
import { AegisClientLayout } from '../../components/Aegis/AegisClientLayout';

export default async function AegisPage() {
  const [metrics, quarantineList] = await Promise.all([
    fetchAegisMetrics().catch(() => null),
    fetchQuarantineList().catch(() => []),
  ]);

  return (
    <AegisClientLayout
      initialMetrics={metrics}
      initialQuarantineList={quarantineList}
    />
  );
}
