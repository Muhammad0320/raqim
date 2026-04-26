import { Handle, Position, NodeProps } from '@xyflow/react';
import { UiThought } from '../../lib/store/useSwarmStore';

export function DagNode({ data }: NodeProps) {
  const thought = data.thought as UiThought;
  const isFuture = data.isFuture as boolean;

  // Format tx_id as hex
  const displayId = "0x" + thought.tx_id.toString().padStart(8, '0').toUpperCase();
  
  let statusColor = 'var(--neon-cyan)';
  let icon = 'memory';
  
  if (thought.status === 'FORKED') {
    statusColor = '#ffb95f'; // tertiary
    icon = 'alt_route';
  } else if (thought.status === 'REJECTED') {
    statusColor = '#ffb4ab'; // error
    icon = 'warning';
  } else if (thought.status === 'PENDING') {
    statusColor = '#8b90a0'; // outline
    icon = 'pending';
  } else {
    statusColor = '#4edea3'; // secondary
    icon = 'check_circle';
  }
  
  return (
    <div 
      className={`bg-surface-container-highest border border-outline-variant/15 p-3 rounded-lg flex flex-col gap-1 w-48 shadow-[0_20px_40px_rgba(0,0,0,0.4)] ${isFuture ? 'opacity-40 grayscale' : ''} hover:border-primary-container/50 transition-colors`}
      style={{ boxShadow: isFuture ? 'none' : `0 4px 20px -5px ${statusColor}20` }}
    >
      <Handle type="target" position={Position.Left} className="w-1.5 h-3 rounded-sm bg-outline-variant/50 border-0 !left-[-6px]" />
      
      <div className="flex justify-between items-center border-b border-outline-variant/10 pb-1 mb-1">
          <span className="font-mono text-[10px]" style={{ color: statusColor }}>{displayId}</span>
          <span className="material-symbols-outlined text-[14px] opacity-80" style={{ color: statusColor }}>{icon}</span>
      </div>
      
      <span className="font-body text-xs text-on-surface truncate font-semibold">{thought.intent_path}</span>
      <span className="font-mono text-[9px] text-on-surface-variant mt-1 opacity-70 truncate">{thought.agent_hex}</span>
      
      <Handle type="source" position={Position.Right} className="w-1.5 h-3 rounded-sm bg-outline-variant/50 border-0 !right-[-6px]" />
    </div>
  );
}
