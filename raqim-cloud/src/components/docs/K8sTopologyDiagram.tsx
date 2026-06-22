'use client';

import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const flow = keyframes`
  to {
    stroke-dashoffset: -20;
  }
`;

const Container = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  margin: 3rem 0;
  padding: 2.5rem;
  background: #09090b;
  border: 1px solid #27272a; /* zinc-800 */
  border-radius: 0px; /* brutalist sharp */
  overflow: hidden;
  cursor: crosshair;
`;

const Svg = styled.svg`
  width: 100%;
  max-width: 800px;
  height: auto;
  overflow: visible;
  font-family: var(--font-geist-mono), monospace;
  position: relative;
  z-index: 2;
  user-select: none;
`;

const BoundaryBox = styled.rect`
  fill: transparent;
  stroke: #27272a; /* zinc-800 */
  stroke-width: 1.5;
  stroke-dasharray: 4 4;
`;

const PodRect = styled.rect`
  fill: #09090b;
  stroke: #27272a;
  stroke-width: 1;
`;

const PvcRect = styled.rect`
  fill: #09090b;
  stroke: #27272a;
  stroke-width: 1;
`;

const CyanTopBorder = styled.rect`
  fill: #06b6d4;
`;

const EmeraldTopBorder = styled.rect`
  fill: #10b981;
`;

const ConnectionPath = styled.path`
  fill: none;
  stroke: #10b981;
  stroke-width: 3;
`;

const MeshPath = styled.path`
  fill: none;
  stroke: #ec4899; /* magenta */
  stroke-width: 1.5;
  stroke-dasharray: 4 4;
  animation: ${flow} 1s linear infinite;
`;

const MeshGlowPath = styled.path`
  fill: none;
  stroke: rgba(236, 72, 153, 0.25);
  stroke-width: 5;
  stroke-dasharray: 4 4;
  animation: ${flow} 1s linear infinite;
`;

const TitleText = styled.text`
  fill: #ffffff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-anchor: middle;
`;

const LabelText = styled.text`
  fill: #a1a1aa; /* zinc-400 */
  font-size: 10px;
  text-anchor: middle;
`;

const ValueText = styled.text`
  fill: #71717a; /* zinc-500 */
  font-size: 9px;
  text-anchor: middle;
