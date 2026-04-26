import { useEffect, useRef } from 'react';
import { useSwarmStore, UiThought } from '../store/useSwarmStore';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { startMockStream } from '../mockGenerator';

const SSE_URL = 'http://127.0.0.1:8081/v1/swarm/live';
const JWT_TOKEN = 'mock_license_key_123'; // Replace with real auth token logic

export function useSwarmStream() {
  const { batchAddThoughts } = useSwarmStore();
  const bufferRef = useRef<UiThought[]>([]);
  const isMock = true; // Use mock for local dev until Rust backend is up
  const rAF_Ref = useRef<number>();

  useEffect(() => {
    const controller = new AbortController();

    // Use requestAnimationFrame to flush the buffer synchronously with browser repaints
    // This protects the DOM from thousands of React state updates per second.
    const flushBuffer = () => {
      if (bufferRef.current.length > 0) {
        batchAddThoughts([...bufferRef.current]);
        bufferRef.current = []; // Clear local buffer
      }
      rAF_Ref.current = requestAnimationFrame(flushBuffer);
    };

    rAF_Ref.current = requestAnimationFrame(flushBuffer);

    if (!isMock) {
      fetchEventSource(SSE_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Accept': 'text/event-stream',
        },
        signal: controller.signal,
        async onopen(res) {
          if (res.ok && res.headers.get('content-type') === 'text/event-stream') {
             console.log("Connected to Swarm Firehose");
             return; // everything's good
          } else if (res.status >= 400 && res.status < 500 && res.status !== 429) {
             throw new Error(`Client side error ${res.status}`);
          }
        },
        onmessage(event) {
          try {
            // Backend sends the exact UiThought interface
            const rawData = JSON.parse(event.data);
            const data: UiThought = {
              ...rawData,
              // Inject synthetic UI state for visualization (assuming backend doesn't send these explicitly yet)
              status: 'COMMITTED',
              is_a2a_query: rawData.intent_path.includes('/a2a/'),
              parent_tx_id: rawData.tx_id > 0 ? rawData.tx_id - 1 : null // Naive synthetic parent
            };
            bufferRef.current.push(data);
          } catch (e) {
            console.error('Failed to parse SSE swarm frame', e);
          }
        },
        onclose() {
          console.log("SSE Connection closed by server");
        },
        onerror(err) {
          console.error("SSE Error", err);
          throw err; // throw to retry automatically
        }
      });
    } else {
      // Mock mode
      const stopMock = startMockStream((t) => bufferRef.current.push(t as unknown as UiThought));
      controller.signal.addEventListener('abort', stopMock);
    }

    return () => {
      controller.abort();
      if (rAF_Ref.current) {
        cancelAnimationFrame(rAF_Ref.current);
      }
    };
  }, [batchAddThoughts, isMock]);
}
