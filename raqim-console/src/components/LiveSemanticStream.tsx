'use client';

import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAgentAliases } from '../actions/aliases';
import { useFirehoseStream, FirehoseEvent } from '../lib/hooks/useFirehoseStream';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  position: relative;
  background-color: #09090b; /* Brutalism deep black */
  font-family: 'JetBrains Mono', 'Space Mono', monospace;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
`;

const Header = styled.div`
  background-color: rgba(255, 255, 255, 0.03);
  padding: 0.75rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
`;

const TitleArea = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const TitleText = styled.span`
  font-size: 0.6875rem;
  color: rgba(255, 255, 255, 0.8);
  uppercase: true;
  letter-spacing: 0.2em;
  font-weight: 700;
  text-transform: uppercase;
`;

const pulseAnimation = keyframes`
  0% { opacity: 1; box-shadow: 0 0 0 0 rgba(0, 243, 255, 0.4); }
  70% { opacity: 0.5; box-shadow: 0 0 0 4px rgba(0, 243, 255, 0); }
  100% { opacity: 1; box-shadow: 0 0 0 0 rgba(0, 243, 255, 0); }
`;

const LiveBadge = styled.div`
  background-color: rgba(0, 243, 255, 0.1);
  color: #00f3ff;
  border: 1px solid rgba(0, 243, 255, 0.3);
  padding: 0.125rem 0.5rem;
  border-radius: 2px;
  font-size: 0.5625rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  display: flex;
  align-items: center;
  gap: 0.375rem;

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    background-color: #00f3ff;
    border-radius: 50%;
    animation: ${pulseAnimation} 2s infinite;
  }
`;

const TableHeaderRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 3fr 3fr 4fr;
  gap: 1rem;
  padding: 0.5rem 1.5rem;
  background-color: #09090b;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.5625rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
`;

const StreamBody = styled.div`
  flex: 1;
  overflow-y: hidden;
  position: relative;
  background-color: #0a0a0a;
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const Row = styled(motion.div)`
  display: grid;
  grid-template-columns: 2fr 3fr 3fr 4fr;
  gap: 1rem;
  padding: 0.5rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.75rem;
  align-items: center;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.03);
  }
`;

const Dot = styled.span<{ $color: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: ${props => props.$color};
  box-shadow: 0 0 8px ${props => props.$color};
  flex-shrink: 0;
`;

const AgentCol = styled.div<{ $color?: string }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => props.$color || 'rgba(255,255,255,0.9)'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const NamespaceCol = styled.div<{ $color?: string }>`
  color: ${props => props.$color || 'rgba(255,255,255,0.7)'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PayloadCol = styled.div`
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// Helper component for individual rows
function PolymorphicRow({ event, resolveAgent }: { event: FirehoseEvent, resolveAgent: (hex: string) => string }) {
  if (event.event_type === 'ThoughtCommitted') {
    return (
      <Row
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div style={{ color: 'rgba(255,255,255,0.4)' }}>
          {event.tx_id.toString().padStart(6, '0')}
        </div>
        <AgentCol>
          <Dot $color="#06b6d4" />
          {resolveAgent(event.agent_hex)}
        </AgentCol>
        <NamespaceCol>{event.intent_path}</NamespaceCol>
        <PayloadCol>{event.text}</PayloadCol>
      </Row>
    );
  }

  if (event.event_type === 'A2aMessageRouted') {
    return (
      <Row
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div style={{ color: 'rgba(255,255,255,0.4)' }}>--</div>
        <AgentCol $color="#d946ef">
          <Dot $color="#d946ef" />
          {resolveAgent(event.source_hex)} -&gt; {resolveAgent(event.target_hex)}
        </AgentCol>
        <NamespaceCol>{event.namespace}</NamespaceCol>
        <PayloadCol>[LATENCY: {event.latency_ms}ms] Q: {event.question_payload.slice(0, 40)}...</PayloadCol>
      </Row>
    );
  }

  if (event.event_type === 'AegisAlert') {
    const reason = event.record.reason || event.record.violation_type || 'UNKNOWN_VIOLATION';
    const path = event.record.violated_path || event.record.attempted_path || 'UNKNOWN_PATH';
    
    return (
      <Row
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div style={{ color: 'rgba(255,255,255,0.4)' }}>--</div>
        <AgentCol>
          <Dot $color="#ef4444" style={{ animation: 'pulse 1s infinite' }} />
          {resolveAgent(event.record.agent_hex)}
        </AgentCol>
        <NamespaceCol $color="#ef4444">[ SECURITY INTERDICTION ]</NamespaceCol>
        <PayloadCol style={{ color: '#ef4444' }}>{reason} | {path}</PayloadCol>
      </Row>
    );
  }

  return null;
}

interface LiveSemanticStreamProps {
  token: string;
}

export function LiveSemanticStream({ token }: LiveSemanticStreamProps) {
  const [aliases, setAliases] = useState<Record<string, string>>({});
  const events = useFirehoseStream(token);

  useEffect(() => {
    async function loadAliases() {
      const data = await fetchAgentAliases();
      setAliases(data);
    }
    loadAliases();
  }, []);

  const resolveAgent = (hex: string) => {
    if (aliases[hex]) {
      return aliases[hex];
    }
    return hex ? hex.slice(0, 6) + '...' : 'UNKNOWN';
  };

  return (
    <Container>
      <Header>
        <TitleArea>
          <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
            data_array
          </span>
          <TitleText>Live Semantic Stream</TitleText>
        </TitleArea>
        <LiveBadge>
          Connected
        </LiveBadge>
      </Header>

      <TableHeaderRow>
        <div>TX_ID</div>
        <div>AGENT</div>
        <div>NAMESPACE</div>
        <div>PAYLOAD</div>
      </TableHeaderRow>

      <StreamBody>
        {events.length === 0 ? (
          <EmptyState>Awaiting semantic ingress...</EmptyState>
        ) : (
          <AnimatePresence initial={false}>
            {events.map((event, index) => {
              // Construct a reliable unique key. Fallback to index if needed.
              let key = '';
              if (event.event_type === 'ThoughtCommitted') key = `thought-${event.tx_id}`;
              else if (event.event_type === 'A2aMessageRouted') key = `a2a-${event.source_hex}-${event.target_hex}-${index}`;
              else if (event.event_type === 'AegisAlert') key = `aegis-${event.record.agent_hex}-${event.record.timestamp}-${index}`;
              else key = `unknown-${index}`;

              return (
                <PolymorphicRow 
                  key={key} 
                  event={event} 
                  resolveAgent={resolveAgent} 
                />
              );
            })}
          </AnimatePresence>
        )}
      </StreamBody>
    </Container>
  );
}
