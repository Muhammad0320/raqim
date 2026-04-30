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
    <g style={{ animation: 'fadeOut 0.8s ease-out forwards' }}>
      <style>
        {`
          @keyframes fadeOut {
            0% { opacity: 1; stroke-width: 3; }
            100% { opacity: 0; stroke-width: 1; }
          }
          @keyframes dash {
            to { stroke-dashoffset: 0; }
          }
        `}
      </style>
      
      {/* Outer Glow Line */}
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{
          ...style,
          stroke: '#00f3ff', // Neon cyan
          strokeWidth: 4,
          filter: 'drop-shadow(0 0 8px rgba(0,243,255,0.8))',
          strokeDasharray: '5, 5',
          animation: 'dash 1s linear infinite, fadeOut 0.8s ease-out forwards'
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
          animation: 'fadeOut 0.8s ease-out forwards'
        }} 
      />
      
      {/* Traveling Particle */}
      <circle r="3" fill="#fff" style={{ filter: 'drop-shadow(0 0 10px #fff)' }}>
        <animateMotion dur={`${data?.latency || 400}ms`} repeatCount="1" path={edgePath} />
      </circle>
    </g>
  );
}
