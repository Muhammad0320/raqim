'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import ThreatRadar from './ThreatRadar';
import StdoutLogs from './StdoutLogs';
import ReseedModal from './ReseedModal';

// CSS Grid Brutalist Layout
const GridContainer = styled.div`
  display: grid;
  width: 100vw;
  height: 100vh;
  background-color: #09090b;
  color: #fff;
  font-family: 'Inter', monospace;
  /* 60px Topbar, remaining is split */
  grid-template-rows: 60px 1fr;
  grid-template-columns: 1fr 400px; /* 400px fixed sidebar for stdout logs */
  grid-template-areas:
    "header header"
    "main sidebar";
  overflow: hidden;
`;

const Topbar = styled.header`
  grid-area: header;
  border-bottom: 1px solid #27272a;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
`;

const Title = styled.h1`
  font-size: 16px;
  letter-spacing: 2px;
  font-weight: 600;
  text-transform: uppercase;
`;

const Badge = styled.div`
  color: #06b6d4;
  font-family: monospace;
  font-size: 12px;
  text-shadow: 0 0 8px rgba(6, 182, 212, 0.5);
  border: 1px solid #06b6d4;
  padding: 4px 8px;
  background: rgba(6, 182, 212, 0.1);
  letter-spacing: 1px;
`;

const MainArea = styled.main`
  grid-area: main;
  display: grid;
  grid-template-rows: 1fr 300px; /* Radar expands, Table locked to 300px at bottom */
  border-right: 1px solid #27272a;
  overflow: hidden;
`;

const RadarSection = styled.section`
  border-bottom: 1px solid #27272a;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const BlocklistSection = styled.section`
  display: flex;
  flex-direction: column;
  background: #000;
  overflow: hidden;
`;

const BlocklistHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #27272a;
  background: #18181b;
`;

const BlocklistTitle = styled.div`
  font-size: 12px;
  color: #a1a1aa;
  text-transform: uppercase;
  font-weight: 600;
`;

const BlocklistInput = styled.input`
  background: #09090b;
  border: 1px solid #27272a;
  color: #fff;
  font-family: monospace;
  font-size: 12px;
  padding: 6px 12px;
  width: 300px;
  outline: none;
  transition: border-color 0.2s ease;

  &:focus { 
    border-color: #52525b; 
  }

  &::placeholder {
    color: #52525b;
  }
`;

const BlocklistTable = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const QuarantineItem = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  padding: 12px 0;
  border-bottom: 1px dashed #27272a;
  font-size: 12px;
  align-items: center;
`;

const QHex = styled.span`
  color: #ef4444;
  font-family: monospace;
`;

const QReason = styled.span`
  color: #a1a1aa;
`;

const ReseedBtn = styled.button`
  background: transparent;
  border: 1px solid #52525b;
  color: #fff;
  padding: 6px 12px;
  font-size: 10px;
  cursor: pointer;
  text-transform: uppercase;
  transition: all 0.2s ease;

  &:hover { 
    background: #fafafa; 
    color: #000; 
  }
`;

const Sidebar = styled.aside`
  grid-area: sidebar;
  display: grid;
  grid-template-rows: 1fr; 
  overflow: hidden;
`;

export default function FirewallClientLayout({ metrics, quarantineList }: any) {
  const [search, setSearch] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  // SSE setup logic would hook into useFirewallStore
  React.useEffect(() => {
    // const source = new EventSource('/v1/system/firehose');
    // source.onmessage = (e) => { 
    //    const data = JSON.parse(e.data);
    //    if (data.type === 'AEGIS_ALERT') {
    //       useFirewallStore.getState().addAlert(data.payload);
    //    }
    // }
  }, []);

  const filteredList = quarantineList.filter((q: any) => 
    q.agent_hex.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <GridContainer>
      <Topbar>
        <Title>Aegis Firewall</Title>
        <Badge>[ AEGIS ENFORCEMENT: STRICT ]</Badge>
      </Topbar>
      
      <MainArea>
        <RadarSection>
          <ThreatRadar />
        </RadarSection>
        
        <BlocklistSection>
          <BlocklistHeader>
            <BlocklistTitle>Quarantined Agents ({filteredList.length})</BlocklistTitle>
            <BlocklistInput 
              placeholder="Search by HEX..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </BlocklistHeader>
          <BlocklistTable>
            {filteredList.map((q: any) => (
              <QuarantineItem key={q.agent_hex}>
                <QHex>{q.agent_hex}</QHex>
                <QReason>{q.reason}</QReason>
                <ReseedBtn onClick={() => setSelectedAgent(q.agent_hex)}>
                  Evict / Reseed
                </ReseedBtn>
              </QuarantineItem>
            ))}
          </BlocklistTable>
        </BlocklistSection>
      </MainArea>

      <Sidebar>
        <StdoutLogs />
      </Sidebar>

      {selectedAgent && (
        <ReseedModal 
          agentHex={selectedAgent} 
          onClose={() => setSelectedAgent(null)} 
        />
      )}
    </GridContainer>
  );
}
