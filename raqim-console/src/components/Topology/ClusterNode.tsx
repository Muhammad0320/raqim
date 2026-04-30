import { Handle, Position } from '@xyflow/react';
import { useSwarmStore } from '../../lib/store/useSwarmStore';

export function ClusterNode({ id, data }: { id: string; data: any }) {
  const childrenCount = useSwarmStore(state => 
    state.topologyNodes.filter(n => n.parentId === id).length
  );

  return (
    <div className="w-full h-full relative group">
      {/* 4 Corner Accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-outline-variant/30 rounded-tl-lg"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-outline-variant/30 rounded-tr-lg"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-outline-variant/30 rounded-bl-lg"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-outline-variant/30 rounded-br-lg"></div>

      <div className="absolute top-0 left-4 bg-zinc-900/90 px-3 py-1 rounded-b-sm border-b border-l border-r border-zinc-800 backdrop-blur-md shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
         <div className="flex items-center gap-2">
           <span className="material-symbols-outlined text-[10px] text-tertiary">folder_open</span>
           <span className="font-mono text-[9px] text-tertiary uppercase tracking-widest">{data.label}</span>
         </div>
      </div>
      
      {/* Empty State Placeholder */}
      {childrenCount === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="font-mono text-[10px] text-zinc-700 uppercase tracking-[0.2em] animate-pulse">
            0 Nodes Active
          </span>
        </div>
      )}

      {/* Invisible handles for routing */}
      <Handle type="target" position={Position.Top} className="opacity-0 pointer-events-none w-full h-full !top-0 !left-0 !transform-none !rounded-none" />
      <Handle type="source" position={Position.Bottom} className="opacity-0 pointer-events-none w-full h-full !top-0 !left-0 !transform-none !rounded-none" />
    </div>
  );
}
