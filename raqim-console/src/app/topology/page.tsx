'use client';

import React from 'react';
import { MainLayout } from '../../components/Layout/MainLayout';
import { ReactFlowProvider } from '@xyflow/react';
import { TopologyCanvas } from '../../components/TopologyCanvas';

export default function TopologyPage() {
  return (
    <MainLayout title="Swarm Topology">
      <ReactFlowProvider>
        <TopologyCanvas />
      </ReactFlowProvider>
    </MainLayout>
  );
}
