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
  stroke-width: 2;
  fill: none;
  stroke-dasharray: 10 10;
  animation: ${dash} 1s linear infinite;
`;

const GlassBadge = styled.div`
  position: absolute;
  transform: translate(-50%, -50%);
  background: rgba(9, 9, 11, 0.7);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(217, 70, 239, 0.3);
  color: #e4e4e7;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 10px;
  pointer-events: none;
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
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
          {data?.question_payload || '...'}
        </GlassBadge>
      </EdgeLabelRenderer>
    </>
  );
};

export default A2aEdge;
