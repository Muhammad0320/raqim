'use client';

import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { ThreatRadar } from '../../components/Firewall/ThreatRadar';
import { StdoutLogs } from '../../components/Firewall/StdoutLogs';
import { ReseedModal } from '../../components/Firewall/ReseedModal';
import { MainLayout } from '../../components/Layout/MainLayout';
import { AegisPanel } from '../../components/AegisPanel';

// CSS Grid Brutalist Layout
const GridContainer = styled.div`
  display: grid;
  width: 100%;
  height: 100%;
  background-color: #000000;
  color: #ffffff;
  font-family: monospace;
  grid-template-columns: 1fr 400px;
  grid-template-areas:
    "main sidebar";
  overflow: hidden;
`;

const MainArea = styled.main`
  grid-area: main;
  display: grid;
  grid-template-rows: auto 1fr 240px;
  gap: 20px;
  padding: 20px;
  border-right: 1px solid #27272a;
  overflow: hidden;
  height: 100%;
`;

const MetricsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
`;

const MetricCard = styled.div`
  background-color: #09090b;
  border: 1px solid #27272a;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MetricLabel = styled.span`
  font-size: 9px;
  color: #71717a;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const MetricValue = styled.span<{ $color?: string }>`
  font-size: 28px;
  font-weight: bold;
  color: ${props => props.$color || '#ffffff'};
  text-shadow: ${props => props.$color ? `0 0 8px ${props.$color}66` : 'none'};
`;

const TableContainer = styled.div`
  background-color: #09090b;
  border: 1px solid #27272a;
  display: flex;
  flex-direction: column;
  min-h: 0;
  overflow: hidden;
`;

const TableHeader = styled.div`
  background-color: #18181b;
  border-bottom: 1px solid #27272a;
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  shrink-0: true;
`;

const TableTitle = styled.span`
  font-size: 10px;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: bold;
`;

const SearchInput = styled.input`
  background: #000000;
  border: 1px solid #27272a;
  color: #ffffff;
  font-family: monospace;
  font-size: 11px;
  padding: 4px 10px;
  width: 200px;
  outline: none;

  &:focus {
    border-color: #ef4444;
  }
`;

const GridHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1.5fr auto;
  padding: 8px 16px;
  border-bottom: 1px solid #27272a;
  background-color: #0c0c0e;
  font-size: 9px;
  color: #71717a;
  text-transform: uppercase;
  letter-spacing: 1px;
  shrink-0: true;
`;

const GridRow = styled.div<{ $selected: boolean }>`
  display: grid;
  grid-template-columns: 1fr 1fr 1.5fr auto;
  padding: 12px 16px;
  border-bottom: 1px solid #27272a;
  align-items: center;
  cursor: pointer;
  background-color: ${props => props.$selected ? 'rgba(6, 182, 212, 0.05)' : 'transparent'};
  border-left: 2px solid ${props => props.$selected ? '#06b6d4' : 'transparent'};

  &:hover {
    background-color: rgba(255, 255, 255, 0.02);
  }
`;

const HexVal = styled.span`
  color: #06b6d4;
  font-size: 12px;
`;

const PathVal = styled.span`
  color: #d1d1d6;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 8px;
`;

const ViolationBadge = styled.span<{ $type: string }>`
  font-size: 9px;
  padding: 2px 6px;
  border: 1px solid;
  width: fit-content;
  text-transform: uppercase;
  color: ${props => props.$type === 'CRYPTO_SPOOF' ? '#ef4444' : '#ffb300'};
  border-color: ${props => props.$type === 'CRYPTO_SPOOF' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 179, 0, 0.3)'};
  background-color: ${props => props.$type === 'CRYPTO_SPOOF' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 179, 0, 0.1)'};
`;

const ActionBtn = styled.button`
  background: transparent;
  border: 1px solid #ef4444;
  color: #ef4444;
  font-family: monospace;
  font-size: 9px;
  padding: 4px 8px;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &:hover {
    background-color: rgba(239, 68, 68, 0.15);
  }
`;

const TableBody = styled.div`
  flex: 1;
  overflow-y: auto;
  background-color: #020202;
`;

const Sidebar = styled.aside`
  grid-area: sidebar;
  display: grid;
  grid-template-rows: 240px 1fr;
  gap: 20px;
  padding: 20px;
  overflow: hidden;
  height: 100%;
`;

const InspectorContainer = styled.div`
  background-color: #09090b;
  border: 1px solid #27272a;
  display: flex;
  flex-direction: column;
  min-h: 0;
  overflow: hidden;
`;

const InspectorHeader = styled.div`
  background-color: #18181b;
  border-bottom: 1px solid #27272a;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  shrink-0: true;
`;

const InspectorTitle = styled.span`
  font-size: 10px;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: bold;
`;

const InspectorBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ForensicsLabel = styled.span`
  font-size: 9px;
  color: #71717a;
  text-transform: uppercase;
  letter-spacing: 1px;
  display: block;
  margin-bottom: 4px;
`;

const ForensicsValue = styled.div<{ $color?: string }>`
  font-size: 12px;
  color: ${props => props.$color || '#fafafa'};
  word-break: break-all;
`;

