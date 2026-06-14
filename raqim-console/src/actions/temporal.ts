"use server";

export async function executeTimeTravel({ agent_hex, target_tx_id, fork_config }: { agent_hex: string, target_tx_id: number, fork_config: any }) {
  console.log(`Executing time travel for ${agent_hex} at tx ${target_tx_id}`, fork_config);
  
  // Hit the backend
  try {
    const res = await fetch("http://localhost:8081/v1/admin/time_travel/fork", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        agent_hex,
        target_tx_id,
        fork_config
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Time travel fork failed: ${err}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Time travel action error:", err);
    throw err;
  }
}
