'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

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

const NodeBox = styled.rect`
  fill: #09090b;
  stroke: #27272a;
  stroke-width: 1;
`;

const CoreDaemonBox = styled.rect`
  fill: #09090b;
  stroke: #27272a;
  stroke-width: 1;
`;

const SandboxBox = styled.rect`
  fill: rgba(16, 185, 129, 0.01);
  stroke: #10b981;
  stroke-width: 1;
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
  fill: #52525b; /* zinc-600 */
  font-size: 9px;
  text-anchor: middle;
`;

export function ToolchainTopology() {
  const [isHovered, setIsHovered] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs to follow the mouse cursor
  const springX = useSpring(mouseX, { stiffness: 150, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 25 });

  // Convert motion values to a CSS radial-gradient string
  const radialBg = useTransform(
    [springX, springY],
    ([x, y]) => `radial-gradient(450px circle at ${x}px ${y}px, rgba(0, 229, 255, 0.09) 0%, rgba(217, 70, 239, 0.03) 45%, transparent 80%)`
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
          <marker id="arrow-cyan" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#00E5FF" />
          </marker>
          <marker id="arrow-magenta" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#d946ef" />
          </marker>
          <marker id="arrow-zinc" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#52525b" />
          </marker>
        </defs>

        {/* Python Connection Lines to Core Daemon */}
        {/* TCP Data: Cyan glow and solid line */}
        <path d="M 200 210 L 290 210" stroke="rgba(0, 229, 255, 0.25)" strokeWidth="5" fill="none" />
        <path d="M 200 210 L 290 210" stroke="#00E5FF" strokeWidth="1.2" fill="none" markerEnd="url(#arrow-cyan)" />
        <text x="245" y="193" fill="#00E5FF" fontSize="8px" fontWeight="700" textAnchor="middle" letterSpacing="0.05em">TCP (DATA)</text>
        <text x="245" y="203" fill="#71717a" fontSize="7px" textAnchor="middle">Zero-Copy Sync</text>

        {/* WS/Zenoh Control: Magenta glow and dashed line */}
        <path d="M 200 250 L 290 250" stroke="rgba(217, 70, 239, 0.25)" strokeWidth="5" fill="none" strokeDasharray="3 3" />
        <path d="M 200 250 L 290 250" stroke="#d946ef" strokeWidth="1.2" fill="none" strokeDasharray="3 3" markerEnd="url(#arrow-magenta)" />
        <text x="245" y="270" fill="#d946ef" fontSize="8px" fontWeight="700" textAnchor="middle" letterSpacing="0.05em">WS / ZENOH</text>
        <text x="245" y="280" fill="#71717a" fontSize="7px" textAnchor="middle">Control & Evictions</text>

        {/* MCP Connection to Core Daemon */}
        <path d="M 600 225 L 510 225" stroke="rgba(0, 229, 255, 0.25)" strokeWidth="5" fill="none" />
        <path d="M 600 225 L 510 225" stroke="#00E5FF" strokeWidth="1.2" fill="none" markerEnd="url(#arrow-cyan)" />
        <text x="555" y="208" fill="#00E5FF" fontSize="8px" fontWeight="700" textAnchor="middle" letterSpacing="0.05em">JSON-RPC</text>
        <text x="555" y="218" fill="#71717a" fontSize="7px" textAnchor="middle">Secure Ingress</text>

        {/* Node 1: Python SDK (Left) */}
        <g transform="translate(40, 160)">
          <NodeBox width="160" height="130" />
          <rect x="0" y="0" width="160" height="4" fill="#27272a" />
          <TitleText x="80" y="25" fill="#ffffff">PYTHON SDK</TitleText>
          <LabelText x="80" y="42">Vector 2</LabelText>
          <ValueText x="80" y="58">Out-of-Process</ValueText>
          
          <line x1="15" y1="75" x2="145" y2="75" stroke="#27272a" strokeWidth="1" />
          
          <ValueText x="80" y="94" fill="#a1a1aa">Subprocess worker</ValueText>
          <ValueText x="80" y="110" fill="#a1a1aa">Zenoh connection</ValueText>
        </g>

        {/* Node 2: Core Daemon (Center) */}
        <g transform="translate(290, 75)">
          <CoreDaemonBox width="220" height="300" />
          {/* Subtle glow boundary for Core Daemon */}
          <rect x="-1" y="-1" width="222" height="302" fill="none" stroke="rgba(0, 229, 255, 0.12)" strokeWidth="1" />
          <rect x="0" y="0" width="220" height="4" fill="#00E5FF" />
          <TitleText x="110" y="25" fill="#00E5FF">RAQIM DAEMON</TitleText>
          <LabelText x="110" y="42" fill="#e4e4e7">Core Host Engine</LabelText>
          
          {/* Inner WASM Sandbox */}
          <g transform="translate(30, 75)">
            <SandboxBox width="160" height="180" />
            <rect x="0" y="0" width="160" height="4" fill="#10b981" />
            <TitleText x="80" y="25" fill="#10b981">WASM SANDBOX</TitleText>
            <LabelText x="80" y="42">Vector 1: In-Process</LabelText>
            
            <line x1="15" y1="65" x2="145" y2="65" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1" />
            
            <ValueText x="80" y="88" fill="#a1a1aa">Isolated Wasmtime</ValueText>
            <ValueText x="80" y="108" fill="#a1a1aa">Zero-Latency Casting</ValueText>
            <ValueText x="80" y="128" fill="#a1a1aa">rkyv deserialization</ValueText>
            <ValueText x="80" y="148" fill="#a1a1aa">Deterministic runtime</ValueText>
          </g>
        </g>

        {/* Node 3: MCP Bridge (Right) */}
        <g transform="translate(600, 160)">
          <NodeBox width="160" height="130" />
          <rect x="0" y="0" width="160" height="4" fill="#27272a" />
          <TitleText x="80" y="25" fill="#ffffff">MCP BRIDGE</TitleText>
          <LabelText x="80" y="42">Vector 3</LabelText>
          <ValueText x="80" y="58">Claude / Cursor</ValueText>
          
          <line x1="15" y1="75" x2="145" y2="75" stroke="#27272a" strokeWidth="1" />
          
          <ValueText x="80" y="94" fill="#a1a1aa">Claude-Desktop Link</ValueText>
          <ValueText x="80" y="110" fill="#a1a1aa">Secure JSON-RPC</ValueText>
        </g>
      </Svg>
    </Container>
  );
}
