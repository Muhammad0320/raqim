import { getBezierPath, BaseEdge, EdgeProps, EdgeLabelRenderer } from '@xyflow/react';

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
      <g style={{ animation: 'edgeFadeOut 2s ease-in forwards' }}>
        <style>
          {`
            @keyframes edgeFadeOut {
              0% { opacity: 1; }
              40% { opacity: 0; }
              100% { opacity: 0; }
            }
            @keyframes laserShoot {
              0% { stroke-dashoffset: 1000; }
              100% { stroke-dashoffset: 0; }
            }
            @keyframes edgePopupFade {
              0% { opacity: 0; transform: scale(0.9); }
              10% { opacity: 1; transform: scale(1); }
              80% { opacity: 1; transform: scale(1); }
              100% { opacity: 0; transform: scale(0.9); }
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
            animation: 'laserShoot 0.4s ease-out forwards'
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
            animation: 'laserShoot 0.4s ease-out forwards'
          }} 
        />
      </g>
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            animation: 'edgePopupFade 2s ease-out forwards',
            pointerEvents: 'none',
          }}
          className="bg-zinc-950/90 border border-[#ffb300]/50 shadow-[0_0_15px_rgba(255,179,0,0.3)] backdrop-blur-sm rounded px-3 py-1.5 z-50 flex items-center gap-3"
        >
          <div className="flex flex-col">
            <span className="font-mono text-[8px] text-[#ffb300] tracking-widest uppercase">A2A Route</span>
            <span className="font-mono text-[9px] text-white">
              {data?.question_payload && (data.question_payload as string).length > 30 
                ? (data.question_payload as string).substring(0, 30) + '...' 
                : (data?.question_payload as string)}
            </span>
          </div>
          <div className="h-4 w-px bg-zinc-800"></div>
          <span className="font-mono text-[10px] text-white font-bold">{data?.latency || 0}ms</span>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
