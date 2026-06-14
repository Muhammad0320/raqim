import React, { memo, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import styled from 'styled-components';
import { motion, useAnimation } from 'framer-motion';
import { AgentData } from '../store/topologyStore';

const NodeContainer = styled(motion.div)`
  background-color: #09090b;
  border-width: 1px;
  border-style: solid;
  border-radius: 4px;
  width: 180px;
  color: #ffffff;
  font-family: monospace;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
`;

const TopBar = styled.div`
  background-color: #18181b;
  padding: 6px 10px;
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
  gap: 6px;
`;

const Alias = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #fafafa;
`;

const Hex = styled.div`
  font-size: 11px;
  color: #52525b;
`;

const StatusDot = styled.div<{ $status: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: ${props => props.$status === 'Quarantined' ? '#ef4444' : '#06b6d4'};
  box-shadow: 0 0 6px ${props => props.$status === 'Quarantined' ? '#ef4444' : '#06b6d4'};
`;

const AgentNode = ({ data }: NodeProps<{ data: AgentData }>) => {
  const controls = useAnimation();

  useEffect(() => {
    if (data.status === 'Quarantined') {
      controls.start({
        borderColor: ['#ef4444', '#7f1d1d', '#ef4444'],
        boxShadow: [
          '0 0 8px rgba(239, 68, 68, 0.6)',
          '0 0 2px rgba(239, 68, 68, 0.2)',
          '0 0 8px rgba(239, 68, 68, 0.6)'
        ],
        transition: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' }
      });
    } else {
      // Flash cyan quickly, then fade back to normal border
      controls.start({
        borderColor: ['#06b6d4', '#27272a'],
        boxShadow: ['0 0 12px rgba(6, 182, 212, 0.8)', '0 0 0px rgba(0, 0, 0, 0)'],
        transition: { duration: 0.8, ease: 'easeOut' }
      });
    }
  }, [data.lastPulse, data.status, controls]);

  return (
    <NodeContainer
      animate={controls}
      initial={{ borderColor: '#27272a', boxShadow: '0 0 0px rgba(0,0,0,0)' }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#27272a', width: 6, height: 6 }} />
      <TopBar>
        <span>{data.namespace}</span>
        <StatusDot $status={data.status} />
      </TopBar>
      <Body>
        <Alias>{data.alias}</Alias>
        <Hex>{data.hex.substring(0, 8).toUpperCase()}...</Hex>
      </Body>
      <Handle type="source" position={Position.Bottom} style={{ background: '#27272a', width: 6, height: 6 }} />
    </NodeContainer>
  );
};

export default memo(AgentNode);
