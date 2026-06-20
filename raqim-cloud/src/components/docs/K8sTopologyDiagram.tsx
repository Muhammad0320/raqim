'use client';

import React from 'react';
import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
  0% { filter: drop-shadow(0 0 4px rgba(6, 182, 212, 0.4)); stroke: #06b6d4; }
  50% { filter: drop-shadow(0 0 12px rgba(6, 182, 212, 0.8)); stroke: #06b6d4; }
  100% { filter: drop-shadow(0 0 4px rgba(6, 182, 212, 0.4)); stroke: #06b6d4; }
`;

const flowDash = keyframes`
  0% { stroke-dashoffset: 24; }
  100% { stroke-dashoffset: 0; }
`;

const flowDashReverse = keyframes`
  0% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: 24; }
`;

const Container = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin: 3rem 0;
  padding: 2rem;
  background: #000000;
  border: 1px solid #27272a; /* zinc-800 */
  border-radius: 0px; /* brutalist sharp */
  overflow: hidden;
`;

const Svg = styled.svg`
  width: 100%;
  max-width: 800px;
  height: auto;
  overflow: visible;
  font-family: var(--font-geist-mono), monospace;
`;

const HardwareBox = styled.rect`
  fill: #09090b;
  stroke: #52525b;
  stroke-width: 2;
  rx: 0;
`;

const HeadlessServiceBoundary = styled.rect`
  fill: transparent;
  stroke: #ec4899;
  stroke-width: 2;
  rx: 0;
  stroke-dasharray: 6 6;
  opacity: 0.7;
`;

const PodBox = styled.rect`
  fill: rgba(0, 0, 0, 0.6);
  stroke: #06b6d4;
  stroke-width: 2;
  rx: 0;
  animation: ${pulse} 3s infinite ease-in-out;
`;

const PvcCylinder = styled.path`
  fill: #09090b;
  stroke: #10b981;
  stroke-width: 2;
`;

const TextBase = styled.text`
  text-anchor: middle;
  dominant-baseline: middle;
`;

const TitleText = styled(TextBase)`
  fill: #f4f4f5;
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.05em;
`;

const SubText = styled(TextBase)`
  font-size: 11px;
  fill: #a1a1aa;
`;

const ConnectionLine = styled.path`
  fill: none;
  stroke: #27272a;
  stroke-width: 2;
`;

const IngressLine = styled(ConnectionLine)`
  stroke: #71717a;
  stroke-width: 2.5;
  stroke-dasharray: 4 4;
  animation: ${flowDash} 1.5s linear infinite;
`;

const ZenohMeshLine = styled.path`
  fill: none;
  stroke: #ec4899;
  stroke-width: 2;
  stroke-dasharray: 6 6;
  animation: ${flowDash} 1s linear infinite;
  filter: drop-shadow(0 0 3px rgba(236, 72, 153, 0.5));
`;

const WanEgressLine = styled.path`
  fill: none;
  stroke: #00E5FF;
  stroke-width: 3.5;
  stroke-dasharray: 8 6;
  animation: ${flowDashReverse} 1.2s linear infinite;
  filter: drop-shadow(0 0 6px rgba(0, 229, 255, 0.7));
`;

const PvcLink = styled.path`
  fill: none;
  stroke: #10b981;
  stroke-width: 3;
`;

export function K8sTopologyDiagram() {
  return (
    <Container>
      <Svg viewBox="0 0 800 600">
        <defs>
          <linearGradient id="podGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(6, 182, 212, 0.12)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0.2)" />
          </linearGradient>
        </defs>

        {/* Level 2: Headless Service Boundary Box */}
        <g>
          <HeadlessServiceBoundary x="60" y="150" width="680" height="260" />
          <text x="75" y="170" fill="#ec4899" fontSize="10px" fontWeight="700" textAnchor="start" fontFamily="var(--font-geist-mono), monospace">
            BOUNDS: ClusterIP: None (Kube-Proxy Bypass)
          </text>
        </g>

        {/* Level 1: Hardware Load Balancer / Client Ingress */}
        <g transform="translate(180, 25)">
          <HardwareBox width="220" height="60" />
          <TitleText x="110" y="30" style={{ fill: '#fafafa' }}>Client Load Balancer</TitleText>
        </g>

        {/* WAN Gateway Router (Top Right) */}
        <g transform="translate(480, 25)">
          <HardwareBox width="220" height="60" stroke="#00E5FF" />
          <TitleText x="110" y="22" style={{ fill: '#00E5FF' }}>router.raqim.cloud:7447</TitleText>
          <SubText x="110" y="42" style={{ fill: '#00E5FF', opacity: 0.8, fontSize: '10px' }}>Enterprise WAN Gateway</SubText>
        </g>

        {/* Ingress Client Traffic Paths - Passing STRAIGHT through boundary box without intercept */}
        <IngressLine d="M 290 85 L 290 200 L 160 200 L 160 240" />
        <IngressLine d="M 290 85 L 290 240" />
        <IngressLine d="M 290 85 L 290 200 L 420 200 L 420 240" />
        <rect x="235" y="100" width="110" height="15" fill="#000000" />
        <text x="290" y="110" fill="#71717a" fontSize="9px" textAnchor="middle">Ingress (LB Bypass)</text>

        {/* Local Zenoh Mesh: Zero-Copy LAN Gossip (Connecting Pods directly to each other) */}
        <g>
          {/* raqim-0 <-> raqim-1 */}
          <ZenohMeshLine d="M 230 280 L 310 280" />
          {/* raqim-1 <-> raqim-2 */}
          <ZenohMeshLine d="M 450 280 L 530 280" />
          {/* raqim-0 <-> raqim-2 */}
          <ZenohMeshLine d="M 160 320 Q 370 370 580 320" />
          <rect x="310" y="340" width="120" height="15" fill="#000000" />
          <text x="370" y="350" fill="#ec4899" fontSize="9px" fontWeight="700" textAnchor="middle">Zero-Copy LAN Gossip</text>
        </g>

        {/* Global Egress (WAN): Thick Cyan Line pointing to WAN Gateway */}
        <g>
          <WanEgressLine d="M 580 240 L 580 110 L 590 110 L 590 85" />
          <text x="635" y="150" fill="#00E5FF" fontSize="9px" fontWeight="700" textAnchor="middle">Enterprise WAN Sync</text>
          <text x="635" y="165" fill="#00E5FF" fontSize="8px" textAnchor="middle">(JWT Authorized)</text>
        </g>

        {/* Level 3: StatefulSet Pods */}
        <g transform="translate(90, 240)">
          <PodBox width="140" height="80" style={{ fill: 'url(#podGrad)', animationDelay: '0s' }} />
          <TitleText x="70" y="30" style={{ fill: '#06b6d4' }}>raqim-0</TitleText>
          <SubText x="70" y="55" style={{ fill: '#a1a1aa' }}>StatefulSet Pod</SubText>
        </g>

        <g transform="translate(300, 240)">
          <PodBox width="140" height="80" style={{ fill: 'url(#podGrad)', animationDelay: '1s' }} />
          <TitleText x="70" y="30" style={{ fill: '#06b6d4' }}>raqim-1</TitleText>
          <SubText x="70" y="55" style={{ fill: '#a1a1aa' }}>StatefulSet Pod</SubText>
        </g>

        <g transform="translate(510, 240)">
          <PodBox width="140" height="80" style={{ fill: 'url(#podGrad)', animationDelay: '2s' }} />
          <TitleText x="70" y="30" style={{ fill: '#06b6d4' }}>raqim-2</TitleText>
          <SubText x="70" y="55" style={{ fill: '#a1a1aa' }}>StatefulSet Pod</SubText>
        </g>

        {/* PVC Hardware Connections */}
        <PvcLink d="M 160 320 L 160 450" />
        <PvcLink d="M 370 320 L 370 450" />
        <PvcLink d="M 580 320 L 580 450" />

        {/* Level 4: PVC Cylinders */}
        {[80, 290, 500].map((x, i) => (
          <g key={i} transform={`translate(${x}, 450)`}>
            <PvcCylinder d="M 0 15 C 0 5, 160 5, 160 15 L 160 70 C 160 80, 0 80, 0 70 Z" />
            <PvcCylinder d="M 0 15 C 0 25, 160 25, 160 15" style={{ fill: 'none' }} />
            <TitleText x="80" y="40" style={{ fill: '#10b981', fontSize: '11px' }}>Local NVMe PVC</TitleText>
            <SubText x="80" y="58" style={{ fontSize: '9px', fill: '#71717a' }}>(raqim-db-wal)</SubText>
          </g>
        ))}

        {/* Legend */}
        <g transform="translate(60, 540)">
          <rect width="680" height="40" fill="#000000" stroke="#27272a" />
          
          <g transform="translate(20, 20)">
            <ZenohMeshLine d="M 0 0 L 30 0" />
            <SubText x="100" y="0" style={{ fontSize: '9px' }}>LAN gossip mesh</SubText>
          </g>
          
          <g transform="translate(220, 20)">
            <WanEgressLine d="M 0 0 L 30 0" strokeWidth="2.5" />
            <SubText x="100" y="0" style={{ fontSize: '9px', fill: '#00E5FF' }}>WAN egress channel</SubText>
          </g>
          
          <g transform="translate(440, 20)">
            <PvcLink d="M 0 0 L 30 0" strokeWidth="2.5" />
            <SubText x="100" y="0" style={{ fontSize: '9px', fill: '#10b981' }}>Local NVMe write-path</SubText>
          </g>
        </g>
      </Svg>
    </Container>
  );
}
