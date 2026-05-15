'use client';

import React from 'react';
import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
  0% { filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.4)); }
  50% { filter: drop-shadow(0 0 16px rgba(6, 182, 212, 0.8)); }
  100% { filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.4)); }
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

const CoreBox = styled.rect`
  fill: rgba(6, 182, 212, 0.05);
  stroke: rgba(6, 182, 212, 0.6);
  stroke-width: 2;
  animation: ${pulse} 4s infinite ease-in-out;
  rx: 8;
`;

const NodeBox = styled.rect`
  fill: #18181b;
  stroke: #3f3f46;
  stroke-width: 2;
  rx: 6;
`;

const InnerNodeBox = styled.rect`
  fill: rgba(16, 185, 129, 0.1);
  stroke: #10b981;
  stroke-width: 2;
  rx: 6;
`;

const TextBase = styled.text`
  fill: #a1a1aa;
  font-size: 14px;
  text-anchor: middle;
  dominant-baseline: middle;
`;

const TitleText = styled(TextBase)`
  fill: #f4f4f5;
  font-weight: 600;
  font-size: 16px;
`;

const SubText = styled(TextBase)`
  font-size: 12px;
  fill: #71717a;
`;

const ConnectionLine = styled.path`
  fill: none;
  stroke: #52525b;
  stroke-width: 2;
`;

const TcpFirehose = styled(ConnectionLine)`
  stroke: #f59e0b;
  stroke-width: 3;
`;

const ZenohControl = styled(ConnectionLine)`
  stroke: #ec4899;
  stroke-dasharray: 4 4;
`;

const FlowPath = styled(ConnectionLine)`
  stroke: rgba(6, 182, 212, 0.8);
  stroke-dasharray: 4 8;
  animation: ${flowDots} 1s linear infinite;
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
            <stop offset="0%" stopColor="rgba(6, 182, 212, 0.1)" />
            <stop offset="100%" stopColor="rgba(6, 182, 212, 0.02)" />
          </linearGradient>
        </defs>

        {/* Core Raqim OS */}
        <g transform="translate(250, 100)">
          <CoreBox width="300" height="300" style={{ fill: 'url(#coreGradient)' }} />
          <TitleText x="150" y="30" style={{ fill: '#06b6d4' }}>The Core (Raqim OS)</TitleText>
          
          {/* Vector 1: WASM SDK (Inside Core) */}
          <g transform="translate(50, 80)">
            <InnerNodeBox width="200" height="180" />
            <TitleText x="100" y="30" style={{ fill: '#10b981' }}>WASM Sandbox</TitleText>
            <SubText x="100" y="50">Vector 1: In-Process</SubText>
            
            {/* Zero latency dots */}
            <g transform="translate(60, 100)">
              <FastDot cx="0" cy="0" r="4" />
              <FastDot2 cx="20" cy="20" r="3" />
              <FastDot cx="40" cy="-10" r="5" style={{ animationDuration: '4s' }} />
              <FastDot2 cx="80" cy="15" r="4" style={{ animationDuration: '2.5s' }} />
            </g>
          </g>
        </g>

        {/* Vector 2: Python SDK (Outside Core, Bottom Left) */}
        <FloatingGroup transform="translate(30, 200)">
          <NodeBox width="160" height="80" />
          <TitleText x="80" y="30">Python SDK</TitleText>
          <SubText x="80" y="55">Vector 2: Out-of-Process</SubText>
        </FloatingGroup>

        {/* Vector 3: MCP Bridge (Outside Core, Top Right) */}
        <FloatingGroup transform="translate(600, 120)">
          <NodeBox width="160" height="80" />
          <TitleText x="80" y="30">Claude / Cursor</TitleText>
          <SubText x="80" y="55">External UI</SubText>
        </FloatingGroup>

        <FloatingGroup transform="translate(600, 300)">
          <NodeBox width="160" height="80" />
          <TitleText x="80" y="30">MCP Server</TitleText>
          <SubText x="80" y="55">Vector 3: TCP Layer</SubText>
        </FloatingGroup>

        {/* Connections Python -> Core */}
        {/* TCP Firehose */}
        <path d="M 190 230 L 250 230" fill="none" stroke="#f59e0b" strokeWidth="3" />
        <FlowPath d="M 190 230 L 250 230" />
        <rect x="200" y="210" width="40" height="16" fill="#18181b" />
        <SubText x="220" y="218" style={{ fontSize: '10px', fill: '#f59e0b' }}>TCP Firehose</SubText>

        {/* Zenoh Control Plane */}
        <path d="M 190 250 L 250 250" fill="none" stroke="#ec4899" strokeWidth="2" strokeDasharray="4 4" />
        <rect x="195" y="255" width="50" height="16" fill="#18181b" />
        <SubText x="220" y="263" style={{ fontSize: '10px', fill: '#ec4899' }}>Zenoh Control</SubText>

        {/* Connections Claude -> MCP Server -> Core */}
        {/* Claude to MCP */}
        <path d="M 680 200 L 680 300" fill="none" stroke="#52525b" strokeWidth="2" />
        <FlowPath d="M 680 200 L 680 300" />
        <rect x="660" y="242" width="40" height="16" fill="#18181b" />
        <SubText x="680" y="250" style={{ fontSize: '10px' }}>MCP Stdout</SubText>

        {/* MCP Server to Core */}
        <path d="M 600 340 L 550 340" fill="none" stroke="#f59e0b" strokeWidth="3" />
        <FlowPath d="M 600 340 L 550 340" />
        <rect x="560" y="320" width="30" height="16" fill="#18181b" />
        <SubText x="575" y="328" style={{ fontSize: '10px', fill: '#f59e0b' }}>TCP</SubText>

      </Svg>
    </Container>
  );
}
