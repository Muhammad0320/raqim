'use client';
import { useCallback, useMemo, useState } from 'react';
import { ReactFlow, Background, Controls, Node, Edge, BackgroundVariant, addEdge, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useSwarmStore } from '../../lib/store/useSwarmStore';
import { DagNode } from './DagNode';
import styles from './DagCanvas.module.css';

const nodeTypes = {
  thought: DagNode,
};

export function DagCanvas() {
  const { thoughts, thoughtOrder, activeTxId } = useSwarmStore();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Derived state: building nodes and edges from the store.
  // In a real high-throughput scenario, graph layout needs careful optimization (e.g. dagre).
  // Here we use a naive horizontal chronological layout.
  useMemo(() => {
    let newNodes: Node[] = [];
    let newEdges: Edge[] = [];
    
    // We only want to visualize up to `activeTxId` if it's set (scrubbing to past)
    const activeIndex = activeTxId ? thoughtOrder.indexOf(activeTxId) : thoughtOrder.length - 1;
    const isScrubbing = activeTxId !== null && activeIndex < thoughtOrder.length - 1;

    let colIndex = 0;
    let rowIndex = 0;
    const NODES_PER_ROW = 4; // Wrap every 4 nodes

    thoughtOrder.forEach((txId, i) => {
      const thought = thoughts[txId];
      if (!thought) return;

      const isFuture = isScrubbing && i > activeIndex;
      
      // Calculate grid position
      colIndex = i % NODES_PER_ROW;
      rowIndex = Math.floor(i / NODES_PER_ROW);

      const xOffset = colIndex * 280 + 50;
      let yOffset = rowIndex * 180 + 100;
      
      // Offset forks slightly vertically
      if (thought.parent_tx_id) {
         yOffset += thought.is_a2a_query ? -40 : 40;
      }

      newNodes.push({
        id: txId.toString(),
        type: 'thought',
        position: { x: xOffset, y: yOffset },
        data: { thought, isFuture },
        className: isFuture ? styles.nodeFuture : '',
      });

      if (thought.parent_tx_id && thoughts[thought.parent_tx_id]) {
        newEdges.push({
          id: `e-${thought.parent_tx_id}-${txId}`,
          source: thought.parent_tx_id.toString(),
          target: txId.toString(),
          animated: thought.status === 'PENDING',
          style: { stroke: isFuture ? '#333' : 'var(--neon-cyan)', strokeWidth: 2 }
        });
      } else if (i > 0 && !thought.parent_tx_id) {
         // Connect to previous sequential thought for continuity if no explicit parent
         const prevTxId = thoughtOrder[i - 1];
         newEdges.push({
          id: `e-seq-${prevTxId}-${txId}`,
          source: prevTxId.toString(),
          target: txId.toString(),
          animated: false,
          style: { stroke: isFuture ? '#222' : 'var(--border-dim)', strokeWidth: 2, strokeDasharray: '4 4' }
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [thoughts, thoughtOrder, activeTxId, setNodes, setEdges]);

  return (
    <div className={styles.canvasContainer}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background gap={24} size={2} color="var(--border-dim)" variant={BackgroundVariant.Dots} />
        <Controls className={styles.controls} showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
