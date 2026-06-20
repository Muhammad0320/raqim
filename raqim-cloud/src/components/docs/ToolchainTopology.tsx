'use client';

import React from 'react';
import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
  0% { filter: drop-shadow(0 0 4px rgba(0, 229, 255, 0.4)); stroke: #00E5FF; }
  50% { filter: drop-shadow(0 0 16px rgba(0, 229, 255, 0.9)); stroke: #00E5FF; }
  100% { filter: drop-shadow(0 0 4px rgba(0, 229, 255, 0.4)); stroke: #00E5FF; }
`;

const pinkPulse = keyframes`
  0% { filter: drop-shadow(0 0 3px rgba(236, 72, 153, 0.4)); stroke: #ec4899; }
  50% { filter: drop-shadow(0 0 12px rgba(236, 72, 153, 0.8)); stroke: #ec4899; }
  100% { filter: drop-shadow(0 0 3px rgba(236, 72, 153, 0.4)); stroke: #ec4899; }
`;

const flowDots = keyframes`
  0% { stroke-dashoffset: 24; }
  100% { stroke-dashoffset: 0; }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-4px); }
  100% { transform: translateY(0px); }
`;

const moveInside = keyframes`
  0% { transform: translate(0, 0); }
  25% { transform: translate(40px, -20px); }
  50% { transform: translate(80px, 10px); }
  75% { transform: translate(20px, 30px); }
  100% { transform: translate(0, 0); }
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

const CoreBox = styled.rect`
  fill: #09090b;
  stroke: #00E5FF;
  stroke-width: 2.5;
  animation: ${pulse} 4s infinite ease-in-out;
  rx: 0;
`;

const NodeBox = styled.rect`
  fill: #09090b;
  stroke: #27272a;
  stroke-width: 2;
  rx: 0;
`;

const InnerNodeBox = styled.rect`
  fill: rgba(16, 185, 129, 0.02);
  stroke: #10b981;
  stroke-width: 2;
  rx: 0;
`;

const TextBase = styled.text`
  fill: #a1a1aa;
  font-size: 13px;
  text-anchor: middle;
  dominant-baseline: middle;
`;

const TitleText = styled(TextBase)`
  fill: #fafafa;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.05em;
`;

const SubText = styled(TextBase)`
  font-size: 11px;
  fill: #71717a;
`;

const ConnectionLine = styled.path`
  fill: none;
  stroke: #27272a;
  stroke-width: 2;
`;

const FlowPath = styled(ConnectionLine)`
  stroke-dasharray: 4 8;
  animation: ${flowDots} 1.2s linear infinite;
`;

const FloatingGroup = styled.g`
  animation: ${float} 6s infinite ease-in-out;
`;

const FastDot = styled.circle`
  fill: #10b981;
  filter: drop-shadow(0 0 4px #10b981);
  animation: ${moveInside} 3s infinite alternate ease-in-out;
`;

const FastDot2 = styled.circle`
  fill: #10b981;
  filter: drop-shadow(0 0 4px #10b981);
  animation: ${moveInside} 2s infinite alternate-reverse ease-in-out;
  animation-delay: -1s;
`;

export function ToolchainTopology() {
  return (
    <Container>
      <Svg viewBox="0 0 800 500">
        <defs>
          <linearGradient id="coreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(0, 229, 255, 0.08)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0.2)" />
          </linearGradient>
        </defs>

        {/* Core Raqim OS */}
        <g transform="translate(250, 100)">
          <CoreBox width="300" height="300" style={{ fill: 'url(#coreGradient)' }} />
          <TitleText x="150" y="30" style={{ fill: '#00E5FF' }}>THE CORE (RAQIM OS)</TitleText>
          
          {/* Vector 1: WASM SDK (Inside Core) */}
          <g transform="translate(50, 75)">
            <InnerNodeBox width="200" height="185" />
            <TitleText x="100" y="30" style={{ fill: '#10b981' }}>WASM Sandbox</TitleText>
            <SubText x="100" y="52" style={{ fill: '#10b981', opacity: 0.8 }}>Vector 1: In-Process</SubText>
            <SubText x="100" y="150" style={{ fill: '#71717a', fontSize: '9px' }}>DETERMINISTIC ISOLATION</SubText>
            
            {/* Zero latency dots */}
            <g transform="translate(60, 95)">
              <FastDot cx="0" cy="0" r="4" />
              <FastDot2 cx="20" cy="20" r="3" />
              <FastDot cx="40" cy="-10" r="5" style={{ animationDuration: '4s' }} />
              <FastDot2 cx="80" cy="15" r="4" style={{ animationDuration: '2.5s' }} />
            </g>
          </g>
        </g>

        {/* Vector 2: Python SDK (Outside Core, Left) */}
        <FloatingGroup transform="translate(30, 210)">
          <NodeBox width="160" height="80" />
          <TitleText x="80" y="30" style={{ fill: '#fafafa' }}>PYTHON SDK</TitleText>
          <SubText x="80" y="52">Vector 2: Out-of-Process</SubText>
        </FloatingGroup>

        {/* Vector 3: MCP Bridge (Outside Core, Top Right) */}
        <FloatingGroup transform="translate(610, 120)">
          <NodeBox width="160" height="80" />
          <TitleText x="80" y="30">CLAUDE / CURSOR</TitleText>
          <SubText x="80" y="52">External UI Client</SubText>
        </FloatingGroup>

        {/* MCP Server Node (Right) */}
        <FloatingGroup transform="translate(610, 300)">
          <NodeBox width="160" height="80" />
          <TitleText x="80" y="30">MCP SERVER</TitleText>
          <SubText x="80" y="52" style={{ fill: '#00E5FF' }}>Vector 3: Bridge</SubText>
        </FloatingGroup>

        {/* Python Connection Paths -> Core OS */}
        {/* TCP Data Plane: Thick Glowing Cyan */}
        <path d="M 190 230 L 250 230" fill="none" stroke="#00E5FF" strokeWidth="4.5" style={{ filter: 'drop-shadow(0 0 6px rgba(0, 229, 255, 0.8))' }} />
        <FlowPath d="M 190 230 L 250 230" stroke="#ffffff" strokeWidth="1.5" />
        <text x="220" y="215" fill="#00E5FF" fontSize="8px" fontWeight="700" textAnchor="middle">Zero-Copy State Sync</text>

        {/* Zenoh Control Plane: Dashed Glowing Pink */}
        <path d="M 190 270 L 250 270" fill="none" stroke="#ec4899" strokeWidth="2.5" strokeDasharray="5 5" style={{ filter: 'drop-shadow(0 0 4px rgba(236, 72, 153, 0.6))' }} />
        <FlowPath d="M 190 270 L 250 270" stroke="#ffffff" strokeWidth="1" />
        <text x="220" y="290" fill="#ec4899" fontSize="8px" fontWeight="700" textAnchor="middle">OOB Context Eviction</text>

        {/* Connections: Claude -> MCP Server */}
        <path d="M 690 200 L 690 300" fill="none" stroke="#27272a" strokeWidth="2.5" />
        <FlowPath d="M 690 200 L 690 300" stroke="#00E5FF" strokeWidth="1.5" />
        <text x="735" y="250" fill="#a1a1aa" fontSize="9px" textAnchor="middle">MCP Protocol</text>

        {/* Connections: MCP Server to Core OS */}
        <path d="M 610 340 L 550 340" fill="none" stroke="#00E5FF" strokeWidth="3" style={{ filter: 'drop-shadow(0 0 4px rgba(0, 229, 255, 0.5))' }} />
        <FlowPath d="M 610 340 L 550 340" stroke="#ffffff" strokeWidth="1" />
        <text x="580" y="328" fill="#00E5FF" fontSize="9px" fontWeight="700" textAnchor="middle">Secure TCP</text>

      </Svg>
    </Container>
  );
}
