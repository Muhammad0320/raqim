'use client';

import React, { useState, useTransition } from 'react';
import styled, { keyframes } from 'styled-components';
import DistributionRibbon from './DistributionRibbon';
import { executeUnifiedSearch } from '../../app/vault/actions';

const LayoutContainer = styled.div`
  display: grid;
  grid-template-columns: 320px 1fr;
  height: 100vh;
  width: 100vw;
  background-color: #000;
  color: #fafafa;
  font-family: 'Inter', monospace;
  overflow: hidden;
`;

const Sidebar = styled.aside`
  background-color: #09090b;
  border-right: 1px solid #27272a;
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const SidebarHeader = styled.div`
  padding: 24px;
  border-bottom: 1px solid #27272a;
`;

const Title = styled.h1`
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #fff;
  margin: 0 0 8px 0;
`;

const Subtitle = styled.div`
  font-size: 10px;
  color: #a1a1aa;
  text-transform: uppercase;
  font-family: monospace;
`;

const VitalsPanel = styled.div`
  padding: 24px;
  border-bottom: 1px solid #27272a;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const VitalStat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const VitalLabel = styled.div`
  font-size: 10px;
  color: #a1a1aa;
  text-transform: uppercase;
`;

const VitalValue = styled.div`
  font-size: 14px;
  color: #fff;
  font-family: monospace;
`;

const QueryEngineForm = styled.form`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 10px;
  color: #a1a1aa;
  text-transform: uppercase;
