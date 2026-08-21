'use client';

import { useEffect } from 'react';
import { useSwarmStore } from '../store/useSwarmStore';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { getHealthLiveStreamUrl } from '../api';

export interface HardwareVitals {
  cpu_percent: number;
  wasm_memory_gb: number;
  wasm_memory_max_gb: number;
  mesh_latency_ms: number;
  core_temp_c: number;
}

export function useHardwareVitals() {
  const recordHealthVitals = useSwarmStore((state) => state.recordHealthVitals);
  const currentVitals = useSwarmStore((state) => state.currentVitals);
  const setDaemonOnline = useSwarmStore((state) => state.setDaemonOnline);

  useEffect(() => {
    const controller = new AbortController();
    const sseUrl = getHealthLiveStreamUrl();

    fetchEventSource(sseUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
      },
      signal: controller.signal,
      async onopen(res) {
        if (res.ok && res.headers.get('content-type')?.includes('text/event-stream')) {
          setDaemonOnline(true, null);
          return;
        }
      },
      onmessage(event) {
        try {
          const rawData = JSON.parse(event.data);
          recordHealthVitals({
            cpu_load_percent: rawData.cpu_load_percent ?? 0,
            wasm_memory_mb: rawData.wasm_memory_mb ?? 0,
            core_temp_celcius: rawData.core_temp_celcius ?? 0,
            mesh_latency_ms: rawData.mesh_latency_ms ?? 0,
          });
        } catch (e) {
          console.error('Failed to parse health frame', e);
        }
      },
      onerror() {
        // SSE retry
      },
    }).catch(() => {});

    return () => {
      controller.abort();
    };
  }, [recordHealthVitals, setDaemonOnline]);

  if (!currentVitals) return null;

  return {
    cpu_percent: currentVitals.cpu_load_percent,
    wasm_memory_gb: currentVitals.wasm_memory_mb,
    wasm_memory_max_gb: 16.0,
    mesh_latency_ms: currentVitals.mesh_latency_ms,
    core_temp_c: currentVitals.core_temp_celcius,
  };
}
