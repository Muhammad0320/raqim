"use client";

import React from 'react';
import styled, { keyframes } from 'styled-components';

// Shared Colors
const colors = {
  background: '#000000',
  panelBg: '#09090b',
  border: '#27272a',     // zinc-800
  cyan: '#00E5FF',
  textMain: '#ffffff',
  textMuted: '#71717a',   // zinc-500
  zinc400: '#a1a1aa',
};

// Keyframes for instant step-timing jump of the memory pointer highlight
const jump = keyframes`
  0%, 19.9% { transform: translate(40px, 40px); }
  20%, 39.9% { transform: translate(220px, 40px); }
  40%, 59.9% { transform: translate(400px, 40px); }
  60%, 79.9% { transform: translate(580px, 40px); }
  80%, 100% { transform: translate(760px, 40px); }
`;

// BenchmarkHUD Components
const HudContainer = styled.div`
  background: ${colors.panelBg};
  border: 1px solid ${colors.border};
  border-radius: 0px; /* brutalist sharp */
  padding: 3rem;
  margin: 2rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: var(--font-geist-mono), monospace;
`;

const MainNumber = styled.div`
  font-size: 6rem;
  font-weight: 800;
  color: ${colors.textMain};
  letter-spacing: -0.05em;
  line-height: 1;
  text-shadow: none; /* stripped text shadow */
  
  @media (max-width: 768px) {
    font-size: 4rem;
  }
`;

const MainLabel = styled.div`
  font-size: 0.875rem;
  color: ${colors.textMuted};
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.25em; /* widest tracking */
  margin-top: 1rem;
  margin-bottom: 3.5rem;
  text-align: center;
`;

const SubMetricsContainer = styled.div`
  display: flex;
  gap: 3rem;
  width: 100%;
  justify-content: center;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 2.5rem;
  }
`;

const SubMetric = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 210px;
  flex: 1;
  max-width: 280px;
`;

const SubValue = styled.div`
  font-size: 1.35rem;
  font-weight: 700;
  color: ${colors.textMain};
  text-align: center;
`;

const SubLabel = styled.div`
  font-size: 0.8rem;
  color: ${colors.zinc400};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 0.5rem;
  text-align: center;
`;

export const BenchmarkHUD = () => (
  <HudContainer>
    <MainNumber>790,946</MainNumber>
    <MainLabel>TRANSACTIONS / SECOND (TPS)</MainLabel>
    <SubMetricsContainer>
      <SubMetric>
        <SubValue>&lt; 31µs</SubValue>
        <SubLabel>Latency</SubLabel>
        <div className="text-[10px] text-zinc-500 text-center mt-3 max-w-[210px] leading-normal font-sans">
          Calculated via strict hardware limits: 12µs Ed25519 signature audit + 19µs NVMe continuous sector write via io_uring.
        </div>
      </SubMetric>
      <SubMetric>
        <SubValue>Amortized (1MB BufReader)</SubValue>
        <SubLabel>Syscall Overhead</SubLabel>
      </SubMetric>
      <SubMetric>
        <SubValue>0 (Scratch Buffer)</SubValue>
        <SubLabel>Dynamic Heap Allocations</SubLabel>
      </SubMetric>
    </SubMetricsContainer>
  </HudContainer>
);

// ZeroCopyDiagram Components
const DiagramContainer = styled.div`
  background: ${colors.panelBg};
  border: 1px solid ${colors.border};
  border-radius: 0px; /* brutalist sharp */
  padding: 2.5rem 1.5rem;
  margin: 3rem 0;
  display: flex;
  justify-content: center;
  position: relative;
  overflow: hidden;
  font-family: var(--font-geist-mono), monospace;
`;

const SvgFlowchart = styled.svg`
  width: 100%;
  max-width: 900px;
  height: auto;
  overflow: visible;
  user-select: none;
`;

const NodeRect = styled.rect`
  width: 120px;
  height: 120px;
  fill: #000000;
  stroke: ${colors.border};
  stroke-width: 1;
`;

const NodeText = styled.text`
  fill: ${colors.textMain};
  font-size: 10px;
  font-family: var(--font-geist-mono), monospace;
  font-weight: 700;
  text-anchor: middle;
  dominant-baseline: middle;
`;

const MemoryPointerHighlight = styled.rect`
  fill: none;
  stroke: ${colors.cyan};
  stroke-width: 2.5;
  width: 120px;
  height: 120px;
  animation: ${jump} 5s steps(1) infinite;
`;

export const ZeroCopyDiagram = () => {
  return (
    <DiagramContainer>
      <SvgFlowchart viewBox="0 0 920 200">
        {/* Connection Lines (straight, solid zinc-700) */}
        <line x1="160" y1="100" x2="220" y2="100" stroke="#3f3f46" strokeWidth="1.5" />
        <line x1="340" y1="100" x2="400" y2="100" stroke="#3f3f46" strokeWidth="1.5" />
        <line x1="520" y1="100" x2="580" y2="100" stroke="#3f3f46" strokeWidth="1.5" />
        <line x1="700" y1="100" x2="760" y2="100" stroke="#3f3f46" strokeWidth="1.5" />

        {/* Node 0: 1MB TCP BufReader */}
        <g transform="translate(40, 40)">
          <NodeRect />
          <NodeText x="60" y="52">1MB TCP</NodeText>
          <NodeText x="60" y="72">BufReader</NodeText>
        </g>
        
        {/* Node 1: rkyv::access_unchecked */}
        <g transform="translate(220, 40)">
          <NodeRect />
          <NodeText x="60" y="52">rkyv::</NodeText>
          <NodeText x="60" y="72" fontSize="9px">access_unchecked</NodeText>
        </g>

        {/* Node 2: Aegis Ed25519 Audit */}
        <g transform="translate(400, 40)">
          <NodeRect />
          <NodeText x="60" y="52">Aegis</NodeText>
          <NodeText x="60" y="72">Ed25519 Audit</NodeText>
        </g>

        {/* Node 3: Loro CRDT Merge */}
        <g transform="translate(580, 40)">
          <NodeRect />
          <NodeText x="60" y="52">Loro</NodeText>
          <NodeText x="60" y="72">CRDT Merge</NodeText>
        </g>

        {/* Node 4: io_uring NVMe WAL */}
        <g transform="translate(760, 40)">
          <NodeRect />
          <NodeText x="60" y="52">io_uring</NodeText>
          <NodeText x="60" y="72">NVMe WAL</NodeText>
        </g>

        {/* Zero-Copy Memory Pointer: Jumping highlight representing zero-copy casts */}
        <MemoryPointerHighlight x="0" y="0" />
      </SvgFlowchart>
    </DiagramContainer>
  );
};
