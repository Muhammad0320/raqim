import React, { memo, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import styled, { keyframes, css } from 'styled-components';
import { motion, useAnimation } from 'framer-motion';
import { AgentData } from '../store/topologyStore';

const pulseRed = keyframes`
  0% { border-color: #ef4444; box-shadow: 0 0 0px #ef4444; }
  50% { border-color: #ff7f7f; box-shadow: 0 0 15px #ef4444; }
  100% { border-color: #ef4444; box-shadow: 0 0 0px #ef4444; }
`;

const NodeContainer = styled(motion.div)<{ $isQuarantined: boolean }>`
  background-color: #09090b;
  border: 1px solid #27272a;
  border-radius: 4px;
  width: 180px;
  color: #fff;
  font-family: 'Inter', monospace;
  position: relative;
  overflow: hidden;
  
  ${props => props.$isQuarantined && css`
    animation: ${pulseRed} 1.5s infinite;
  `}
`;

const TopBar = styled.div`
  background-color: #18181b;
  padding: 4px 8px;
  font-size: 10px;
  text-transform: uppercase;
  color: #a1a1aa;
  border-bottom: 1px solid #27272a;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Body = styled.div`
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Alias = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #fafafa;
`;

const Hex = styled.div`
  font-size: 11px;
  color: #52525b;
  font-family: monospace;
`;

const StatusDot = styled.div<{ $status: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: ${props => props.$status === 'Quarantined' ? '#ef4444' : '#10b981'};
`;

const AgentNode = ({ data }: NodeProps<{ data: AgentData }>) => {
  const controls = useAnimation();

  useEffect(() => {
    if (data.status !== 'Quarantined') {
      controls.start({
        borderColor: ['#06b6d4', '#27272a'],
        transition: { duration: 0.5, ease: "easeOut" }
      });
    }
  }, [data.lastPulse, data.status, controls]);

  return (
    <NodeContainer
      $isQuarantined={data.status === 'Quarantined'}
      animate={controls}
      initial={{ borderColor: '#27272a' }}
    >
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      <TopBar>
        <span>{data.namespace}</span>
        <StatusDot $status={data.status} />
      </TopBar>
      <Body>
        <Alias>{data.alias}</Alias>
        <Hex>{data.hex.substring(0, 8)}...</Hex>
      </Body>
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
    </NodeContainer>
  );
};

export default memo(AgentNode);
