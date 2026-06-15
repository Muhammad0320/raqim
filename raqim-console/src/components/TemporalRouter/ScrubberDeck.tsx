'use client';

import React, { useEffect, useState, useMemo } from 'react';
import styled from 'styled-components';
import { useSwarmStore } from '../../lib/store/useSwarmStore';
import { fetchAgentTimeline, TimelineNode } from '../../actions/admin';

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
  box-sizing: border-box;
  font-family: monospace;
`;

const ControlsGroup = styled.div`
  display: flex;
  gap: 6px;
`;

const StepButton = styled.button`
  background-color: #050505;
  border: 1px solid #27272a;
  color: #ffffff;
  font-family: monospace;
  font-size: 10px;
  padding: 6px 10px;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.1s;

  &:hover:not(:disabled) {
    background-color: #ffffff;
    color: #000000;
    border-color: #ffffff;
  }

  &:disabled {
    opacity: 0.25;
    cursor: not-allowed;
    border-color: #1c1c1f;
    color: #52525b;
  }
`;

const ScrubberWrapper = styled.div`
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  padding-top: 15px; /* Leave space for floating label */
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
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
`;

const FloatingLabel = styled.div<{ $percent: number }>`
  position: absolute;
  left: ${props => props.$percent}%;
  top: -12px;
  transform: translateX(-50%);
  font-size: 9px;
  color: #ffffff;
  white-space: nowrap;
  background-color: #000000;
  border: 1px solid #27272a;
  padding: 2px 6px;
  pointer-events: none;
`;

const TextContainer = styled.div`
  font-size: 10px;
  color: #71717a;
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 6px;
`;

const InertMessage = styled.div`
  flex: 1;
  text-align: center;
  color: #52525b;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: bold;
`;

interface ScrubberDeckProps {
  selectedAgentHex: string;
}

export function ScrubberDeck({ selectedAgentHex }: ScrubberDeckProps) {
  const { activeTxId, setActiveTxId } = useSwarmStore();
  const [timelineNodes, setTimelineNodes] = useState<TimelineNode[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedAgentHex) {
      setTimelineNodes([]);
      setActiveTxId(null);
      return;
    }

    setLoading(true);
    fetchAgentTimeline(selectedAgentHex)
      .then((nodes) => {
        setTimelineNodes(nodes);
        if (nodes.length > 0) {
          // Default to the latest transaction in the timeline
          const latest = nodes[nodes.length - 1];
          setActiveTxId(latest.tx_id);
        } else {
          setActiveTxId(null);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedAgentHex, setActiveTxId]);

  const { minTxId, maxTxId, activeNode, percent } = useMemo(() => {
    if (timelineNodes.length === 0) {
      return { minTxId: 0, maxTxId: 0, activeNode: null, percent: 100 };
    }
    const min = timelineNodes[0].tx_id;
    const max = timelineNodes[timelineNodes.length - 1].tx_id;
    
    // Find closest node to activeTxId, or default to max
    const target = activeTxId ?? max;
    const closest = timelineNodes.reduce((prev, curr) => {
      return Math.abs(curr.tx_id - target) < Math.abs(prev.tx_id - target) ? curr : prev;
    });

    const pct = max > min ? ((closest.tx_id - min) / (max - min)) * 100 : 100;
    return { minTxId: min, maxTxId: max, activeNode: closest, percent: pct };
  }, [timelineNodes, activeTxId]);

  const handleStep = (amount: number) => {
    if (timelineNodes.length === 0 || !activeNode) return;
    const targetVal = activeNode.tx_id + amount;
    
    // Clamp inside timeline bounds
    let clampedVal = targetVal;
    if (clampedVal < minTxId) clampedVal = minTxId;
    if (clampedVal > maxTxId) clampedVal = maxTxId;

    // Find the closest real node
    const closest = timelineNodes.reduce((prev, curr) => {
      return Math.abs(curr.tx_id - clampedVal) < Math.abs(prev.tx_id - clampedVal) ? curr : prev;
    });

    setActiveTxId(closest.tx_id);
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (timelineNodes.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const targetVal = minTxId + pct * (maxTxId - minTxId);

    const closest = timelineNodes.reduce((prev, curr) => {
      return Math.abs(curr.tx_id - targetVal) < Math.abs(prev.tx_id - targetVal) ? curr : prev;
    });

    setActiveTxId(closest.tx_id);
  };

  if (!selectedAgentHex) {
    return (
      <DeckContainer>
        <InertMessage>NO TARGET AGENT SELECTED. TEMPORAL DECK INERT.</InertMessage>
      </DeckContainer>
    );
  }

  if (loading && timelineNodes.length === 0) {
    return (
      <DeckContainer>
        <InertMessage>SCANNING TEMPORAL ENCLAVE ARCHIVES...</InertMessage>
      </DeckContainer>
    );
  }

  return (
    <DeckContainer>
      <ControlsGroup>
        <StepButton onClick={() => handleStep(-100)} disabled={!activeNode || activeNode.tx_id <= minTxId}>-100</StepButton>
        <StepButton onClick={() => handleStep(-10)} disabled={!activeNode || activeNode.tx_id <= minTxId}>-10</StepButton>
        <StepButton onClick={() => handleStep(-1)} disabled={!activeNode || activeNode.tx_id <= minTxId}>-1</StepButton>
      </ControlsGroup>

      <ScrubberWrapper>
        {activeNode && (
          <FloatingLabel $percent={percent}>
            TX_{activeNode.tx_id} [{activeNode.timestamp.split('T')[1]?.substring(0, 8) || activeNode.timestamp}]
          </FloatingLabel>
        )}
        
        <SliderTrack onClick={handleTrackClick}>
          <SliderFill $percent={percent} />
          <SliderKnob $percent={percent} />
        </SliderTrack>

        <TextContainer>
          <span>MIN_TX: {minTxId}</span>
          {activeNode && <span>STATE: {activeNode.agent_status}</span>}
          <span>MAX_TX: {maxTxId}</span>
        </TextContainer>
      </ScrubberWrapper>

      <ControlsGroup>
        <StepButton onClick={() => handleStep(1)} disabled={!activeNode || activeNode.tx_id >= maxTxId}>+1</StepButton>
        <StepButton onClick={() => handleStep(10)} disabled={!activeNode || activeNode.tx_id >= maxTxId}>+10</StepButton>
        <StepButton onClick={() => handleStep(100)} disabled={!activeNode || activeNode.tx_id >= maxTxId}>+100</StepButton>
      </ControlsGroup>
    </DeckContainer>
  );
}
