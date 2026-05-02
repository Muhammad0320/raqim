import React, { useMemo } from 'react';

export interface SearchResult {
    tx_id: number;
    agent_hex: string;
    namespace: string;
    similarity_score: number;
    source: "HOT_WAL" | "LANCEDB";
    payload: string;
    timestamp: string;
}

interface SemanticConstellationProps {
  results: SearchResult[];
  queryText: string;
  hoveredTxId: number | null;
  onHover: (id: number | null) => void;
}

export function SemanticConstellation({ results, queryText, hoveredTxId, onHover }: SemanticConstellationProps) {
  // Generate stable coordinates for nodes based on tx_id so they don't jump around on re-renders
  const nodes = useMemo(() => {
    return results.map(res => {
      // Pseudo-random angle based on tx_id
      const angle = (res.tx_id * 137.5) * (Math.PI / 180);
      
      // Radius inversely proportional to similarity score. 
      // 1.0 = close to center, 0.0 = far from center.
      // Maximum radius is approx 40% of the viewBox to keep it inside.
      const maxRadius = 45;
      const radius = (1 - res.similarity_score) * maxRadius;
      
      const cx = 50 + Math.cos(angle) * radius;
      const cy = 50 + Math.sin(angle) * radius;
      
      return {
        ...res,
        cx,
        cy
      };
    });
  }, [results]);

  return (
    <div className="w-full h-full relative bg-zinc-950 overflow-hidden group">
      {/* Background Grid */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '15px 15px' }}
      ></div>

      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Radar Rings */}
        <circle cx="50" cy="50" r="15" fill="none" stroke="#27272a" strokeWidth="0.2" />
        <circle cx="50" cy="50" r="30" fill="none" stroke="#27272a" strokeWidth="0.2" />
        <circle cx="50" cy="50" r="45" fill="none" stroke="#27272a" strokeWidth="0.2" />
        <line x1="50" y1="5" x2="50" y2="95" stroke="#27272a" strokeWidth="0.2" strokeDasharray="1 1" />
        <line x1="5" y1="50" x2="95" y2="50" stroke="#27272a" strokeWidth="0.2" strokeDasharray="1 1" />

        {/* Connections to Center */}
        {nodes.map(node => (
          <line 
            key={`line-${node.tx_id}`}
            x1="50" y1="50" 
            x2={node.cx} y2={node.cy}
            stroke={hoveredTxId === node.tx_id ? (node.source === 'HOT_WAL' ? '#ffb300' : '#00f3ff') : '#3f3f46'}
            strokeWidth={hoveredTxId === node.tx_id ? 0.3 : 0.1}
            opacity={hoveredTxId === node.tx_id ? 1 : 0.4}
            className="transition-all duration-300"
          />
        ))}

        {/* Orbiting Nodes */}
        {nodes.map(node => {
          const isHovered = hoveredTxId === node.tx_id;
          const baseColor = node.source === 'HOT_WAL' ? '#ffb300' : '#00f3ff';
          
          return (
            <g 
              key={`node-${node.tx_id}`} 
              className="cursor-crosshair transition-transform duration-300 origin-[50px_50px]"
              onMouseEnter={() => onHover(node.tx_id)}
              onMouseLeave={() => onHover(null)}
              style={{ transform: isHovered ? 'scale(1.1)' : 'scale(1)' }}
            >
              {isHovered && (
                <circle 
                  cx={node.cx} 
                  cy={node.cy} 
                  r="3" 
                  fill={baseColor} 
                  opacity="0.2"
                  className="animate-ping"
                />
              )}
              <circle 
                cx={node.cx} 
                cy={node.cy} 
                r={isHovered ? 1.5 : 1} 
                fill={baseColor} 
                stroke={isHovered ? '#ffffff' : 'none'}
                strokeWidth="0.2"
                className="transition-all duration-300 shadow-glow"
              />
              {/* Distance Label visible on hover */}
              {isHovered && (
                <text 
                  x={node.cx + 2} 
                  y={node.cy + 1} 
                  fill="#a1a1aa" 
                  fontSize="2" 
                  fontFamily="monospace"
                  className="pointer-events-none"
                >
                  TX_{node.tx_id} [{node.similarity_score.toFixed(2)}]
                </text>
              )}
            </g>
          );
        })}

        {/* Central Query Node */}
        {queryText ? (
          <g className="origin-center" style={{ animation: 'pulseCenter 2s infinite' }}>
            <circle cx="50" cy="50" r="4" fill="#00f3ff" opacity="0.1" />
            <circle cx="50" cy="50" r="2" fill="#00f3ff" opacity="0.3" />
            <circle cx="50" cy="50" r="0.8" fill="#ffffff" />
          </g>
        ) : (
          <circle cx="50" cy="50" r="0.8" fill="#3f3f46" />
        )}
      </svg>
      <style>
        {`
          @keyframes pulseCenter {
            0% { transform: scale(0.9); opacity: 0.8; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(0.9); opacity: 0.8; }
          }
        `}
      </style>
    </div>
  );
}
