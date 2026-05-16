'use server';

import { cookies } from 'next/headers';

export async function fetchAgentAliases(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const token = cookieStore.get('raqim_license')?.value;

  if (!token) {
    return {};
  }

  try {
    const res = await fetch('http://127.0.0.1:8081/v1/system/agents/aliases', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store' // Always fetch the latest alias dictionary
    });

    if (!res.ok) {
      console.warn(`Failed to fetch aliases: ${res.status}`);
      return {};
    }

    const data: Record<string, string> = await res.json();
    return data;
  } catch (error) {
    console.error('Error fetching aliases:', error);
    return {};
  }
}
