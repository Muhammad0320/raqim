'use server';

import { cookies } from 'next/headers';

export interface DashboardCardsData {
  global_transactions: number;
  active_agents: number;
  vault_capacity: number;
}

export async function getDashboardCards(): Promise<DashboardCardsData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('raqim_license')?.value;

  if (!token) {
    return null;
  }

  try {
    const res = await fetch('http://127.0.0.1:8081/v1/dashboard/cards', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      // In case the endpoint is not yet available, we could return a fallback or throw.
      console.warn(`Dashboard cards fetch failed with status: ${res.status}`);
      return null;
    }

    const data: DashboardCardsData = await res.json();
    return data;
  } catch (error) {
    console.error('Error fetching dashboard cards:', error);
    return null;
  }
}
