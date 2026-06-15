'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { MainLayout } from '../Layout/MainLayout';
import { DagCanvas } from '../DagCanvas/DagCanvas';
import { ScrubberDeck } from './ScrubberDeck';
import { PhantomTerminal } from './PhantomTerminal';
import { RealityForkModal } from './RealityForkModal';
import { useSwarmStore } from '../../lib/store/useSwarmStore';
import { useSwarmStream } from '../../lib/hooks/useSwarmStream';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: #09090b;
  box-sizing: border-box;
  font-family: monospace;
`;

const TopBar = styled.div`
  height: 60px;
  flex-shrink: 0;
  border-bottom: 1px solid #27272a;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #050505;
  box-sizing: border-box;
`;

const TopBarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const TargetLabel = styled.span`
  font-size: 9px;
  color: #71717a;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-right: 12px;
`;

const SelectBox = styled.select`
  background-color: #050505;
  border: 1px solid #27272a;
  color: #ffffff;
  font-family: monospace;
  font-size: 11px;
  padding: 6px 12px;
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  
  &:hover {
    border-color: #ffffff;
  }
`;

const TopBarRight = styled.div`
  display: flex;
  align-items: center;
`;

const StatusBadge = styled.div<{ $isForking: boolean }>`
  background-color: ${props => props.$isForking ? '#100a00' : '#050505'};
  color: ${props => props.$isForking ? '#ffb300' : '#ffffff'};
  border: 1px solid ${props => props.$isForking ? '#ffb300' : '#27272a'};
  padding: 6px 16px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusDot = styled.span<{ $isForking: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: ${props => props.$isForking ? '#ffb300' : '#ffffff'};
  animation: pulse 1.5s infinite;

  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
`;

const MainStage = styled.div`
  height: calc(100vh - 140px); /* Exactly 60px top bar + 80px scrubber */
  display: flex;
  width: 100%;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
`;

const DagContainer = styled(motion.div)`
  height: 100%;
  position: relative;
  overflow: hidden;
`;

const TerminalContainer = styled(motion.div)`
  height: 100%;
  overflow: hidden;
`;

interface TemporalClientLayoutProps {
  agentAliases: Record<string, string>;
}

export function TemporalClientLayout({ agentAliases }: TemporalClientLayoutProps) {
  useSwarmStream(); // Keep sync stream active
  const { isForking } = useSwarmStore();
  const [selectedAgentHex, setSelectedAgentHex] = useState<string>('');

  const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAgentHex(e.target.value);
  };

  return (
    <MainLayout title="Temporal Router">
      <PageContainer>
        <TopBar>
          <TopBarLeft>
            <div>
              <TargetLabel>Target Agent:</TargetLabel>
              <SelectBox value={selectedAgentHex} onChange={handleAgentChange}>
                <option value="">GLOBAL TIMELINE</option>
                {Object.entries(agentAliases).map(([hex, alias]) => (
                  <option key={hex} value={hex}>
                    {alias} ({hex})
                  </option>
                ))}
              </SelectBox>
            </div>
          </TopBarLeft>

          <TopBarRight>
            <StatusBadge $isForking={isForking}>
              <StatusDot $isForking={isForking} />
              {isForking ? 'REALITY_FORK_ACTIVE' : 'SYSTEM_TIMELINE_NOMINAL'}
            </StatusBadge>
          </TopBarRight>
        </TopBar>

        <MainStage>
          <DagContainer
            initial={false}
            animate={{ width: isForking ? '60%' : '100%' }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          >
            <DagCanvas />
          </DagContainer>

          <AnimatePresence>
            {isForking && (
              <TerminalContainer
                initial={{ width: '0%', opacity: 0 }}
                animate={{ width: '40%', opacity: 1 }}
                exit={{ width: '0%', opacity: 0 }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              >
                <PhantomTerminal />
              </TerminalContainer>
            )}
          </AnimatePresence>

          <RealityForkModal />
        </MainStage>

        <ScrubberDeck selectedAgentHex={selectedAgentHex} />
      </PageContainer>
    </MainLayout>
  );
}
