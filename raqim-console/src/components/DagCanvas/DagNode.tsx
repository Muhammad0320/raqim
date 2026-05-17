import { Handle, Position, NodeProps } from '@xyflow/react';
import { UiThought } from '../../lib/store/useSwarmStore';
import styled from 'styled-components';

export interface TimelineNode {
    tx_id: number;
    timestamp: string;
    agent_status: string;
    payload_preview: string;
}

const NodeWrapper = styled.div<{ $isFuture: boolean; $glow: string; $borderCol: string }>`
  background-color: #18181b;
  border: 1px solid ${props => props.$borderCol};
  padding: 12px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 224px;
  box-shadow: ${props => props.$glow};
  transition: all 0.3s;
  
  ${props => props.$isFuture && `
    opacity: 0.3;
    filter: grayscale(100%);
  `}
`;

const NodeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #27272a;
  padding-bottom: 6px;
  margin-bottom: 4px;
`;

const DisplayId = styled.span<{ $color: string }>`
  font-family: monospace;
  font-size: 10px;
  font-weight: bold;
  letter-spacing: 0.1em;
  color: ${props => props.$color};
`;

const IconSpan = styled.span<{ $color: string }>`
  font-size: 14px;
  color: ${props => props.$color};
`;

const PayloadPreview = styled.span`
  font-family: monospace;
  font-size: 12px;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const NodeFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
`;

const AgentStatus = styled.span`
  font-family: monospace;
  font-size: 10px;
  color: #d4d4d8;
  font-weight: bold;
  background-color: rgba(39, 39, 42, 0.5);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(63, 63, 70, 0.5);
`;

const Timestamp = styled.span`
  font-family: monospace;
  font-size: 9px;
  color: #52525b;
`;

const CustomHandle = styled(Handle)`
  width: 6px;
  height: 16px;
  border-radius: 0;
  background-color: #3f3f46;
  border: 0;
  
  &.react-flow__handle-left {
    left: -4px;
  }
  
  &.react-flow__handle-right {
    right: -4px;
  }
`;

export function DagNode({ data }: NodeProps) {
  const thought = data.thought as UiThought;
  const isFuture = data.isFuture as boolean;
  const isActive = data.isActive as boolean;

  // Derive TimelineNode from UiThought
  const nodeData: TimelineNode = {
      tx_id: thought.tx_id,
      timestamp: new Date().toISOString().split('T')[1].substring(0, 12), // mock timestamp
      agent_status: thought.status === 'REJECTED' ? 'AegisInterdiction' : (thought.is_a2a_query ? 'NetworkSync' : 'Reasoning'),
      payload_preview: thought.intent_path
  };

  const displayId = "#" + nodeData.tx_id;
  
  let statusColor = '#00f3ff'; // cyan
  let icon = 'memory';
  
  if (nodeData.agent_status === 'AegisInterdiction') {
    statusColor = '#ff2a2a'; // red
    icon = 'gpp_bad';
  } else if (nodeData.agent_status === 'NetworkSync') {
    statusColor = '#ffb300'; // amber
    icon = 'lan';
  }

  // The physics of time
  const glow = isActive ? `0 0 20px ${statusColor}` : 'none';
  const borderCol = isActive ? statusColor : (isFuture ? '#27272a' : '#3f3f46');
  
  return (
    <NodeWrapper $isFuture={isFuture} $glow={glow} $borderCol={borderCol}>
      <CustomHandle type="target" position={Position.Left} />
      
      <NodeHeader>
          <DisplayId $color={statusColor}>{displayId}</DisplayId>
          <IconSpan className="material-symbols-outlined" $color={statusColor}>{icon}</IconSpan>
      </NodeHeader>
      
      <PayloadPreview>{nodeData.payload_preview}</PayloadPreview>
      
      <NodeFooter>
         <AgentStatus>{nodeData.agent_status}</AgentStatus>
         <Timestamp>{nodeData.timestamp}</Timestamp>
      </NodeFooter>
      
      <CustomHandle type="source" position={Position.Right} />
    </NodeWrapper>
  );
}
