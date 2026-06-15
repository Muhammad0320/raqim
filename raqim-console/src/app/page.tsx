import { cookies } from 'next/headers';
import { fetchDashboardCards } from '../actions/admin';
import { DashboardClient } from './DashboardClient';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('raqim_license')?.value || '';
  
  // Server-side data fetching for the Top Cards using the centralized admin action
  const cardsData = await fetchDashboardCards();
  
  return <DashboardClient initialCards={cardsData} token={token} />;
}
