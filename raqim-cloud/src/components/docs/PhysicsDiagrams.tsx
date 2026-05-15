"use client";

import React from 'react';
import styled, { keyframes } from 'styled-components';

// Shared Colors
const colors = {
  background: '#09090b', // Deep dark mode
  border: '#27272a',
  cyanGlow: '#06b6d4',
  textMain: '#fafafa',
  textMuted: '#a1a1aa',
};

// Animations
const pulseAnimation = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.4); border-color: ${colors.cyanGlow}; }
  70% { box-shadow: 0 0 0 10px rgba(6, 182, 212, 0); border-color: rgba(6, 182, 212, 0.5); }
  100% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0); border-color: ${colors.border}; }
`;

const textGlow = keyframes`
  0%, 100% { text-shadow: 0 0 10px rgba(6, 182, 212, 0.5); }
  50% { text-shadow: 0 0 20px rgba(6, 182, 212, 0.8), 0 0 30px rgba(6, 182, 212, 0.6); }
`;

// BenchmarkHUD Components
const HudContainer = styled.div`
  background: ${colors.background};
  border: 1px solid ${colors.border};
  border-radius: 12px;
  padding: 3rem;
  margin: 2rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 30px -10px rgba(0,0,0,0.8);
  font-family: 'Geist', 'Inter', sans-serif;
  
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, ${colors.cyanGlow}, transparent);
    opacity: 0.5;
  }
`;

const MainNumber = styled.div`
  font-size: 6rem;
  font-weight: 800;
  color: ${colors.textMain};
  letter-spacing: -0.05em;
  line-height: 1;
  animation: ${textGlow} 3s ease-in-out infinite;
  
  @media (max-width: 768px) {
    font-size: 4rem;
  }
`;

const MainLabel = styled.div`
  font-size: 1.125rem;
  color: ${colors.cyanGlow};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 1rem;
  margin-bottom: 3rem;
  text-align: center;
`;

const SubMetricsContainer = styled.div`
  display: flex;
  gap: 4rem;
  width: 100%;
  justify-content: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 2rem;
  }
`;

const SubMetric = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SubValue = styled.div`
  font-size: 1.75rem;
  font-weight: 700;
  color: ${colors.textMain};
`;

const SubLabel = styled.div`
  font-size: 0.875rem;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 0.5rem;
`;

export const BenchmarkHUD = () => (
  <HudContainer>
    <MainNumber>104,000</MainNumber>
    <MainLabel>Logs / Second (Zero-Copy Throughput)</MainLabel>
    <SubMetricsContainer>
      <SubMetric>
        <SubValue>&lt; 1ms</SubValue>
        <SubLabel>Latency</SubLabel>
      </SubMetric>
      <SubMetric>
        <SubValue>0</SubValue>
        <SubLabel>Heap Allocations</SubLabel>
      </SubMetric>
    </SubMetricsContainer>
  </HudContainer>
);

// ZeroCopyDiagram Components
const DiagramContainer = styled.div`
  background: ${colors.background};
  border: 1px solid ${colors.border};
  border-radius: 12px;
  padding: 4rem 2rem;
  margin: 3rem 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  font-family: 'Geist', 'Inter', sans-serif;
  
  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 2rem;
    padding: 3rem 2rem;
  }
`;

const Node = styled.div<{ $isPulsing?: boolean }>`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid ${props => props.$isPulsing ? colors.cyanGlow : colors.border};
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  color: ${props => props.$isPulsing ? colors.cyanGlow : colors.textMain};
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
  position: relative;
  z-index: 2;
  backdrop-filter: blur(10px);
  animation: ${props => props.$isPulsing ? pulseAnimation : 'none'} 2s infinite;
  box-shadow: ${props => props.$isPulsing ? \`0 0 20px rgba(6, 182, 212, 0.2)\` : 'none'};
  transition: all 0.3s ease;
  min-width: 140px;
  
  &:hover {
    border-color: ${colors.cyanGlow};
    color: ${colors.cyanGlow};
    transform: translateY(-2px);
  }
`;

const SvgLines = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
  
  @media (max-width: 1024px) {
    display: none; // Fallback for mobile/column layout
  }
`;

const VerticalLine = styled.div\`
  display: none;
  width: 2px;
  height: 30px;
  background: ${colors.cyanGlow};
  opacity: 0.5;
  
  @media (max-width: 1024px) {
    display: block;
  }
\`;

export const ZeroCopyDiagram = () => {
  return (
    <DiagramContainer>
      <SvgLines viewBox="0 0 1000 100" preserveAspectRatio="none">
        <path 
          d="M 100 50 L 900 50" 
          stroke={colors.cyanGlow} 
          strokeWidth="2" 
          strokeDasharray="6 6"
          fill="none" 
          style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.6))' }}
        />
      </SvgLines>
      
      <Node>TCP Ingress</Node>
      <VerticalLine />
      <Node>Ed25519 Verification</Node>
      <VerticalLine />
      <Node $isPulsing>rkyv Memory Map</Node>
      <VerticalLine />
      <Node>Loro CRDT</Node>
      <VerticalLine />
      <Node>Append-Only WAL</Node>
    </DiagramContainer>
  );
};
