'use client';

import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { ThreatRadar } from '../../components/Firewall/ThreatRadar';
import { StdoutLogs } from '../../components/Firewall/StdoutLogs';
import { ReseedModal } from '../../components/Firewall/ReseedModal';
import { MainLayout } from '../../components/Layout/MainLayout';
import { AegisPanel } from '../../components/AegisPanel';
import { AegisMetricsData, QuarantineRecord } from '../../lib/api';

const GridContainer = styled.div`
  display: grid;
  width: 100%;
  height: 100%;
  background-color: #000000;
  color: #ffffff;
  font-family: monospace;
  grid-template-columns: 1fr 400px;
  grid-template-areas: "main sidebar";
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
  text-shadow: ${props => (props.$color ? `0 0 8px ${props.$color}66` : 'none')};
`;

const TableContainer = styled.div`
  background-color: #09090b;
  border: 1px solid #27272a;
  display: flex;
  flex-direction: column;
  min-height: 0;
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
  background-color: ${props =>
    props.$selected ? 'rgba(6, 182, 212, 0.05)' : 'transparent'};
  border-left: 2px solid
    ${props => (props.$selected ? '#06b6d4' : 'transparent')};

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
  color: ${props =>
    props.$type === 'CRYPTO_SPOOF' ? '#ef4444' : '#ffb300'};
  border-color: ${props =>
    props.$type === 'CRYPTO_SPOOF'
      ? 'rgba(239, 68, 68, 0.3)'
      : 'rgba(255, 179, 0, 0.3)'};
  background-color: ${props =>
    props.$type === 'CRYPTO_SPOOF'
      ? 'rgba(239, 68, 68, 0.1)'
      : 'rgba(255, 179, 0, 0.1)'};
`;

const ActionBtn = styled.button`
  background-color: #ef4444;
  color: #ffffff;
  border: none;
  font-family: monospace;
  font-size: 10px;
  padding: 6px 12px;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: bold;
  border-radius: 2px;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);

  &:hover {
    background-color: #dc2626;
  }
`;

const SidebarArea = styled.aside`
  grid-area: sidebar;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

interface FirewallClientLayoutProps {
  initialMetrics: AegisMetricsData | null;
  initialQuarantineList: QuarantineRecord[];
}

export function FirewallClientLayout({
  initialMetrics,
  initialQuarantineList,
}: FirewallClientLayoutProps) {
  const [search, setSearch] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [reseedAgentHex, setReseedAgentHex] = useState<string | null>(null);

  const filteredList = useMemo(() => {
    return initialQuarantineList.filter(
      (item) =>
        item.agent_hex.toLowerCase().includes(search.toLowerCase()) ||
        item.attempted_path.toLowerCase().includes(search.toLowerCase())
    );
  }, [initialQuarantineList, search]);

  return (
    <MainLayout title="AEGIS Security Control">
      <GridContainer>
        <MainArea>
          {/* Top Metrics Cards */}
          <MetricsContainer>
            <MetricCard>
              <MetricLabel>Total Quarantined</MetricLabel>
              <MetricValue $color="#ef4444">
                {initialMetrics ? initialMetrics.total_quarantined : 0}
              </MetricValue>
            </MetricCard>
            <MetricCard>
              <MetricLabel>Crypto Spoofs</MetricLabel>
              <MetricValue $color="#ef4444">
                {initialMetrics ? initialMetrics.signarure_spoofs : 0}
              </MetricValue>
            </MetricCard>
            <MetricCard>
              <MetricLabel>Namespace Breaches</MetricLabel>
              <MetricValue $color="#f59e0b">
                {initialMetrics ? initialMetrics.namespace_breaches : 0}
              </MetricValue>
            </MetricCard>
            <MetricCard>
              <MetricLabel>Rate Limit Jails</MetricLabel>
              <MetricValue $color="#06b6d4">
                {initialMetrics ? initialMetrics.rate_limit_blocks : 0}
              </MetricValue>
            </MetricCard>
          </MetricsContainer>

          {/* Quarantined Nodes Table */}
          <TableContainer>
            <TableHeader>
              <TableTitle>Isolated / Compromised Enclaves</TableTitle>
              <SearchInput
                placeholder="Search hex / path..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </TableHeader>
            <GridHeader>
              <div>Agent Hex</div>
              <div>Violation</div>
              <div>Attempted Target</div>
              <div>Remediation</div>
            </GridHeader>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredList.length === 0 ? (
                <div className="p-8 text-center text-zinc-600 font-mono text-xs uppercase tracking-widest">
                  No enclaves currently held in Aegis quarantine
                </div>
              ) : (
                filteredList.map((item) => (
                  <GridRow
                    key={item.agent_hex}
                    $selected={selectedAgent === item.agent_hex}
                    onClick={() => setSelectedAgent(item.agent_hex)}
                  >
                    <HexVal>{item.agent_hex}</HexVal>
                    <div>
                      <ViolationBadge $type={item.violation_type}>
                        {item.violation_type}
                      </ViolationBadge>
                    </div>
                    <PathVal title={item.attempted_path}>
                      {item.attempted_path}
                    </PathVal>
                    <div>
                      <ActionBtn
                        onClick={(e) => {
                          e.stopPropagation();
                          setReseedAgentHex(item.agent_hex);
                        }}
                      >
                        Reseed &amp; Lift
                      </ActionBtn>
                    </div>
                  </GridRow>
                ))
              )}
            </div>
          </TableContainer>

          {/* Bottom Stdout Logs */}
          <StdoutLogs />
        </MainArea>

        {/* Right Sidebar: Threat Radar & Live Aegis Panel */}
        <SidebarArea>
          <ThreatRadar />
          <div style={{ flex: 1, minHeight: 0 }}>
            <AegisPanel />
          </div>
        </SidebarArea>
      </GridContainer>

      {/* Reseed & Lift Quarantine Modal */}
      {reseedAgentHex && (
        <ReseedModal
          agentHex={reseedAgentHex}
          onClose={() => setReseedAgentHex(null)}
          onSuccess={() => setReseedAgentHex(null)}
        />
      )}
    </MainLayout>
  );
}
