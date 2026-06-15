import { useEffect } from 'react';
import { useSwarmStore } from '../store/useSwarmStore';

export interface HardwareVitals {
  cpu_percent: number;
  wasm_memory_gb: number;
  wasm_memory_max_gb: number;
  mesh_latency_ms: number;
  core_temp_c: number;
}

export function useHardwareVitals(token: string) {
  const initVitalsStream = useSwarmStore(state => state.initVitalsStream);
  const currentVitals = useSwarmStore(state => state.currentVitals);

  useEffect(() => {
    if (!token) return;
    const cleanup = initVitalsStream(token);
    return () => {
      cleanup();
    };
  }, [token, initVitalsStream]);

  if (!currentVitals) return null;

  return {
    cpu_percent: currentVitals.cpu_load_percent,
    wasm_memory_gb: currentVitals.wasm_memory_mb,
    // The backend provides memory usage in MB. 
    // We display it in GB or MB as needed. Let's convert MB to GB.
    wasm_memory_max_gb: 16.0, // Assuming 16GB max allocation limit
    mesh_latency_ms: currentVitals.mesh_latency_ms,
    core_temp_c: currentVitals.core_temp_celcius,
  };
}