const PayloadBox = styled.div`
  flex: 1;
  background-color: #000000;
  border: 1px solid rgba(239, 68, 68, 0.25);
  padding: 12px;
  overflow: auto;
  font-family: monospace;
  font-size: 11px;
  color: #ef4444;
  white-space: pre-wrap;
  box-shadow: inset 0 0 8px rgba(239, 68, 68, 0.08);
  min-height: 100px;
`;

interface FirewallClientLayoutProps {
  initialMetrics: {
    total_quarantined: number;
    recent_interdictions: number;
    signarure_spoofs: number;
    namespace_breaches: number;
  } | null;
  initialQuarantineList: Array<{
    agent_hex: string;
    violation_type: string;
    attempted_path: string;
    payload_preview: string;
    timestamp: number;
  }>;
  token: string;
}

export function FirewallClientLayout({ initialMetrics, initialQuarantineList, token }: FirewallClientLayoutProps) {
  const [quarantineList, setQuarantineList] = useState(initialQuarantineList);
  const [selectedAgentHex, setSelectedAgentHex] = useState<string | null>(null);
  const [reseedAgentHex, setReseedAgentHex] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Local state update when resurrected
  const handleResurrectionSuccess = () => {
    if (reseedAgentHex) {
      setQuarantineList(prev => prev.filter(item => item.agent_hex !== reseedAgentHex));
      if (selectedAgentHex === reseedAgentHex) {
        setSelectedAgentHex(null);
      }
    }
  };

  // Filter list
  const filteredList = useMemo(() => {
    return quarantineList.filter(item =>
      item.agent_hex.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.violation_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.attempted_path.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [quarantineList, searchQuery]);

  // Selected forensics record
  const selectedRecord = useMemo(() => {
    if (!selectedAgentHex) return null;
    return quarantineList.find(item => item.agent_hex === selectedAgentHex) || null;
  }, [selectedAgentHex, quarantineList]);

  // Format date
  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return `${d.toTimeString().split(' ')[0]}.${d.getMilliseconds().toString().padStart(3, '0')}`;
  };

  const metrics = initialMetrics || {
    total_quarantined: quarantineList.length,
    recent_interdictions: 0,
    signarure_spoofs: 0,
    namespace_breaches: 0,
  };

  return (
    <MainLayout title="Aegis Firewall">
      <GridContainer>
        <MainArea>
        {/* Metric Cards */}
        <MetricsContainer>
          <MetricCard>
            <MetricLabel>Total Quarantined</MetricLabel>
            <MetricValue $color="#ef4444">{quarantineList.length}</MetricValue>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Recent Interdictions</MetricLabel>
            <MetricValue>{metrics.recent_interdictions}</MetricValue>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Signature Spoofs</MetricLabel>
            <MetricValue $color="#ef4444">{metrics.signarure_spoofs}</MetricValue>
          </MetricCard>
          <MetricCard>
            <MetricLabel>Namespace Breaches</MetricLabel>
            <MetricValue $color="#ffb300">{metrics.namespace_breaches}</MetricValue>
          </MetricCard>
        </MetricsContainer>

        {/* Quarantine Blocklist Table */}
        <AegisPanel />

        {/* Live Stdout logs */}
        <StdoutLogs token={token} />
      </MainArea>

      <Sidebar>
        {/* Threat Radar Visual */}
        <ThreatRadar />

        {/* Inspector Panel */}
        <InspectorContainer>
          <InspectorHeader>
            <InspectorTitle>Forensics Audit Inspector</InspectorTitle>
          </InspectorHeader>
          <InspectorBody>
            {!selectedRecord ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#52525b', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Select a quarantined node<br />to audit payload forensics
              </div>
            ) : (
              <>
                <div>
                  <ForensicsLabel>Agent Enclave Hex</ForensicsLabel>
                  <ForensicsValue $color="#06b6d4">{selectedRecord.agent_hex}</ForensicsValue>
                </div>
                <div>
                  <ForensicsLabel>Violation Type</ForensicsLabel>
                  <ViolationBadge $type={selectedRecord.violation_type}>
                    {selectedRecord.violation_type}
                  </ViolationBadge>
                </div>
                <div>
                  <ForensicsLabel>Interdiction Time</ForensicsLabel>
                  <ForensicsValue>{formatTimestamp(selectedRecord.timestamp)}</ForensicsValue>
                </div>
                <div>
                  <ForensicsLabel>Attempted Path Ingress</ForensicsLabel>
                  <ForensicsValue>{selectedRecord.attempted_path}</ForensicsValue>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <ForensicsLabel>Violated Payload Preview</ForensicsLabel>
                  <PayloadBox>{selectedRecord.payload_preview}</PayloadBox>
                </div>
              </>
            )}
          </InspectorBody>
        </InspectorContainer>
      </Sidebar>

      {reseedAgentHex && (
        <ReseedModal
          agentHex={reseedAgentHex}
          onClose={() => setReseedAgentHex(null)}
          onSuccess={handleResurrectionSuccess}
        />
      )}
      </GridContainer>
    </MainLayout>
  );
}
