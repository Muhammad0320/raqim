import { Handle, Position } from '@xyflow/react';
import { useMemo } from 'react';

const getAgentColor = (hex: string) => {
  let hash = 0;
  for (let i = 0; i < hex.length; i++) {
    hash = hex.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hues = [180, 300, 120, 45, 210];
  const hue = hues[Math.abs(hash) % hues.length];
  return `hsl(${hue}, 100%, 65%)`;
};

export function AgentNode({ data }: { data: any }) {
  const isPulsing = !!data.pulseTimestamp;
  const color = useMemo(() => getAgentColor(data.agent_hex), [data.agent_hex]);
  
  const hexagonClip = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

  return (
    <div className="relative flex items-center justify-center w-14 h-14 group">
      <style>
        {`
          @keyframes cyanPulse {
            0% { box-shadow: 0 0 5px #00f3ff, 0 0 10px #00f3ff; opacity: 1; transform: scale(1); }
            100% { box-shadow: 0 0 30px #00f3ff, 0 0 60px #00f3ff; opacity: 0; transform: scale(1.5); }
          }
        `}
      </style>

      {/* Pulse effect (unclipped) */}
      {isPulsing && (
        <div 
          className="absolute inset-0 rounded-full z-0"
          style={{ animation: 'cyanPulse 0.5s ease-out forwards' }}
        />
      )}
      
      {/* Core Hexagon */}
      <div 
        className="w-12 h-12 bg-zinc-950 flex flex-col items-center justify-center z-10 transition-colors duration-300"
        style={{ 
          clipPath: hexagonClip,
          backgroundColor: isPulsing ? 'rgba(0,243,255,0.2)' : '#09090b',
        }}
      >
        {/* Hexagon Border Hack since clip-path cuts off borders */}
        <div 
           className="absolute inset-[1px] bg-zinc-950 flex flex-col items-center justify-center z-20"
           style={{ clipPath: hexagonClip }}
        >
          <span className="font-mono text-[8px] font-bold tracking-widest mt-1" style={{ color: isPulsing ? '#00f3ff' : color }}>
            {data.agent_hex.slice(0, 4)}
          </span>
          {isPulsing && <span className="font-mono text-[6px] text-[#00f3ff] mt-0.5">TX {data.lastTx}</span>}
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
      <Handle type="target" position={Position.Top} className="opacity-0" />
      
      {/* Label on hover */}
      <div className="absolute top-16 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-950 border border-zinc-800 px-2 py-1 rounded font-mono text-[9px] text-white whitespace-nowrap z-50 pointer-events-none">
         Agent: {data.agent_hex}
      </div>
    </div>
  );
}
