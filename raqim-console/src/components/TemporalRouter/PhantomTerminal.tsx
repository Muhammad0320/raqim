"use client";
import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { useSwarmStore, UiEvent, UiThought } from '../../lib/store/useSwarmStore';

const TerminalContainer = styled.div`
  width: 100%;
  height: 100%;
  background-color: #000000;
  border-left: 1px solid rgba(255, 179, 0, 0.2);
  display: flex;
  flex-direction: column;
  box-shadow: inset 0 0 50px rgba(255, 179, 0, 0.05);
`;

const TerminalHeader = styled.div`
  height: 40px;
  flex-shrink: 0;
  background-color: rgba(255, 179, 0, 0.1);
  border-bottom: 1px solid rgba(255, 179, 0, 0.3);
  display: flex;
  align-items: center;
  padding: 0 16px;
  color: #ffb300;
  font-family: monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

const LogArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  font-family: monospace;
  font-size: 11px;
  line-height: 1.6;
  color: #ffb300;
  display: flex;
  flex-direction: column;
  gap: 4px;

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
  text-shadow: 0 0 5px rgba(255, 179, 0, 0.5);
`;

const Timestamp = styled.span`
  opacity: 0.6;
  margin-right: 8px;
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

  useEffect(() => {
    if (!isForking) return;

    const addLog = (text: string) => {
      setLogs((prev) => {
        const newLog = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          text
        };
        const nextLogs = [...prev, newLog];
        if (nextLogs.length > 100) return nextLogs.slice(nextLogs.length - 100);
        return nextLogs;
      });
    };

    addLog("[PHANTOM_OS] Initializing WASI sandbox...");
    addLog("[PHANTOM_OS] Fork complete. Awaiting temporal events...");

    const eventSource = new EventSource('http://localhost:8081/v1/time_travel/stream');

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as UiEvent;
        
        if (parsed.event_type === "ThoughtCommitted") {
          addLog(`[PHANTOM_OS] [Tx ${parsed.tx_id}] Memory allocation complete: ${parsed.intent_path}`);
          
          const newPhantomThought: UiThought = {
            tx_id: parsed.tx_id,
            agent_hex: parsed.agent_hex || "0xPHANTOM",
            intent_path: parsed.intent_path,
            text: parsed.text,
            parent_tx_id: parsed.tx_id - 1, // Assume sequential
            status: "FORKED",
            is_a2a_query: false,
          };
          batchAddThoughts([newPhantomThought]);
          setActiveTxId(parsed.tx_id);
        } else if (parsed.event_type === "A2aMessageRouted") {
          addLog(`[PHANTOM_OS] RPC Routed ${parsed.source_hex} -> ${parsed.target_hex} [${parsed.latency_ms}ms]`);
        } else if (parsed.event_type === "AegisAlert") {
          addLog(`[PHANTOM_OS] SECURITY VIOLATION: ${parsed.record.violation_type} BY ${parsed.record.agent_hex}`);
        }
      } catch (err) {
        addLog(`[PHANTOM_OS] Stream parsing error: ${err}`);
      }
    };

    eventSource.onerror = (err) => {
      addLog(`[PHANTOM_OS] Stream connection degraded. Retrying...`);
    };

    return () => {
      eventSource.close();
      addLog("[PHANTOM_OS] Sandbox destroyed.");
    };
  }, [isForking, batchAddThoughts, setActiveTxId]);

  useEffect(() => {
    if (logAreaRef.current) {
      logAreaRef.current.scrollTop = logAreaRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <TerminalContainer>
      <TerminalHeader>
        PHANTOM TERMINAL // STDOUT
      </TerminalHeader>
      <LogArea ref={logAreaRef}>
        {logs.map((log) => (
          <LogLine key={log.id}>
            <Timestamp>[{log.timestamp.split('T')[1].replace('Z', '')}]</Timestamp>
            {log.text}
          </LogLine>
        ))}
      </LogArea>
    </TerminalContainer>
  );
}