`;

const Input = styled.input`
  background: #18181b;
  border: 1px solid #27272a;
  color: #fff;
  padding: 10px;
  font-family: monospace;
  font-size: 12px;
  outline: none;
  transition: border-color 0.2s;
  &:focus { border-color: #52525b; }
`;

const CheckboxGroup = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #a1a1aa;
  cursor: pointer;
`;

const ExecuteBtn = styled.button`
  margin-top: auto;
  background: #fff;
  color: #000;
  border: none;
  padding: 12px;
  font-size: 12px;
  text-transform: uppercase;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background 0.2s;
  &:hover { background: #e4e4e7; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const MainContent = styled.main`
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 0;
`;

const TableContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  background: #000;
  position: relative;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  table-layout: fixed;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 24px;
  color: #a1a1aa;
  text-transform: uppercase;
  font-size: 10px;
  border-bottom: 1px solid #27272a;
  background: #09090b;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const Td = styled.td`
  padding: 12px 24px;
  border-bottom: 1px solid #18181b;
  color: #d4d4d8;
  white-space: nowrap;
`;

const TdPayload = styled.td`
  padding: 12px 24px;
  border-bottom: 1px solid #18181b;
  color: #d4d4d8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
`;

const TxId = styled.span`
  color: #fff;
  font-family: monospace;
`;

const AgentAlias = styled.span`
  color: #06b6d4;
  font-family: monospace;
`;

const SourceBadge = styled.span<{ $source: string }>`
  font-size: 10px;
  padding: 2px 6px;
  background: ${p => p.$source === 'HOT_WAL' ? 'rgba(255, 179, 0, 0.1)' : 'rgba(6, 182, 212, 0.1)'};
  color: ${p => p.$source === 'HOT_WAL' ? '#ffb300' : '#06b6d4'};
  border: 1px solid ${p => p.$source === 'HOT_WAL' ? '#ffb300' : '#06b6d4'};
`;

const scanAnimation = keyframes`
  0% { transform: translateY(0); }
  100% { transform: translateY(100vh); }
`;

const ScannerLine = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #fff;
  box-shadow: 0 0 20px #fff;
  animation: ${scanAnimation} 1.5s linear infinite;
  z-index: 5;
`;

const ScanningOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: monospace;
  color: #fff;
  letter-spacing: 2px;
  background: rgba(0, 0, 0, 0.5);
  z-index: 6;
`;

const Spinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid #000;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const ALIAS_DICT: Record<string, string> = {
  // Dictionary implementation could dynamically pull from Zustand or context
};

function resolveAlias(hex: string) {
  return ALIAS_DICT[hex] || `Agent-${hex.substring(0, 6)}`;
}

export default function VaultClientLayout({ telemetry }: { telemetry: any }) {
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState<any[]>([]);
  const [hasQueried, setHasQueried] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await executeUnifiedSearch({
        query: formData.get('query') as string,
        namespace: formData.get('namespace') as string,
        include_wal: formData.get('include_wal') === 'on'
      });
      if (res.success && res.data) {
        setResults(res.data);
      }
      setHasQueried(true);
    });
  };

  return (
    <LayoutContainer>
      <Sidebar>
        <SidebarHeader>
          <Title>Vault Inspector</Title>
          <Subtitle>Unified Vector & WAL Forensics</Subtitle>
        </SidebarHeader>

        <VitalsPanel>
          <VitalStat>
            <VitalLabel>Total Vectors</VitalLabel>
            <VitalValue>{telemetry.total_vectors.toLocaleString()}</VitalValue>
          </VitalStat>
          <VitalStat>
            <VitalLabel>Index Size (MB)</VitalLabel>
            <VitalValue>{telemetry.index_size_mb.toFixed(1)}</VitalValue>
          </VitalStat>
          <VitalStat>
            <VitalLabel>Pending WAL Tx</VitalLabel>
            <VitalValue>{telemetry.wal_pending_count}</VitalValue>
          </VitalStat>
          <VitalStat>
            <VitalLabel>Densest Namespace</VitalLabel>
            <VitalValue>{telemetry.densest_namespace}</VitalValue>
          </VitalStat>
        </VitalsPanel>

        <QueryEngineForm onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Semantic Query</Label>
            <Input name="query" placeholder="e.g. Memory violation trace..." required />
          </FormGroup>
          <FormGroup>
            <Label>Namespace</Label>
            <Input name="namespace" defaultValue="core_cognition_stream" />
          </FormGroup>
          <CheckboxGroup>
            <input type="checkbox" name="include_wal" defaultChecked />
            Include Hot WAL
          </CheckboxGroup>

          <ExecuteBtn type="submit" disabled={isPending}>
            {isPending ? <Spinner /> : 'Execute Query'}
          </ExecuteBtn>
        </QueryEngineForm>
      </Sidebar>

      <MainContent>
        <DistributionRibbon results={results} />
        
        <TableContainer>
          {isPending && (
            <>
              <ScannerLine />
              <ScanningOverlay>[ INTERROGATING VECTORS & WAL... ]</ScanningOverlay>
            </>
          )}
          <Table>
            <colgroup>
              <col style={{ width: '120px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '100px' }} />
              <col />
            </colgroup>
            <thead>
              <tr>
                <Th>TX_ID</Th>
                <Th>Agent Hex</Th>
                <Th>Score</Th>
                <Th>Source</Th>
                <Th>Payload Data</Th>
              </tr>
            </thead>
            <tbody>
              {results.map((r: any) => (
                <tr key={r.id}>
                  <Td><TxId>0x{r.tx_id.toString(16).padStart(6, '0').toUpperCase()}</TxId></Td>
                  <Td><AgentAlias>{resolveAlias(r.agent_hex)}</AgentAlias></Td>
                  <Td>{r.similarity_score.toFixed(4)}</Td>
                  <Td><SourceBadge $source={r.source}>{r.source}</SourceBadge></Td>
                  <TdPayload>{r.payload}</TdPayload>
                </tr>
              ))}
            </tbody>
          </Table>
          {!isPending && hasQueried && results.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: '#52525b', fontSize: 12, marginTop: 40, fontFamily: 'monospace' }}>
              NO VECTORS OR WAL FRAGMENTS FOUND.
            </div>
          )}
        </TableContainer>
      </MainContent>
    </LayoutContainer>
  );
}
