"use client";
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
`;

const TopBar = styled.div`
  height: 60px;
  flex-shrink: 0;
  border-bottom: 1px solid #27272a;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: rgba(9, 9, 11, 0.9);
  backdrop-filter: blur(10px);
  z-index: 20;
`;

const TopBarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
`;

const TopBarRight = styled.div`
  display: flex;
  align-items: center;
`;

const TargetAgentLabel = styled.span`
  font-family: monospace;
  font-size: 10px;
  color: #71717a;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 4px;
  display: block;
`;

const SelectBox = styled.select`
  background-color: #18181b;
  border: 1px solid #3f3f46;
  color: #ffffff;
  font-family: monospace;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;

  &:hover {
    border-color: #a1a1aa;
  }
`;

const StatusBadge = styled.div<{ $isForking: boolean }>`
  background-color: ${props => props.$isForking ? 'rgba(255, 179, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.$isForking ? '#ffb300' : '#ffffff'};
  border: 1px solid ${props => props.$isForking ? 'rgba(255, 179, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)'};
  padding: 6px 16px;
  border-radius: 2px;
  font-size: 10px;
  font-family: monospace;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: ${props => props.$isForking ? '0 0 15px rgba(255, 179, 0, 0.2)' : 'none'};
`;

const StatusDot = styled.span<{ $isForking: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.$isForking ? '#ffb300' : '#ffffff'};
  box-shadow: ${props => props.$isForking ? '0 0 8px rgba(255, 179, 0, 0.8)' : '0 0 8px rgba(255, 255, 255, 0.8)'};
  animation: pulse 2s infinite;

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.4; }
    100% { opacity: 1; }
  }
`;

const MainStage = styled.div`
  flex: 1;
  position: relative;
  display: flex;
  height: calc(100vh - 140px); /* 60px top bar + 80px scrubber */
  overflow: hidden;
`;

const DagContainer = styled(motion.div)`
  height: 100%;
  position: relative;
  border-right: 1px solid #27272a;
`;

const TerminalContainer = styled(motion.div)`
  height: 100%;
  background-color: #09090b;
`;

const GridBackground = styled.div`
  position: absolute;
  inset: 0;
  opacity: 0.03;
  pointer-events: none;
  background-image: radial-gradient(#ffffff 1px, transparent 1px);
  background-size: 20px 20px;
`;

interface TemporalClientLayoutProps {
  agentAliases: Record<string, string>;
}

export function TemporalClientLayout({ agentAliases }: TemporalClientLayoutProps) {
  useSwarmStream();
  const { isForking } = useSwarmStore();
  const [selectedAgentHex, setSelectedAgentHex] = useState<string>("");

  const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAgentHex(e.target.value);
  };

  return (
    <MainLayout title="Temporal Router">
      <PageContainer>
        <TopBar>
          <TopBarLeft>
            <div>
              <TargetAgentLabel>Target Agent</TargetAgentLabel>
              <SelectBox value={selectedAgentHex} onChange={handleAgentChange}>
                <option value="">GLOBAL TIMELINE</option>
                {Object.entries(agentAliases).map(([hex, alias]) => (
                  <option key={hex} value={hex}>{alias} ({hex})</option>
                ))}
              </SelectBox>
            </div>
          </TopBarLeft>

          <TopBarRight>
            <StatusBadge $isForking={isForking}>
              <StatusDot $isForking={isForking} />
              {isForking ? 'FORKED REALITY' : 'MAIN TIMELINE'}
            </StatusBadge>
          </TopBarRight>
        </TopBar>

        <MainStage>
          <GridBackground />
          <DagContainer
            initial={false}
            animate={{ width: isForking ? '60%' : '100%' }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          >
            <DagCanvas />
          </DagContainer>

          <AnimatePresence>
            {isForking && (
              <TerminalContainer
                initial={{ width: '0%', opacity: 0 }}
                animate={{ width: '40%', opacity: 1 }}
                exit={{ width: '0%', opacity: 0 }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
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
