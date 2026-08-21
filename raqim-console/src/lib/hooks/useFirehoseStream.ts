'use client';

import { useState, useEffect } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { getFirehoseStreamUrl } from '../api';

export type FirehoseEvent =
  | {
      event_type: 'ThoughtCommitted';
      agent_hex: string;
      intent_path: string;
      tx_id: number;
      text: string;
    }
  | {
      event_type: 'A2aMessageRouted';
      source_hex: string;
      target_hex: string;
      namespace: string;
      question_payload: string;
      answer_payload: string;
      latency_ms: number;
    }
  | {
      event_type: 'AegisAlert';
      record: {
        agent_hex: string;
        reason?: string;
        violation_type?: string;
        violated_path?: string;
        attempted_path?: string;
        timestamp: number;
      };
    }
  | {
      event_type: 'RealityForked';
      agent_id: string;
      original_namespace: string;
      phantom_namespace: string;
      step_ordinal: number;
      tx_id: string;
    };

export function useFirehoseStream() {
  const [events, setEvents] = useState<FirehoseEvent[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const sseUrl = getFirehoseStreamUrl();

    fetchEventSource(sseUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
      },
      signal: controller.signal,
      async onopen(res) {
        if (res.ok && res.headers.get('content-type') === 'text/event-stream') {
          return;
        }
      },
      onmessage(event) {
        try {
          const newEvent: FirehoseEvent = JSON.parse(event.data);
          setEvents((prev) => {
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
      onerror() {},
    }).catch(() => {});

    return () => {
      controller.abort();
    };
  }, []);

  return events;
}
