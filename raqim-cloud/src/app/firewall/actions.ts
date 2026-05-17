'use server';

import { cookies } from 'next/headers';

export async function resurrectAgent(formData: FormData) {
  const agent_hex = formData.get('agent_hex') as string;
  const system_prompt_override = formData.get('system_prompt_override') as string;

  const cookieStore = await cookies();
  const license = cookieStore.get('raqim_license')?.value;

  try {
    // Simulated fetch to Rust daemon endpoint /v1/aegis/resurrect
    // const res = await fetch('http://localhost:8080/v1/aegis/resurrect', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Cookie': `raqim_license=${license}`
    //   },
    //   body: JSON.stringify({ agent_hex, system_prompt_override })
    // });
    
    // if (!res.ok) throw new Error('Resurrection failed');
    
    // Artificial delay to simulate WASM reboot
    await new Promise(resolve => setTimeout(resolve, 1500));

    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
