"use client";
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useSwarmStore } from '../../lib/store/useSwarmStore';

const DeckContainer = styled.div`
  height: 80px;
  width: 100%;
  background-color: #09090b;
  border-top: 1px solid #27272a;
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 24px;
  z-index: 20;
`;

const ControlsGroup = styled.div`
  display: flex;
  gap: 4px;
`;

const StepButton = styled.button`
  background-color: #18181b;
  border: 1px solid #27272a;
  color: #a1a1aa;
  font-family: monospace;
  font-size: 10px;
  padding: 8px 12px;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.1s;

  &:hover:not(:disabled) {
    background-color: #27272a;
    color: #ffffff;
    border-color: #3f3f46;
  }

  &:active:not(:disabled) {
    background-color: #3f3f46;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const ScrubberWrapper = styled.div`
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const InfoBar = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-family: monospace;
  font-size: 10px;
  color: #71717a;
`;

const TxInfo = styled.span`
  color: #ffffff;
`;

const SliderTrack = styled.div`
  width: 100%;
  height: 4px;
  background-color: #27272a;
  border-radius: 2px;
  position: relative;
  cursor: pointer;
`;

const SliderFill = styled.div<{ $percent: number }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: ${props => props.$percent}%;
  background-color: #ffffff;
  border-radius: 2px;
`;

const SliderKnob = styled.div<{ $percent: number }>`
  position: absolute;
  top: 50%;
  left: ${props => props.$percent}%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background-color: #ffffff;
  border: 2px solid #09090b;
  border-radius: 50%;
  cursor: grab;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);

  &:active {
    cursor: grabbing;
    transform: translate(-50%, -50%) scale(1.2);
  }
`;

interface ScrubberDeckProps {
  selectedAgentHex: string;
}

export function ScrubberDeck({ selectedAgentHex }: ScrubberDeckProps) {
  const { thoughts, thoughtOrder, activeTxId, setActiveTxId } = useSwarmStore();

  const timeline = useMemo(() => {
    if (!selectedAgentHex) return thoughtOrder;
    return thoughtOrder.filter(id => thoughts[id]?.agent_hex === selectedAgentHex);
  }, [thoughtOrder, thoughts, selectedAgentHex]);

  const currentIndex = useMemo(() => {
    if (!activeTxId) return timeline.length > 0 ? timeline.length - 1 : 0;
    const idx = timeline.indexOf(activeTxId);
    return idx === -1 ? timeline.length - 1 : idx;
  }, [timeline, activeTxId]);

  const currentTx = timeline[currentIndex] || null;
  const percent = timeline.length > 1 ? (currentIndex / (timeline.length - 1)) * 100 : 100;

  const handleStep = (step: number) => {
    let nextIndex = currentIndex + step;
    if (nextIndex < 0) nextIndex = 0;
    if (nextIndex >= timeline.length) nextIndex = timeline.length - 1;
    
    const nextTxId = timeline[nextIndex];
    if (nextTxId !== undefined) {
      setActiveTxId(nextTxId);
    }
  };

  const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedPercent = x / rect.width;
    
    let targetIndex = Math.round(clickedPercent * (timeline.length - 1));
    if (targetIndex < 0) targetIndex = 0;
    if (targetIndex >= timeline.length) targetIndex = timeline.length - 1;

    const nextTxId = timeline[targetIndex];
    if (nextTxId !== undefined) {
      setActiveTxId(nextTxId);
    }
  };

  return (
    <DeckContainer>
      <ControlsGroup>
        <StepButton onClick={() => handleStep(-100)} disabled={currentIndex <= 0}>-100</StepButton>
        <StepButton onClick={() => handleStep(-10)} disabled={currentIndex <= 0}>-10</StepButton>
        <StepButton onClick={() => handleStep(-1)} disabled={currentIndex <= 0}>-1</StepButton>
      </ControlsGroup>

      <ScrubberWrapper>
        <InfoBar>
          <span>MIN_TX: {timeline[0] || 'NONE'}</span>
          {currentTx ? (
            <TxInfo>ACTIVE_TX: [{currentTx}] {thoughts[currentTx]?.status}</TxInfo>
          ) : (
            <span>AWAITING SIGNAL...</span>
          )}
          <span>MAX_TX: {timeline[timeline.length - 1] || 'NONE'}</span>
        </InfoBar>
        
        <SliderTrack onClick={handleSliderClick}>
          <SliderFill $percent={percent} />
          <SliderKnob $percent={percent} />
        </SliderTrack>
      </ScrubberWrapper>

      <ControlsGroup>
        <StepButton onClick={() => handleStep(1)} disabled={currentIndex >= timeline.length - 1}>+1</StepButton>
        <StepButton onClick={() => handleStep(10)} disabled={currentIndex >= timeline.length - 1}>+10</StepButton>
        <StepButton onClick={() => handleStep(100)} disabled={currentIndex >= timeline.length - 1}>+100</StepButton>
      </ControlsGroup>
    </DeckContainer>
  );
}
