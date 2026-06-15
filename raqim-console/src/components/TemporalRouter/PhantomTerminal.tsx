'use client';

import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { useSwarmStore, UiThought } from '../../lib/store/useSwarmStore';

const TerminalContainer = styled.div`
  width: 100%;
  height: 100%;
  background-color: #000000;
  border-left: 1px solid #ffb300;
  display: flex;
  flex-direction: column;
  box-shadow: inset 0 0 30px rgba(255, 179, 0, 0.1);
  font-family: monospace;
`;

const TerminalHeader = styled.div`
  height: 40px;
  flex-shrink: 0;
  background-color: #100a00;
  border-bottom: 1px solid #ffb300;
  display: flex;
  align-items: center;
  padding: 0 16px;
  color: #ffb300;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-weight: bold;
`;

const LogArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  font-size: 11px;
  line-height: 1.6;
  color: #ffb300;
  display: flex;
  flex-direction: column;
  gap: 6px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 179, 0, 0.3);
  }
`;

const LogLine = styled.div`
  word-break: break-all;
  white-space: pre-wrap;
  text-shadow: 0 0 4px rgba(255, 179, 0, 0.6);
`;

const Timestamp = styled.span`
  opacity: 0.5;
  margin-right: 10px;
  color: #ffb300;
`;

interface LogEntry {
  id: string;
  timestamp: string;
  text: string;
}

export function PhantomTerminal() {
  const { isForking, batchAddThoughts, setActiveTxId } = useSwarmStore();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logAreaRef = useRef<HTMLDivElement>(null);

  const addLog = (text: string) => {
    setLogs((prev) => {
      const newLog = {
        id: Math.random().toString(36).substring(2, 11),
        timestamp: new Date().toISOString().split('T')[1].replace('Z', ''),
        text,
      };
      const nextLogs = [...prev, newLog];
      if (nextLogs.length > 100) return nextLogs.slice(nextLogs.length - 100);
      return nextLogs;
    });
  };

  useEffect(() => {
    if (!isForking) return;

    addLog('[PHANTOM_OS] Initializing WASI sandbox...');
    addLog('[PHANTOM_OS] Fork complete. Diverging timeline active.');
    addLog('[PHANTOM_OS] Connecting to temporal stream /v1/time-travel/stream...');

    const token = document.cookie.split('; ').find(row => row.startsWith('raqim_license='))?.split('=')[1] || '';
    
    // Connect to SSE
    const eventSource = new EventSource(`http://127.0.0.1:8081/v1/time-travel/stream?token=${token}`);

    eventSource.onopen = () => {
      addLog('[PHANTOM_OS] Stream session established. Awaiting temporal events...');
    };

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        const eventType = parsed.event_type || parsed.type;

        if (eventType === 'ThoughtCommitted') {
          addLog(`[PHANTOM_OS] [Tx ${parsed.tx_id}] Memory allocation complete: ${parsed.intent_path} - "${parsed.text}"`);
          
          const newPhantomThought: UiThought = {
            tx_id: parsed.tx_id,
            agent_hex: parsed.agent_hex || '0xPHANTOM',
            intent_path: parsed.intent_path,
            text: parsed.text,
            parent_tx_id: parsed.tx_id > 0 ? parsed.tx_id - 1 : null,
            status: 'FORKED',
            is_a2a_query: false,
          };
          batchAddThoughts([newPhantomThought]);
          setActiveTxId(parsed.tx_id);
        } else if (eventType === 'A2aMessageRouted') {
          addLog(`[PHANTOM_OS] RPC Message routed from ${parsed.source_hex} to ${parsed.target_hex} inside ${parsed.namespace} [${parsed.latency_ms}ms]`);
        } else if (eventType === 'AegisAlert') {
          addLog(`[PHANTOM_OS] [AEGIS EVICTION ALERT] Threat detected for Agent ${parsed.record.agent_hex} - Violation: ${parsed.record.violation_type} on path ${parsed.record.attempted_path}`);
        }
      } catch (err) {
        addLog(`[PHANTOM_OS] Error decoding stream payload: ${err}`);
      }
    };

    eventSource.onerror = (err) => {
      addLog('[PHANTOM_OS] Stream connection degraded. Attempting reconnection...');
    };

    return () => {
      eventSource.close();
      addLog('[PHANTOM_OS] Sandbox destroyed.');
    };
  }, [isForking, batchAddThoughts, setActiveTxId]);

  useEffect(() => {
    if (logAreaRef.current) {
      logAreaRef.current.scrollTop = logAreaRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <TerminalContainer>
      <TerminalHeader>PHANTOM TERMINAL // STDOUT_LOGS</TerminalHeader>
      <LogArea ref={logAreaRef}>
        {logs.map((log) => (
          <LogLine key={log.id}>
            <Timestamp>[{log.timestamp}]</Timestamp>
            {log.text}
          </LogLine>
        ))}
      </LogArea>
    </TerminalContainer>
  );
}
