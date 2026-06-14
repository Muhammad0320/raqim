import { useState, useEffect } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';

export interface HardwareVitals {
  cpu_percent: number;
  wasm_memory_gb: number;
  wasm_memory_max_gb: number;
  mesh_latency_ms: number;
  core_temp_c: number;
}

export function useHardwareVitals(token: string) {
  const [vitals, setVitals] = useState<HardwareVitals | null>(null);

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    fetchEventSource('http://127.0.0.1:8081/v1/system/health/live', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream',
      },
      signal: controller.signal,
      async onopen(res) {
        if (res.ok && res.headers.get('content-type') === 'text/event-stream') {
          console.log("Connected to Hardware Vitals SSE");
          return;
        } else if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          throw new Error(`Client side error ${res.status}`);
        }
      },
      onmessage(event) {
        try {
          const data: HardwareVitals = JSON.parse(event.data);
          setVitals(data);
        } catch (e) {
          console.error('Failed to parse Hardware Vitals frame', e);
        }
      },
      onclose() {
        console.log("Hardware Vitals SSE Connection closed by server");
      },
      onerror(err) {
        console.error("Hardware Vitals SSE Error", err);
        throw err;
      }
    });

    return () => {
      controller.abort();
    };
  }, [token]);

  return vitals;
}
