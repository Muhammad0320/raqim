'use client';

import React from 'react';
import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
  0% { filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.4)); transform: scale(1); }
  50% { filter: drop-shadow(0 0 16px rgba(6, 182, 212, 0.8)); transform: scale(1.02); }
  100% { filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.4)); transform: scale(1); }
`;

const flowDash = keyframes`
  0% { stroke-dashoffset: 24; }
  100% { stroke-dashoffset: 0; }
`;

const Container = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin: 3rem 0;
  padding: 2rem;
  background: rgba(9, 9, 11, 0.8);
  border: 1px solid rgba(39, 39, 42, 0.6);
  border-radius: 12px;
  overflow: hidden;
`;

const Svg = styled.svg`
  width: 100%;
  max-width: 800px;
  height: auto;
  overflow: visible;
  font-family: var(--font-geist-sans), sans-serif;
`;

const LoadBalancerBox = styled.rect`
  fill: #18181b;
  stroke: #52525b;
  stroke-width: 2;
  rx: 8;
`;

const HeadlessServiceBox = styled.rect`
  fill: rgba(236, 72, 153, 0.05);
  stroke: #ec4899;
  stroke-width: 2;
  rx: 8;
  stroke-dasharray: 4 4;
`;

const PodBox = styled.rect`
  fill: rgba(6, 182, 212, 0.1);
  stroke: #06b6d4;
  stroke-width: 2;
  rx: 6;
  animation: ${pulse} 3s infinite ease-in-out;
`;

const PvcCylinder = styled.path`
  fill: #18181b;
  stroke: #10b981;
  stroke-width: 2;
`;

const TextBase = styled.text`
  text-anchor: middle;
  dominant-baseline: middle;
`;

const TitleText = styled(TextBase)`
  fill: #f4f4f5;
  font-weight: 600;
  font-size: 14px;
`;

const SubText = styled(TextBase)`
  font-size: 12px;
  fill: #a1a1aa;
`;

const ConnectionLine = styled.path`
  fill: none;
  stroke: #3f3f46;
  stroke-width: 2;
`;

const ZenohMeshLine = styled.path`
  fill: none;
  stroke: #ec4899;
  stroke-width: 2;
  stroke-dasharray: 6 6;
  animation: ${flowDash} 1s linear infinite;
  filter: drop-shadow(0 0 4px rgba(236, 72, 153, 0.6));
`;

const PvcLink = styled.path`
  fill: none;
  stroke: #10b981;
  stroke-width: 4;
`;

export function K8sTopologyDiagram() {
  return (
    <Container>
      <Svg viewBox="0 0 800 600">
        <defs>
          <linearGradient id="podGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(6, 182, 212, 0.15)" />
            <stop offset="100%" stopColor="rgba(6, 182, 212, 0.05)" />
          </linearGradient>
        </defs>

        {/* Connections from Load Balancer to Headless Service */}
        <ConnectionLine d="M 400 90 L 400 130" />

        {/* Connections from Headless Service to Pods (Bypassing Standard LB) */}
        <ZenohMeshLine d="M 400 190 L 400 240 L 200 270" />
        <ZenohMeshLine d="M 400 190 L 400 270" />
        <ZenohMeshLine d="M 400 190 L 400 240 L 600 270" />

        {/* Peer-to-Peer Mesh between Pods */}
        <ZenohMeshLine d="M 280 300 L 320 300" style={{ strokeOpacity: 0.5 }} />
        <ZenohMeshLine d="M 480 300 L 520 300" style={{ strokeOpacity: 0.5 }} />
        <ZenohMeshLine d="M 240 330 Q 400 380 560 330" style={{ strokeOpacity: 0.3 }} />

        {/* PVC Links */}
        <PvcLink d="M 200 350 L 200 450" />
        <PvcLink d="M 400 350 L 400 450" />
        <PvcLink d="M 600 350 L 600 450" />

        {/* Level 1: Ingress / Load Balancer */}
        <g transform="translate(300, 30)">
          <LoadBalancerBox width="200" height="60" />
          <TitleText x="100" y="30">Hardware Load Balancer</TitleText>
        </g>

        {/* Level 2: Headless Service */}
        <g transform="translate(280, 130)">
          <HeadlessServiceBox width="240" height="60" />
          <TitleText x="120" y="25" style={{ fill: '#ec4899' }}>Headless Service</TitleText>
          <SubText x="120" y="45">ClusterIP: None (Direct Routing)</SubText>
        </g>

        {/* Level 3: StatefulSet Pods */}
        <g transform="translate(120, 270)">
          <PodBox width="160" height="80" style={{ fill: 'url(#podGrad)', animationDelay: '0s' }} />
          <TitleText x="80" y="30" style={{ fill: '#06b6d4' }}>raqim-0</TitleText>
          <SubText x="80" y="55">Distroless Binary</SubText>
        </g>

        <g transform="translate(320, 270)">
          <PodBox width="160" height="80" style={{ fill: 'url(#podGrad)', animationDelay: '1s' }} />
          <TitleText x="80" y="30" style={{ fill: '#06b6d4' }}>raqim-1</TitleText>
          <SubText x="80" y="55">Distroless Binary</SubText>
        </g>

        <g transform="translate(520, 270)">
          <PodBox width="160" height="80" style={{ fill: 'url(#podGrad)', animationDelay: '2s' }} />
          <TitleText x="80" y="30" style={{ fill: '#06b6d4' }}>raqim-2</TitleText>
          <SubText x="80" y="55">Distroless Binary</SubText>
        </g>

        {/* Level 4: PVCs */}
        {[120, 320, 520].map((x, i) => (
          <g key={i} transform={`translate(${x}, 450)`}>
            {/* Cylinder Shape */}
            <PvcCylinder d="M 0 20 C 0 5, 160 5, 160 20 L 160 80 C 160 95, 0 95, 0 80 Z" />
            <PvcCylinder d="M 0 20 C 0 35, 160 35, 160 20" style={{ fill: 'none' }} />
            
            <TitleText x="80" y="45" style={{ fill: '#10b981', fontSize: '12px' }}>NVMe Persistent Volume</TitleText>
            <SubText x="80" y="65" style={{ fontSize: '10px' }}>(WAL + LanceDB)</SubText>
          </g>
        ))}

        {/* Legend */}
        <g transform="translate(50, 520)">
          <rect width="200" height="60" fill="#09090b" stroke="#27272a" rx="4" />
          
          <ZenohMeshLine d="M 60 540 L 90 540" />
          <SubText x="145" y="540">Zenoh Peer-to-Mesh</SubText>
          
          <PvcLink d="M 60 560 L 90 560" strokeWidth="3" />
          <SubText x="145" y="560">Hard NVMe Link</SubText>
        </g>
      </Svg>
    </Container>
  );
}
