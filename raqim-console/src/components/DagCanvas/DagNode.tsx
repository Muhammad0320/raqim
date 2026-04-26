import { Handle, Position, NodeProps } from '@xyflow/react';
import { ThoughtCommitted } from '../../lib/store/useSwarmStore';
import styles from './DagCanvas.module.css';

export function DagNode({ data }: NodeProps) {
  const thought = data.thought as ThoughtCommitted;
  const isFuture = data.isFuture as boolean;

  // Truncate tx_id
  const displayId = thought.tx_id.substring(0, 8) + '...' + thought.tx_id.substring(thought.tx_id.length - 4);
  
  let statusColor = 'var(--neon-cyan)';
  if (thought.status === 'FORKED') statusColor = 'var(--neon-amber)';
  if (thought.status === 'REJECTED') statusColor = 'var(--alert-red)';
  if (thought.status === 'PENDING') statusColor = 'var(--text-muted)';
  
  return (
    <div 
      className={`${styles.customNode} ${isFuture ? styles.futureGhost : ''}`}
      style={{ borderColor: statusColor }}
    >
      <Handle type="target" position={Position.Left} className={styles.handle} />
      
      <div className={styles.nodeHeader}>
        <div className={`${styles.nodeAgentId} text-mono`}>{thought.agent_id}</div>
        <div 
          className={styles.statusDot} 
          style={{ backgroundColor: statusColor, boxShadow: `0 0 8px ${statusColor}` }}
        />
      </div>

      <div className={`${styles.nodeTxId} text-mono`}>
        {displayId}
      </div>
      
      <div className={styles.nodeIntent}>
        {thought.intent_path}
      </div>
      
      <Handle type="source" position={Position.Right} className={styles.handle} />
    </div>
  );
}