`;

export function K8sTopologyDiagram() {
  const [isHovered, setIsHovered] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for cursor follow
  const springX = useSpring(mouseX, { stiffness: 150, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 25 });

  // Convert motion values to cursor-aware radial gradient glow
  const radialBg = useTransform(
    [springX, springY],
    ([x, y]) => `radial-gradient(600px circle at ${x}px ${y}px, rgba(6, 182, 212, 0.1) 0%, transparent 40%)`
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <Container
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Soft cursor-aware hover glow behind SVG elements */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          background: radialBg,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      <Svg viewBox="0 0 800 450">
        <defs>
          <marker id="arrow-magenta" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ec4899" />
          </marker>
        </defs>

        {/* Headless Service Boundary Box */}
        <g>
          <BoundaryBox x="40" y="50" width="720" height="340" />
          <text x="55" y="72" fill="#71717a" fontSize="9px" fontWeight="700" textAnchor="start" letterSpacing="0.05em">
            BOUNDS: Headless Service (ClusterIP: None)
          </text>
        </g>

        {/* LAN Gossip Mesh Connections (bypassing LB) */}
        {/* Pod 0 <-> Pod 1 */}
        <MeshGlowPath d="M 160 150 L 400 150" />
        <MeshPath d="M 160 150 L 400 150" />
        
        {/* Pod 1 <-> Pod 2 */}
        <MeshGlowPath d="M 400 150 L 640 150" />
        <MeshPath d="M 400 150 L 640 150" />
        
        {/* Pod 0 <-> Pod 2 (Curved underneath) */}
        <MeshGlowPath d="M 160 180 Q 400 240 640 180" />
        <MeshPath d="M 160 180 Q 400 240 640 180" />
        
        <rect x="330" y="210" width="140" height="15" fill="#09090b" stroke="#27272a" strokeWidth="0.5" />
        <text x="400" y="220" fill="#ec4899" fontSize="7.5px" fontWeight="700" textAnchor="middle" letterSpacing="0.05em">Zenoh P2P Gossip Mesh</text>

        {/* Pod-to-PVC Connections (Thick Emerald lines) */}
        <ConnectionPath d="M 160 190 L 160 290" />
        <ConnectionPath d="M 400 190 L 400 290" />
        <ConnectionPath d="M 640 190 L 640 290" />

        {/* Pod 0 (raqim-0) */}
        <g transform="translate(90, 110)">
          <PodRect width="140" height="80" />
          <CyanTopBorder width="140" height="4" />
          <TitleText x="70" y="25">raqim-0</TitleText>
          <LabelText x="70" y="45">StatefulSet Pod</LabelText>
          <ValueText x="70" y="62">Port: 7447</ValueText>
        </g>

        {/* Pod 1 (raqim-1) */}
        <g transform="translate(330, 110)">
          <PodRect width="140" height="80" />
          <CyanTopBorder width="140" height="4" />
          <TitleText x="70" y="25">raqim-1</TitleText>
          <LabelText x="70" y="45">StatefulSet Pod</LabelText>
          <ValueText x="70" y="62">Port: 7447</ValueText>
        </g>

        {/* Pod 2 (raqim-2) */}
        <g transform="translate(570, 110)">
          <PodRect width="140" height="80" />
          <CyanTopBorder width="140" height="4" />
          <TitleText x="70" y="25">raqim-2</TitleText>
          <LabelText x="70" y="45">StatefulSet Pod</LabelText>
          <ValueText x="70" y="62">Port: 7447</ValueText>
        </g>

        {/* PVC 0 */}
        <g transform="translate(90, 290)">
          <PvcRect width="140" height="70" />
          <EmeraldTopBorder width="140" height="4" />
          <TitleText x="70" y="25" fill="#10b981">Local NVMe PVC</TitleText>
          <ValueText x="70" y="45" fill="#a1a1aa">raqim-db-wal-0</ValueText>
          <ValueText x="70" y="58" fill="#71717a">HostPath Bind</ValueText>
        </g>

        {/* PVC 1 */}
        <g transform="translate(330, 290)">
          <PvcRect width="140" height="70" />
          <EmeraldTopBorder width="140" height="4" />
          <TitleText x="70" y="25" fill="#10b981">Local NVMe PVC</TitleText>
          <ValueText x="70" y="45" fill="#a1a1aa">raqim-db-wal-1</ValueText>
          <ValueText x="70" y="58" fill="#71717a">HostPath Bind</ValueText>
        </g>

        {/* PVC 2 */}
        <g transform="translate(570, 290)">
          <PvcRect width="140" height="70" />
          <EmeraldTopBorder width="140" height="4" />
          <TitleText x="70" y="25" fill="#10b981">Local NVMe PVC</TitleText>
          <ValueText x="70" y="45" fill="#a1a1aa">raqim-db-wal-2</ValueText>
          <ValueText x="70" y="58" fill="#71717a">HostPath Bind</ValueText>
        </g>

        {/* Legend */}
        <g transform="translate(40, 400)">
          <rect width="720" height="30" fill="#09090b" stroke="#27272a" strokeWidth="1" />
          
          <g transform="translate(20, 15)">
            <line x1="0" y1="0" x2="30" y2="0" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="40" y="3" fill="#a1a1aa" fontSize="8px" textAnchor="start">LAN Gossip Mesh (Zenoh)</text>
          </g>

          <g transform="translate(300, 15)">
            <line x1="0" y1="0" x2="30" y2="0" stroke="#06b6d4" strokeWidth="2.5" />
            <text x="40" y="3" fill="#a1a1aa" fontSize="8px" textAnchor="start">StatefulSet Pods (Active)</text>
          </g>

          <g transform="translate(550, 15)">
            <line x1="0" y1="0" x2="30" y2="0" stroke="#10b981" strokeWidth="2.5" />
            <text x="40" y="3" fill="#a1a1aa" fontSize="8px" textAnchor="start">Local NVMe Write-Path</text>
          </g>
        </g>
      </Svg>
    </Container>
  );
}
