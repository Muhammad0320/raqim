import { Handle, Position, NodeProps } from '@xyflow/react';
import { UiThought } from '../../lib/store/useSwarmStore';

export interface TimelineNode {
    tx_id: number;
    timestamp: string;
    action_type: "THOUGHT" | "NETWORK_RECV" | "AEGIS_BLOCK";
    payload_preview: string;
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
      payload_preview: thought.intent_path
  };

  const displayId = "0x" + nodeData.tx_id.toString().padStart(8, '0').toUpperCase();
  
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
      className={`bg-zinc-900 border p-3 rounded-md flex flex-col gap-1.5 w-56 ${opacity} transition-all duration-300`}
      style={{ 
        borderColor: borderCol,
        boxShadow: glow 
      }}
    >
      <Handle type="target" position={Position.Left} className="w-1.5 h-4 rounded-none bg-zinc-700 border-0 !left-[-4px]" />
      
      <div className="flex justify-between items-center border-b border-zinc-800 pb-1.5 mb-1">
          <span className="font-mono text-[10px] font-bold tracking-widest" style={{ color: statusColor }}>{displayId}</span>
          <span className="material-symbols-outlined text-[14px]" style={{ color: statusColor }}>{icon}</span>
      </div>
      
      <span className="font-mono text-xs text-white truncate">{nodeData.payload_preview}</span>
      
      <div className="flex justify-between items-center mt-1">
         <span className="font-mono text-[9px] text-zinc-500 uppercase">{nodeData.action_type}</span>
         <span className="font-mono text-[9px] text-zinc-600">{nodeData.timestamp}</span>
      </div>
      
      <Handle type="source" position={Position.Right} className="w-1.5 h-4 rounded-none bg-zinc-700 border-0 !right-[-4px]" />
    </div>
  );
}
