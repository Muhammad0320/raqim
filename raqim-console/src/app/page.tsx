import { cookies } from 'next/headers';
import { getDashboardCards } from '../actions/dashboard';
import { DashboardClient } from './DashboardClient';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('raqim_license')?.value || '';
  
  // Server-side data fetching for the Top Cards
  const cardsData = await getDashboardCards();
  
  return <DashboardClient initialCards={cardsData} token={token} />;
}
