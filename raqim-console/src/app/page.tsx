import { fetchDashboardCards } from '../actions/admin';
import { DashboardClient } from './DashboardClient';

export default async function DashboardPage() {
  const cardsData = await fetchDashboardCards();
  return <DashboardClient initialCards={cardsData} />;
}
