import { getBezierPath, BaseEdge, EdgeProps } from '@xyflow/react';

export function A2aEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <g style={{ animation: 'fadeOut 0.8s ease-in forwards' }}>
      <style>
        {`
          @keyframes fadeOut {
            0% { opacity: 1; }
            80% { opacity: 0.8; }
            100% { opacity: 0; }
          }
          @keyframes laserShoot {
            0% { stroke-dashoffset: 1000; }
            100% { stroke-dashoffset: 0; }
          }
        `}
      </style>
      
      {/* Outer Glow Line - Amber */}
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{
          ...style,
          stroke: '#ffb300', // Amber
          strokeWidth: 4,
          filter: 'drop-shadow(0 0 10px rgba(255,179,0,1))',
          strokeDasharray: '1000',
          strokeDashoffset: '1000',
          animation: 'laserShoot 0.3s ease-out forwards'
        }} 
      />
      
      {/* Inner Laser Core */}
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{
          ...style,
          stroke: '#ffffff',
          strokeWidth: 1.5,
          strokeDasharray: '1000',
          strokeDashoffset: '1000',
          animation: 'laserShoot 0.3s ease-out forwards'
        }} 
      />
    </g>
  );
}
