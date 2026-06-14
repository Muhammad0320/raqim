import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
import styled, { keyframes } from 'styled-components';
import { A2aEdgeData } from '../store/topologyStore';

const dash = keyframes`
  to {
    stroke-dashoffset: -20;
  }
`;

const AnimatedPath = styled.path`
  stroke: #d946ef;
  stroke-width: 2.5;
  fill: none;
  stroke-dasharray: 8 6;
  animation: ${dash} 0.8s linear infinite;
  filter: drop-shadow(0 0 4px rgba(217, 70, 239, 0.8));
`;

const GlassBadge = styled.div`
  position: absolute;
  transform: translate(-50%, -50%);
  background: rgba(9, 9, 11, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(217, 70, 239, 0.4);
  color: #fafafa;
  padding: 4px 10px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 10px;
  pointer-events: none;
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
`;

const A2aEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<A2aEdgeData>) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const payload = data?.question_payload || '';
  const truncatedPayload = payload.length > 20 ? `${payload.substring(0, 20)}...` : payload;

  return (
    <>
      <AnimatedPath d={edgePath} id={id} className="react-flow__edge-path" />
      <EdgeLabelRenderer>
        <GlassBadge
          style={{
            left: labelX,
            top: labelY,
          }}
        >
          {truncatedPayload || 'A2A MSG'}
        </GlassBadge>
      </EdgeLabelRenderer>
    </>
  );
};

export default A2aEdge;
