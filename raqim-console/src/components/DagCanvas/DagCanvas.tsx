'use client';
import { useMemo } from 'react';
import { ReactFlow, Background, Controls, Node, Edge, BackgroundVariant, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useSwarmStore } from '../../lib/store/useSwarmStore';
import { DagNode } from './DagNode';

const nodeTypes = {
  thought: DagNode,
};

export function DagCanvas() {
  const { thoughts, thoughtOrder, activeTxId } = useSwarmStore();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useMemo(() => {
    let newNodes: Node[] = [];
    let newEdges: Edge[] = [];
    
    const activeIndex = activeTxId ? thoughtOrder.indexOf(activeTxId) : thoughtOrder.length - 1;
    const isScrubbing = activeTxId !== null && activeIndex < thoughtOrder.length - 1;

    let colIndex = 0;
    let rowIndex = 0;
    const NODES_PER_ROW = 5;

    thoughtOrder.forEach((txId, i) => {
      const thought = thoughts[txId];
      if (!thought) return;

      const isFuture = isScrubbing && i > activeIndex;
      const isActive = activeTxId === txId;
      
      colIndex = i % NODES_PER_ROW;
      rowIndex = Math.floor(i / NODES_PER_ROW);

      const xOffset = colIndex * 300 + 50;
      let yOffset = rowIndex * 150 + 100;
      
      if (thought.parent_tx_id) {
         yOffset += thought.is_a2a_query ? -50 : 50;
      }

      newNodes.push({
        id: txId.toString(),
        type: 'thought',
        position: { x: xOffset, y: yOffset },
        data: { thought, isFuture, isActive },
      });

      if (thought.parent_tx_id && thoughts[thought.parent_tx_id]) {
        newEdges.push({
          id: `e-${thought.parent_tx_id}-${txId}`,
          source: thought.parent_tx_id.toString(),
          target: txId.toString(),
          animated: thought.status === 'PENDING',
          style: { stroke: isFuture ? '#27272a' : '#00f3ff', strokeWidth: isActive ? 3 : 1.5 }
        });
      } else if (i > 0 && !thought.parent_tx_id) {
         const prevTxId = thoughtOrder[i - 1];
         newEdges.push({
          id: `e-seq-${prevTxId}-${txId}`,
          source: prevTxId.toString(),
          target: txId.toString(),
          animated: false,
          style: { stroke: isFuture ? '#18181b' : '#3f3f46', strokeWidth: 1.5, strokeDasharray: '4 4' }
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [thoughts, thoughtOrder, activeTxId, setNodes, setEdges]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background gap={24} size={1} color="#27272a" variant={BackgroundVariant.Dots} />
        <Controls className="bg-zinc-900 border-zinc-800 fill-zinc-400" showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
