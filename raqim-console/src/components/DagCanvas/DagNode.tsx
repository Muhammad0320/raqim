import { Handle, Position, NodeProps } from '@xyflow/react';
import { UiThought } from '../../lib/store/useSwarmStore';

export interface TimelineNode {
    tx_id: number;
    timestamp: string;
    action_type: "THOUGHT" | "NETWORK_RECV" | "AEGIS_BLOCK";
    payload_preview: string;
    agent_status: "NOMINAL" | "COMPROMISED" | "ISOLATED";
}

export function DagNode({ data }: NodeProps) {
  const thought = data.thought as UiThought;
  const isFuture = data.isFuture as boolean;
  const isActive = data.isActive as boolean;

  // Derive TimelineNode from UiThought
  const nodeData: TimelineNode = {
      tx_id: thought.tx_id,
      timestamp: new Date().toISOString().split('T')[1].substring(0, 12), // mock timestamp
      action_type: thought.status === 'REJECTED' ? 'AEGIS_BLOCK' : (thought.is_a2a_query ? 'NETWORK_RECV' : 'THOUGHT'),
      payload_preview: thought.text || thought.intent_path,
      agent_status: thought.status === 'REJECTED' ? 'COMPROMISED' : (thought.status === 'FORKED' ? 'ISOLATED' : 'NOMINAL')
  };

  // Padded integer, NOT hex.
  const displayId = nodeData.tx_id.toString().padStart(8, '0');
  
  let statusColor = '#00f3ff'; // cyan for THOUGHT
  let icon = 'memory';
  
  if (nodeData.action_type === 'AEGIS_BLOCK') {
    statusColor = '#ff2a2a'; // red
    icon = 'gpp_bad';
  } else if (nodeData.action_type === 'NETWORK_RECV') {
    statusColor = '#ffb300'; // amber
    icon = 'lan';
  }

  // The physics of time
  const opacity = isFuture ? 'opacity-30 grayscale' : 'opacity-100';
  const glow = isActive ? `0 0 20px ${statusColor}` : 'none';
  const borderCol = isActive ? statusColor : (isFuture ? '#27272a' : '#3f3f46');
  
  return (
    <div 
      className={`bg-zinc-950 border p-4 rounded-sm flex flex-col gap-3 w-72 ${opacity} transition-all duration-300 shadow-2xl relative overflow-hidden`}
      style={{ 
        borderColor: borderCol,
        boxShadow: glow 
      }}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
      
      <Handle type="target" position={Position.Left} className="w-1.5 h-6 rounded-none bg-zinc-700 border-0 !left-[-4px]" />
      
      <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]" style={{ color: statusColor }}>{icon}</span>
            <span className="font-mono text-sm font-bold tracking-[0.1em]" style={{ color: statusColor }}>{displayId}</span>
          </div>
          <span 
            className={`font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 border ${
              nodeData.agent_status === 'NOMINAL' ? 'text-[#00f3ff] border-[#00f3ff]/30 bg-[#00f3ff]/10' : 
              (nodeData.agent_status === 'COMPROMISED' ? 'text-[#ff2a2a] border-[#ff2a2a]/30 bg-[#ff2a2a]/10' : 'text-[#ffb300] border-[#ffb300]/30 bg-[#ffb300]/10')
            }`}
          >
            {nodeData.agent_status}
          </span>
      </div>
      
      <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-sm text-zinc-300 font-mono text-[10px] leading-relaxed max-h-24 overflow-y-auto whitespace-pre-wrap">
        {nodeData.payload_preview}
      </div>
      
      <div className="flex justify-between items-center mt-auto pt-2 border-t border-zinc-800/50">
         <span className="font-mono text-[9px] text-zinc-500 uppercase">{nodeData.action_type}</span>
         <span className="font-mono text-[9px] text-zinc-600">{nodeData.timestamp}</span>
      </div>
      
      <Handle type="source" position={Position.Right} className="w-1.5 h-6 rounded-none bg-zinc-700 border-0 !right-[-4px]" />
    </div>
  );
}
