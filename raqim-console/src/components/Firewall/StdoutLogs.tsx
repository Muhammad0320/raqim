import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useFirehoseStream, FirehoseEvent } from '../../lib/hooks/useFirehoseStream';

const Container = styled.div`
  background-color: #000000;
  border: 1px solid #27272a;
  height: 240px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  background-color: #18181b;
  border-bottom: 1px solid #27272a;
  padding: 8px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
  shrink-0: true;
`;

const Title = styled.span`
  font-family: monospace;
  font-size: 10px;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: bold;
`;

const PulseDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #ef4444;
  box-shadow: 0 0 6px #ef4444;
`;

const TerminalBody = styled.div`
  flex: 1;
  padding: 12px 16px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 11px;
  line-height: 1.6;
  color: #a1a1aa;
  background-color: #000000;
`;

const LogLine = styled.div`
  margin-bottom: 4px;
  word-break: break-all;
`;

const Timestamp = styled.span`
  color: #52525b;
`;

const TagDrop = styled.span`
  color: #ef4444;
  font-weight: bold;
  margin: 0 6px;
`;

const ViolationType = styled.span`
  color: #06b6d4;
  margin-right: 6px;
`;

const InfoText = styled.span`
  color: #fafafa;
`;

const resolveAlias = (hex: string) => {
  return `Agent-${hex.slice(0, 6).toUpperCase()}`;
};

export function StdoutLogs() {
  const events = useFirehoseStream();
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const aegisAlerts = events.filter(
    (e): e is Extract<FirehoseEvent, { event_type: 'AegisAlert' }> =>
      e.event_type === 'AegisAlert'
  );

  const ringBuffer = aegisAlerts.slice(0, 50).reverse();

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ringBuffer.length]);

  return (
    <Container>
      <Header>
        <Title>Live Interdiction Terminal // STDOUT</Title>
        <PulseDot />
      </Header>
      <TerminalBody>
        {ringBuffer.length === 0 ? (
          <div style={{ color: '#52525b' }}>
            [AEGIS ENGINE READY] Monitoring high-throughput kernel rings...
          </div>
        ) : (
          ringBuffer.map((alert, idx) => {
            const date = new Date(alert.record.timestamp);
            const timeStr = date.toTimeString().split(' ')[0] + '.' + date.getMilliseconds();
            return (
              <LogLine key={`${alert.record.agent_hex}-${alert.record.timestamp}-${idx}`}>
                <Timestamp>[{timeStr}]</Timestamp>
                <TagDrop>[DROP]</TagDrop>
                <ViolationType>[{alert.record.violation_type || 'VIOLATION'}]</ViolationType>
                <span>{resolveAlias(alert.record.agent_hex)}:</span>{' '}
                <InfoText>
                  attempted {alert.record.attempted_path || alert.record.violated_path || 'unauthorized memory access'}
                </InfoText>
              </LogLine>
            );
          })
        )}
        <div ref={terminalEndRef} />
      </TerminalBody>
    </Container>
  );
}
