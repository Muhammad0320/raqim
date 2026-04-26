import { useEffect, useRef } from 'react';
import { useSwarmStore, ThoughtCommitted } from '../store/useSwarmStore';
import { startMockStream } from '../mockGenerator';

const SSE_URL = 'http://127.0.0.1:8081/v1/swarm/live';

export function useSwarmStream() {
  const { batchAddThoughts } = useSwarmStore();
  const bufferRef = useRef<ThoughtCommitted[]>([]);
  // Use mock for now since Rust instance lacks actual events
  const isMock = true;

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let flushInterval: NodeJS.Timeout;

    // We buffer arriving DAG components to avoid thrashing React with thousands of 
    // re-renders per second, flushing to Zustand uniformly.
    const flushBuffer = () => {
      if (bufferRef.current.length > 0) {
        batchAddThoughts([...bufferRef.current]);
        bufferRef.current = []; // Clear local buffer
      }
    };

    // Attempt real connection if not mocked
    if (!isMock) {
      try {
        eventSource = new EventSource(SSE_URL);
        
        eventSource.onmessage = (event) => {
          try {
            const data: ThoughtCommitted = JSON.parse(event.data);
            bufferRef.current.push(data);
          } catch (e) {
            console.error('Failed to parse SSE swarm frame', e);
          }
        };

        eventSource.onerror = (err) => {
          console.error('Swarm SSE Error. Is the Rust Daemon running?', err);
          eventSource?.close();
        };
      } catch (err) {
         console.error('Failed to create EventSource', err);
      }
    } else {
      // Start mock data emission directly to buffer
      const stopMock = startMockStream((t) => bufferRef.current.push(t));
      
      // Cleanup for Mock
      eventSource = { close: stopMock } as any;
    }

    // Flush to the Zustand store smoothly every 100ms
    flushInterval = setInterval(flushBuffer, 100);

    return () => {
      clearInterval(flushInterval);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [batchAddThoughts, isMock]);
}
