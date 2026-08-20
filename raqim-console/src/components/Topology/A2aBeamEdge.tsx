'use client';

import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  EdgeProps,
} from '@xyflow/react';

export function A2aBeamEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const latency = (data?.latency as number) ?? (data?.latency_ms as number) ?? null;
  const namespace = (data?.namespace as string) || '';
  const isBeamActive = latency !== null;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          strokeWidth: isBeamActive ? 2.5 : 1,
          stroke: isBeamActive ? '#00f3ff' : '#334155',
          strokeDasharray: isBeamActive ? '6,4' : undefined,
          filter: isBeamActive ? 'drop-shadow(0 0 8px #00f3ff)' : undefined,
          animation: isBeamActive ? 'dash 1s linear infinite' : undefined,
          transition: 'all 0.3s ease',
          ...style,
        }}
      />

      {isBeamActive && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan bg-[#050914]/95 border border-cyan-400 text-cyan-300 text-[9px] font-mono px-2 py-0.5 rounded-xs shadow-[0_0_12px_rgba(0,243,255,0.4)] flex items-center gap-1 font-bold select-none animate-pulse"
          >
            <span>⚡</span>
            <span>{latency}ms</span>
            {namespace && <span className="text-slate-400 text-[8px]">| {namespace}</span>}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
