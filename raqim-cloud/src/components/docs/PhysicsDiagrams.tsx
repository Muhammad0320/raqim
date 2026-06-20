"use client";

import React from 'react';
import styled, { keyframes } from 'styled-components';

// Shared Colors
const colors = {
  background: '#000000', // Deep dark mode
  border: '#27272a',     // zinc-800
  cyanGlow: '#00E5FF',   // Sharp Cyan
  textMain: '#fafafa',
  textMuted: '#a1a1aa',
};

// Animations
const pulseAnimation = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(0, 229, 255, 0.4); border-color: ${colors.cyanGlow}; }
  77% { box-shadow: 0 0 0 10px rgba(0, 229, 255, 0); border-color: rgba(0, 229, 255, 0.5); }
  100% { box-shadow: 0 0 0 0 rgba(0, 229, 255, 0); border-color: ${colors.border}; }
`;

const textGlow = keyframes`
  0%, 100% { text-shadow: 0 0 8px rgba(0, 229, 255, 0.5); }
  50% { text-shadow: 0 0 18px rgba(0, 229, 255, 0.9), 0 0 28px rgba(0, 229, 255, 0.7); }
`;

// BenchmarkHUD Components
const HudContainer = styled.div`
  background: ${colors.background};
  border: 1px solid ${colors.border};
  border-radius: 0px; /* brutalist sharp */
  padding: 3rem;
  margin: 2rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 30px -10px rgba(0,0,0,0.9);
  font-family: var(--font-geist-mono), monospace;
  
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, ${colors.cyanGlow}, transparent);
    opacity: 0.6;
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
  font-weight: 700;
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
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 2rem;
  }
`;

const SubMetric = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 200px;
`;

const SubValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${colors.textMain};
  text-align: center;
`;

const SubLabel = styled.div`
  font-size: 0.875rem;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 0.5rem;
  text-align: center;
`;

export const BenchmarkHUD = () => (
  <HudContainer>
    <MainNumber>790,946</MainNumber>
    <MainLabel>Logs / Second (Zero-Copy Throughput)</MainLabel>
    <SubMetricsContainer>
      <SubMetric>
        <SubValue>&lt; 31µs</SubValue>
        <SubLabel>Latency</SubLabel>
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
  background: ${colors.background};
  border: 1px solid ${colors.border};
  border-radius: 0px; /* brutalist sharp */
  padding: 4rem 2rem;
  margin: 3rem 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  font-family: var(--font-geist-mono), monospace;
  
  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 2rem;
    padding: 3rem 2rem;
  }
`;

const Node = styled.div<{ $isPulsing?: boolean }>`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid ${props => props.$isPulsing ? colors.cyanGlow : colors.border};
  border-radius: 0px; /* brutalist sharp */
  padding: 1.25rem 1rem;
  color: ${props => props.$isPulsing ? colors.cyanGlow : colors.textMain};
  font-size: 0.85rem;
  font-weight: 700;
  text-align: center;
  position: relative;
  z-index: 2;
  backdrop-filter: blur(10px);
  animation: ${props => props.$isPulsing ? pulseAnimation : 'none'} 2.5s infinite ease-in-out;
  box-shadow: ${props => props.$isPulsing ? '0 0 20px rgba(0, 229, 255, 0.2)' : 'none'};
  transition: all 0.3s ease;
  min-width: 130px;
  
  &:hover {
    border-color: ${colors.cyanGlow};
    color: ${colors.cyanGlow};
    transform: translateY(-2px);
    box-shadow: 0 0 15px rgba(0, 229, 255, 0.3);
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

const VerticalLine = styled.div`
  display: none;
  width: 2px;
  height: 30px;
  background: ${colors.cyanGlow};
  opacity: 0.5;
  
  @media (max-width: 1024px) {
    display: block;
  }
`;

export const ZeroCopyDiagram = () => {
  return (
    <DiagramContainer>
      <SvgLines viewBox="0 0 1000 150" preserveAspectRatio="none">
        <path 
          d="M 80 75 L 920 75" 
          stroke={colors.cyanGlow} 
          strokeWidth="3.5" 
          strokeDasharray="6 6"
          fill="none" 
          style={{ filter: 'drop-shadow(0 0 8px rgba(0,229,255,0.7))' }}
        />
      </SvgLines>
      
      <Node>1MB TCP BufReader</Node>
      <VerticalLine />
      <Node $isPulsing>rkyv::access_unchecked</Node>
      <VerticalLine />
      <Node>Aegis Ed25519 Audit</Node>
      <VerticalLine />
      <Node>Loro CRDT Merge</Node>
      <VerticalLine />
      <Node $isPulsing>io_uring NVMe WAL</Node>
    </DiagramContainer>
  );
};
