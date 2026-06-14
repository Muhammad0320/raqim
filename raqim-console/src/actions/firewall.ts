'use server';

import { cookies } from 'next/headers';

export async function resurrectAgent(agentHex: string, systemPromptOverride: string): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get('raqim_license')?.value;

  if (!token) {
    return { success: false, error: 'Unauthorized: No license key found in cookies.' };
  }

  try {
    const res = await fetch('http://127.0.0.1:8081/v1/aegis/resurrect', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_hex: agentHex,
        system_prompt_override: systemPromptOverride,
      }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `Rust daemon error: ${text} (${res.status})` };
    }

    return { success: true };
  } catch (e: any) {
    console.error('Error in resurrectAgent server action:', e);
    return { success: false, error: e.message || 'Network error connecting to Rust daemon.' };
  }
}
