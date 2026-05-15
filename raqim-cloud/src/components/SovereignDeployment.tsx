'use client';

import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';

const SectionContainer = styled.section`
  background-color: #000000;
  padding: 160px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-top: 1px solid rgba(39, 39, 42, 0.5); /* zinc-800 */
`;

const ContentWrapper = styled.div`
  max-width: 1000px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const Headline = styled.h2`
  font-family: var(--font-geist-sans), sans-serif;
  font-size: clamp(3rem, 6vw, 5rem);
  font-weight: 800;
  color: #ffffff;
  line-height: 1.1;
  letter-spacing: -0.04em;
  margin: 0 0 32px 0;
  background: linear-gradient(to bottom, #ffffff, #a1a1aa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const SubHeadline = styled.p`
  font-family: var(--font-geist-sans), sans-serif;
  font-size: clamp(1.125rem, 2vw, 1.5rem);
  color: #a1a1aa;
  line-height: 1.6;
  margin: 0 0 80px 0;
  max-width: 800px;
`;

const PipelineGrid = styled.div`
  display: flex;
  gap: 24px;
  width: 100%;
  margin-bottom: 80px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const PipelineCard = styled.div`
  flex: 1;
  background: #09090b;
  border: 1px solid #27272a;
  border-radius: 8px;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 1px;
    background: #06b6d4;
    box-shadow: 0 0 20px 2px #06b6d4;
  }
`;

const CardVisual = styled.div`
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  width: 100%;
`;

const CodeBlock = styled.div`
  background: #000000;
  border: 1px solid #27272a;
  padding: 12px 16px;
  border-radius: 4px;
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.8rem;
  color: #06b6d4;
  word-break: break-all;
  width: 100%;
  text-align: center;
  box-shadow: inset 0 0 10px rgba(6, 182, 212, 0.1);
`;

const HardwareVisual = styled.svg`
  width: 60px;
  height: 60px;
  filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.4));
`;

const CardTitle = styled.div`
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 8px;
  letter-spacing: 0.05em;
`;

const CardDesc = styled.div`
  font-family: var(--font-geist-sans), sans-serif;
  font-size: 0.875rem;
  color: #71717a;
`;

const CtaContainer = styled.div`
  display: flex;
  gap: 16px;

  @media (max-width: 640px) {
    flex-direction: column;
    width: 100%;
    align-items: center;
  }
`;

const PrimaryCta = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 32px;
  height: 56px;
  background: #ffffff;
  color: #000000;
  font-family: var(--font-geist-mono), monospace;
  font-size: 1rem;
  font-weight: 700;
  text-decoration: none;
  border-radius: 4px;
  transition: all 0.2s ease;
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);

  &:hover {
    background: #e4e4e7;
    box-shadow: 0 0 30px rgba(255, 255, 255, 0.4);
    transform: translateY(-2px);
  }
`;

const SecondaryCta = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 32px;
  height: 56px;
  background: transparent;
  color: #e4e4e7;
  font-family: var(--font-geist-mono), monospace;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  border-radius: 4px;
  border: 1px solid #3f3f46;
  transition: all 0.2s ease;

  &:hover {
    background: #18181b;
    border-color: #52525b;
    color: #ffffff;
  }
`;

export default function SovereignDeployment() {
  return (
    <SectionContainer>
      <ContentWrapper>
        <Headline>Your Hardware. Our Physics.</Headline>
        <SubHeadline>
          Raqim is not a wrapper. It is a 40MB Distroless Docker image. Deploy it via our official Helm Charts on bare-metal Kubernetes. You own the VPC. You own the data. We just supply the math.
        </SubHeadline>

        <PipelineGrid>
          {/* Box 1 */}
          <PipelineCard>
            <CardVisual>
              <CodeBlock>ghcr.io/raqim-os/raqim-core:v1.0</CodeBlock>
            </CardVisual>
            <CardTitle>THE ARTIFACT</CardTitle>
            <CardDesc>40MB Distroless Container.</CardDesc>
          </PipelineCard>

          {/* Box 2 */}
          <PipelineCard>
            <CardVisual>
              <CodeBlock>helm install raqim</CodeBlock>
            </CardVisual>
            <CardTitle>THE ORCHESTRATOR</CardTitle>
            <CardDesc>StatefulSet & PVCs Native.</CardDesc>
          </PipelineCard>

          {/* Box 3 */}
          <PipelineCard>
            <CardVisual>
              <HardwareVisual viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                <line x1="6" y1="6" x2="6.01" y2="6" />
                <line x1="6" y1="18" x2="6.01" y2="18" />
                <line x1="10" y1="6" x2="18" y2="6" />
                <line x1="10" y1="18" x2="18" y2="18" />
              </HardwareVisual>
            </CardVisual>
            <CardTitle>THE HARDWARE</CardTitle>
            <CardDesc>Hetzner / AWS / Bare-Metal.</CardDesc>
          </PipelineCard>
        </PipelineGrid>

        <CtaContainer>
          <PrimaryCta href="/docs">[ Read the Docs ]</PrimaryCta>
          <SecondaryCta href="https://github.com/raqim" target="_blank" rel="noopener noreferrer">
            [ View GitHub ]
          </SecondaryCta>
        </CtaContainer>
      </ContentWrapper>
    </SectionContainer>
  );
}
