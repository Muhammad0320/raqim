'use client';

import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const BlurredChildren = styled.div`
  width: 100%;
  height: 100%;
  filter: blur(8px) grayscale(100%);
  pointer-events: none;
  user-select: none;
`;

const OverlayContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  background: rgba(9, 9, 11, 0.4);
`;

const GlassPanel = styled.div`
  background: rgba(9, 9, 11, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 2.5rem 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  font-family: 'JetBrains Mono', 'Space Mono', monospace;
  position: relative;

  &::before, &::after {
    content: '';
    position: absolute;
    width: 8px;
    height: 8px;
    border: 1px solid #ffffff;
  }

  &::before {
    top: -1px;
    left: -1px;
    border-right: none;
    border-bottom: none;
  }

  &::after {
    bottom: -1px;
    right: -1px;
    border-left: none;
    border-top: none;
  }
`;

const LockIcon = styled.div`
  width: 48px;
  height: 48px;
  border: 2px solid #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: -12px;
    width: 24px;
    height: 16px;
    border: 2px solid #ffffff;
    border-bottom: none;
    border-radius: 12px 12px 0 0;
  }
  
  &::after {
    content: '';
    width: 8px;
    height: 12px;
    background: #ffffff;
    border-radius: 4px;
  }
`;

const LockedTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #ffffff;
  margin: 0;
  text-transform: uppercase;
`;

const Subtext = styled.p`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  max-width: 320px;
  line-height: 1.5;
  margin: 0;

  strong {
    color: #ffffff;
    font-weight: 700;
  }
`;

interface FeatureGateOverlayProps {
  featureName: string;
  children: React.ReactNode;
}

export function FeatureGateOverlay({ featureName, children }: FeatureGateOverlayProps) {
  return (
    <Container>
      <BlurredChildren aria-hidden="true">
        {children}
      </BlurredChildren>
      
      <OverlayContainer>
        <GlassPanel>
          <LockIcon />
          <LockedTitle>[ CAPABILITY LOCKED ]</LockedTitle>
          <Subtext>
            License lacks the <strong>{featureName}</strong> capability. Upgrade to Enterprise.
          </Subtext>
        </GlassPanel>
      </OverlayContainer>
    </Container>
  );
}
