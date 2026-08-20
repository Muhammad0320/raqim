'use client';

import { useEffect, useRef } from 'react';
import { useSwarmStore, UiThought, UiEvent } from '../store/useSwarmStore';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { getFirehoseStreamUrl } from '../api';

export function useSwarmStream() {
  const {
    batchAddThoughts,
    processUiEvents,
    setDaemonOnline,
    pruneEphemeralEdges,
    tickRollingMetrics,
  } = useSwarmStore();

  const thoughtsBufferRef = useRef<UiThought[]>([]);
  const eventsBufferRef = useRef<UiEvent[]>([]);
  const rAF_Ref = useRef<number>(0);

  useEffect(() => {
    // 1. Setup requestAnimationFrame batching for smooth rendering
    const flushBuffer = () => {
      if (thoughtsBufferRef.current.length > 0) {
        batchAddThoughts([...thoughtsBufferRef.current]);
        thoughtsBufferRef.current = [];
      }
      if (eventsBufferRef.current.length > 0) {
        processUiEvents([...eventsBufferRef.current]);
        eventsBufferRef.current = [];
      }
      rAF_Ref.current = requestAnimationFrame(flushBuffer);
    };

    rAF_Ref.current = requestAnimationFrame(flushBuffer);

    // 2. Setup lifecycle-managed intervals
    const metricsInterval = setInterval(() => {
      tickRollingMetrics();
    }, 1000);

    const pruneInterval = setInterval(() => {
      pruneEphemeralEdges();
    }, 100);

    // 3. Connect to canonical SSE Firehose endpoint
    const controller = new AbortController();
    const sseUrl = getFirehoseStreamUrl();

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
        } else {
          setDaemonOnline(false, `DAEMON_HTTP_${res.status}`);
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
              parent_tx_id: rawData.tx_id > 0 ? rawData.tx_id - 1 : null,
            };
            thoughtsBufferRef.current.push(data);

            eventsBufferRef.current.push({
              event_type: 'ThoughtCommitted',
              agent_hex: data.agent_hex,
              intent_path: data.intent_path,
              tx_id: data.tx_id,
              text: data.text,
            });
          } else if (eventType === 'A2aMessageRouted') {
            eventsBufferRef.current.push({
              event_type: 'A2aMessageRouted',
              source_hex: rawData.source_hex,
              target_hex: rawData.target_hex,
              namespace: rawData.namespace,
              question_payload: rawData.question_payload || '',
              answer_payload: rawData.answer_payload || '',
              latency_ms: rawData.latency_ms || 0,
            });
          } else if (eventType === 'AegisAlert') {
            eventsBufferRef.current.push({
              event_type: 'AegisAlert',
              record: {
                agent_hex: rawData.record?.agent_hex || rawData.agent_hex || 'UNKNOWN',
                violation_type: rawData.record?.violation_type || rawData.violation_type || 'SECURITY_VIOLATION',
                attempted_path: rawData.record?.attempted_path || rawData.attempted_path || 'UNKNOWN',
                payload_preview: rawData.record?.payload_preview || rawData.payload_preview || '',
                timestamp: rawData.record?.timestamp || Date.now(),
              },
            });
          } else if (eventType === 'RealityForked') {
            eventsBufferRef.current.push({
              event_type: 'RealityForked',
              agent_id: rawData.agent_id,
              original_namespace: rawData.original_namespace,
              phantom_namespace: rawData.phantom_namespace,
              step_ordinal: rawData.step_ordinal,
              tx_id: rawData.tx_id,
            });
          }
          setDaemonOnline(true, null);
        } catch (e) {
          console.error('Failed to parse Firehose Event frame', e);
        }
      },
      onclose() {
        setDaemonOnline(false, 'DAEMON_STREAM_CLOSED');
      },
      onerror(err) {
        setDaemonOnline(false, 'DAEMON_UNREACHABLE');
        // Let it retry quietly
      },
    }).catch(() => {
      setDaemonOnline(false, 'DAEMON_UNREACHABLE');
    });

    return () => {
      cancelAnimationFrame(rAF_Ref.current);
      clearInterval(metricsInterval);
      clearInterval(pruneInterval);
      controller.abort();
    };
  }, [
    batchAddThoughts,
    processUiEvents,
    setDaemonOnline,
    pruneEphemeralEdges,
    tickRollingMetrics,
  ]);
}
