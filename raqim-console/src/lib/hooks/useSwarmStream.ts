import { useEffect, useRef } from 'react';
import { useSwarmStore, UiThought, UiEvent } from '../store/useSwarmStore';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { startMockStream } from '../mockGenerator';

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
}

const SSE_URL = 'http://127.0.0.1:8081/v1/system/firehose';

export function useSwarmStream() {
  const { batchAddThoughts, processUiEvents } = useSwarmStore();
  const thoughtsBufferRef = useRef<UiThought[]>([]);
  const eventsBufferRef = useRef<UiEvent[]>([]);
  const isMock = false; // Set to false to listen to the real Rust backend
  const rAF_Ref = useRef<number>(0);
  const jwtToken = getCookie('raqim_license') || 'mock_license_key_123';

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
          'Authorization': `Bearer ${jwtToken}`,
          'Accept': 'text/event-stream',
        },
        signal: controller.signal,
        async onopen(res) {
          if (res.ok && res.headers.get('content-type')?.includes('text/event-stream')) {
             console.log("Connected to Swarm Firehose");
             return; // everything's good
          } else if (res.status >= 400 && res.status < 500 && res.status !== 429) {
             throw new Error(`Client side error ${res.status}`);
          }
        },
        onmessage(event) {
          try {
            const rawData = JSON.parse(event.data);
            const eventType = rawData.event_type || rawData.type;

            if (eventType === 'ThoughtCommited' || eventType === 'ThoughtCommitted') {
              const data: UiThought = {
                tx_id: rawData.tx_id,
                agent_hex: rawData.agent_hex,
                intent_path: rawData.intent_path,
                text: rawData.text || rawData.payload || '',
                status: 'COMMITTED',
                is_a2a_query: rawData.intent_path?.includes('/a2a/') || false,
                parent_tx_id: rawData.tx_id > 0 ? rawData.tx_id - 1 : null
              };
              thoughtsBufferRef.current.push(data);
              
              eventsBufferRef.current.push({
                event_type: "ThoughtCommitted",
                agent_hex: data.agent_hex,
                intent_path: data.intent_path,
                tx_id: data.tx_id,
                text: data.text
              });
            } else if (eventType === 'A2aMessageRouted') {
              eventsBufferRef.current.push({
                event_type: "A2aMessageRouted",
                source_hex: rawData.source_hex,
                target_hex: rawData.target_hex,
                namespace: rawData.namespace,
                question_payload: rawData.question_payload,
                answer_payload: rawData.answer_payload,
                latency_ms: rawData.latency_ms
              });
            } else if (eventType === 'AegisAlert') {
              eventsBufferRef.current.push({
                event_type: "AegisAlert",
                record: rawData.record
              });
            }
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
  }, [batchAddThoughts, isMock, processUiEvents]);
}
