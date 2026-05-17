'use client';

import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useFirewallStore } from '../../store/firewallStore';

const Container = styled.div`
  background: #000;
  height: 100%;
  width: 100%;
  border-left: 1px solid #27272a;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid #27272a;
  background: #18181b;
  font-size: 12px;
  color: #a1a1aa;
  text-transform: uppercase;
  font-weight: 600;
`;

const LogArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const LogLine = styled.div<{ $type: string }>`
  font-family: monospace;
  font-size: 11px;
  line-height: 1.4;
  color: ${p => p.$type.includes('RATE') || p.$type.includes('WARN') ? '#f59e0b' : '#ef4444'};
`;

const Time = styled.span`
  color: #52525b;
  margin-right: 8px;
`;

const DropBadge = styled.span`
  background: #ef4444;
  color: #fff;
  padding: 0 4px;
  margin-right: 8px;
`;

export default function StdoutLogs() {
  const alerts = useFirewallStore(state => state.alerts);
  const logEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [alerts]);

  const sorted = [...alerts].sort((a, b) => a.timestamp - b.timestamp);

  // Buffer of 50
  const displayAlerts = sorted.slice(-50);

  return (
    <Container>
      <Header>Stdout Logs (Aegis Firehose)</Header>
      <LogArea>
        {displayAlerts.map(alert => {
          const d = new Date(alert.timestamp);
          const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}.${d.getMilliseconds().toString().padStart(3, '0')}`;
          
          return (
            <LogLine key={alert.id} $type={alert.violation_type}>
              <Time>[{timeStr}]</Time>
              <DropBadge>[AEGIS_DROP]</DropBadge>
              {alert.violation_type.toUpperCase()} from {alert.agent_alias} on path {alert.attempted_path}.
            </LogLine>
          );
        })}
        <div ref={logEndRef} />
      </LogArea>
    </Container>
  );
}
