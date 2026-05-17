"use client";
import React, { useState, useTransition } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useSwarmStore } from '../../lib/store/useSwarmStore';
import { executeTimeTravel } from '../../actions/temporal';

const DrawerContainer = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 0;
  right: 0;
  width: 320px;
  height: 100%;
  background-color: rgba(9, 9, 11, 0.95);
  border-left: 1px solid #27272a;
  backdrop-filter: blur(10px);
  transform: translateX(${props => props.$isOpen ? '0' : '100%'});
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  z-index: 10;
`;

const Header = styled.div`
  padding: 16px;
  border-bottom: 1px solid #27272a;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  font-family: monospace;
  font-size: 12px;
  color: #ffffff;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #71717a;
  font-family: monospace;
  cursor: pointer;
  
  &:hover {
    color: #ffffff;
  }
`;

const Content = styled.div`
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Label = styled.label`
  font-family: monospace;
  font-size: 10px;
  color: #71717a;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  display: block;
  margin-bottom: 8px;
`;

const InfoBox = styled.div`
  background-color: #18181b;
  border: 1px solid #27272a;
  padding: 12px;
  border-radius: 2px;
  font-family: monospace;
  font-size: 11px;
  color: #ffffff;
`;

const SelectBox = styled.select`
  width: 100%;
  background-color: #18181b;
  border: 1px solid #27272a;
  color: #ffffff;
  font-family: monospace;
  font-size: 12px;
  padding: 8px 12px;
  border-radius: 2px;
  outline: none;
  margin-bottom: 16px;

  &:focus {
    border-color: #3f3f46;
  }
`;

const flashAnimation = keyframes`
  0% { opacity: 1; color: #ffb300; background-color: rgba(255, 179, 0, 0.2); }
  50% { opacity: 0.5; color: #ffffff; background-color: #18181b; }
  100% { opacity: 1; color: #ffb300; background-color: rgba(255, 179, 0, 0.2); }
`;

const ExecuteButton = styled.button<{ $isLoading: boolean }>`
  width: 100%;
  padding: 12px;
  background-color: #ffffff;
  color: #000000;
  border: none;
  border-radius: 2px;
  font-family: monospace;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: auto;

  &:hover:not(:disabled) {
    background-color: #e4e4e7;
  }

  ${props => props.$isLoading && css`
    animation: ${flashAnimation} 0.5s infinite;
    border: 1px solid #ffb300;
    pointer-events: none;
  `}
`;

const ToggleDrawerButton = styled.button`
  position: absolute;
  bottom: 24px;
  right: 24px;
  background-color: #18181b;
  color: #ffffff;
  border: 1px solid #27272a;
  padding: 8px 16px;
  font-family: monospace;
  font-size: 11px;
  border-radius: 2px;
  cursor: pointer;
  z-index: 5;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);

  &:hover {
    background-color: #27272a;
    border-color: #3f3f46;
  }
`;

export function RealityForkModal() {
  const { activeTxId, thoughts, isForking, setIsForking } = useSwarmStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [forkType, setForkType] = useState('XOR');

  const activeThought = activeTxId ? thoughts[activeTxId] : null;

  const handleExecute = () => {
    if (!activeThought) return;

    startTransition(async () => {
      try {
        await executeTimeTravel({
          agent_hex: activeThought.agent_hex,
          target_tx_id: activeThought.tx_id,
          fork_config: { type: forkType }
        });
        
        setIsForking(true);
        setIsOpen(false);
      } catch (err) {
        console.error("Fork failed", err);
      }
    });
  };

  return (
    <>
      {!isOpen && !isForking && (
        <ToggleDrawerButton onClick={() => setIsOpen(true)}>
          OPEN FORK MENU
        </ToggleDrawerButton>
      )}

      <DrawerContainer $isOpen={isOpen}>
        <Header>
          <Title>Reality Fork Configuration</Title>
          <CloseButton onClick={() => setIsOpen(false)}>[X]</CloseButton>
        </Header>

        <Content>
          <div>
            <Label>Target Transaction</Label>
            <InfoBox>
              {activeThought ? `TX: ${activeThought.tx_id}` : 'NONE SELECTED'}
            </InfoBox>
          </div>

          <div>
            <Label>Target Agent</Label>
            <InfoBox>
              {activeThought ? activeThought.agent_hex : 'NONE SELECTED'}
            </InfoBox>
          </div>

          <div>
            <Label>Fork Type</Label>
            <SelectBox value={forkType} onChange={e => setForkType(e.target.value)}>
              <option value="XOR">XOR (Exclusive Divergence)</option>
              <option value="COPY">COPY (Parallel Reality)</option>
            </SelectBox>
          </div>

          <ExecuteButton 
            $isLoading={isPending} 
            onClick={handleExecute}
            disabled={!activeThought || isForking}
          >
            {isPending ? '[ REBUILDING WASI CONTEXT... ]' : 'Execute Fork (XOR)'}
          </ExecuteButton>
        </Content>
      </DrawerContainer>
    </>
  );
}
