import { useEffect, useRef } from 'react';
import { useSwarmStore, UiThought, UiEvent } from '../store/useSwarmStore';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { startMockStream } from '../mockGenerator';

const SSE_URL = 'http://127.0.0.1:8081/v1/swarm/live';
const JWT_TOKEN = 'mock_license_key_123'; // Replace with real auth token logic

export function useSwarmStream() {
  const { batchAddThoughts, processUiEvents } = useSwarmStore();
  const thoughtsBufferRef = useRef<UiThought[]>([]);
  const eventsBufferRef = useRef<UiEvent[]>([]);
  const isMock = true; // Use mock for local dev until Rust backend is up
  const rAF_Ref = useRef<number>(0);

  useEffect(() => {
    const controller = new AbortController();

    // Use requestAnimationFrame to flush the buffer synchronously with browser repaints
    // This protects the DOM from thousands of React state updates per second.
    const flushBuffer = () => {
      if (thoughtsBufferRef.current.length > 0) {
        batchAddThoughts([...thoughtsBufferRef.current]);
        thoughtsBufferRef.current = []; // Clear local buffer
      }
      if (eventsBufferRef.current.length > 0) {
        processUiEvents([...eventsBufferRef.current]);
        eventsBufferRef.current = [];
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
            thoughtsBufferRef.current.push(data);
            
            // Generate synthetic UiEvent since actual backend payload is missing it
            eventsBufferRef.current.push({
              event_type: "ThoughtCommitted",
              agent_hex: data.agent_hex,
              intent_path: data.intent_path,
              tx_id: data.tx_id
            });
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
      const stopMock = startMockStream((t, evs) => {
        thoughtsBufferRef.current.push(t);
        eventsBufferRef.current.push(...evs);
      });
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
