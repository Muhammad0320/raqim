import { useState, useEffect } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';

// Expand UiEvent to encompass both old and newly requested fields
export type FirehoseEvent = 
  | { event_type: "ThoughtCommitted"; agent_hex: string; intent_path: string; tx_id: number; text: string; }
  | { event_type: "A2aMessageRouted"; source_hex: string; target_hex: string; namespace: string; question_payload: string; answer_payload: string; latency_ms: number; }
  | { 
      event_type: "AegisAlert"; 
      record: { 
        agent_hex: string; 
        reason?: string; 
        violation_type?: string; 
        violated_path?: string; 
        attempted_path?: string; 
        timestamp: number 
      } 
    };

export function useFirehoseStream(token: string) {
  const [events, setEvents] = useState<FirehoseEvent[]>([]);

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    fetchEventSource('http://127.0.0.1:8081/v1/system/firehose', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream',
      },
      signal: controller.signal,
      async onopen(res) {
        if (res.ok && res.headers.get('content-type') === 'text/event-stream') {
          console.log("Connected to System Firehose SSE");
          return;
        } else if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          throw new Error(`Client side error ${res.status}`);
        }
      },
      onmessage(event) {
        try {
          const newEvent: FirehoseEvent = JSON.parse(event.data);
          
          setEvents(prev => {
            const next = [newEvent, ...prev];
            if (next.length > 100) {
              return next.slice(0, 100);
            }
            return next;
          });
        } catch (e) {
          console.error('Failed to parse Firehose Event frame', e);
        }
      },
      onclose() {
        console.log("Firehose SSE Connection closed by server");
      },
      onerror(err) {
        console.error("Firehose SSE Error", err);
        throw err;
      }
    });

    return () => {
      controller.abort();
    };
  }, [token]);

  return events;
}
