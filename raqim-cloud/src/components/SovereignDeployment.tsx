'use client';

import React from 'react';
import styled, { keyframes } from 'styled-components';
import Link from 'next/link';

const SectionContainer = styled.section`
  background-color: #000000;
  padding: 160px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-top: 1px solid #27272a; /* strict 1px border-zinc-800 */
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const Headline = styled.h2`
  font-family: var(--font-geist-sans), sans-serif;
  font-size: clamp(3rem, 6vw, 5rem);
  font-weight: 950;
  line-height: 1.1;
  letter-spacing: -0.04em;
  margin: 0 0 32px 0;
  color: #ffffff; /* Solid white */
`;

const SubHeadline = styled.p`
  font-family: var(--font-geist-sans), sans-serif;
  font-size: clamp(1.125rem, 2vw, 1.35rem);
  color: #a1a1aa; /* Zinc 400 */
  line-height: 1.6;
  margin: 0 0 80px 0;
  max-width: 800px;
`;

const PipelineGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  width: 100%;
  margin-bottom: 80px;
  background-color: #09090b;
  border: 1px solid #27272a; /* strict 1px border-zinc-800 grid outline */

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const PipelineCard = styled.div`
  padding: 48px 32px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  border-right: 1px solid #27272a;

  &:last-child {
    border-right: none;
  }

  @media (max-width: 1024px) {
    border-right: none;
    border-bottom: 1px solid #27272a;
    &:last-child {
      border-bottom: none;
    }
  }
`;

const CardTitle = styled.div`
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.875rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const CardDesc = styled.div`
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.875rem;
  color: #71717a; /* Zinc 500 */
  line-height: 1.5;
  margin-bottom: 24px;
`;

const TerminalBlock = styled.div`
  background: #000000;
  border: 1px solid #27272a;
  border-radius: 0;
  padding: 16px;
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.8rem;
  width: 100%;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: none;
`;

const Prompt = styled.span`
  color: #a1a1aa;
`;

const OutputLog = styled.span`
  color: #a1a1aa;
`;

const VisualWrapper = styled.div`
  background: #000000;
  border: 1px solid #27272a;
  border-radius: 0;
  padding: 16px;
  width: 100%;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ServerRackSvg = styled.svg`
  width: 100%;
  max-width: 220px;
  height: auto;
`;

const blinkLED = keyframes`
  0%, 100% { fill: #27272a; }
  50% { fill: #ffffff; }
`;

const LEDCircle = styled.circle<{ $delay: string }>`
  animation: ${blinkLED} 0.7s infinite ease-in-out;
  animation-delay: ${props => props.$delay};
`;

const CtaContainer = styled.div`
  display: flex;
  gap: 20px;

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
  font-size: 0.95rem;
  font-weight: 700;
  text-decoration: none;
  border-radius: 0;
  transition: all 0.25s ease;
  box-shadow: none;

  &:hover {
    background: #e4e4e7;
    box-shadow: none;
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
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  border-radius: 0;
  border: 1px solid #3f3f46;
  transition: all 0.25s ease;

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
          Raqim is a 40MB Distroless binary. Deploy it via official Helm Charts on bare-metal Kubernetes. You own the VPC. You own the data. We supply the math.
        </SubHeadline>

        <PipelineGrid>
          {/* Card 1: THE ARTIFACT */}
          <PipelineCard>
            <CardTitle>THE ARTIFACT</CardTitle>
            <CardDesc>40MB Distroless container hosted on GHCR.</CardDesc>
            <TerminalBlock>
              <div>
                <Prompt>$ </Prompt>
                <OutputLog style={{ color: '#ffffff' }}>docker pull ghcr.io/raqim-os/raqim-core:v1.0</OutputLog>
              </div>
              <OutputLog>v1.0: Pulling from raqim-core</OutputLog>
              <OutputLog>Digest: sha256:7f08b3ac...</OutputLog>
              <OutputLog style={{ color: '#ffffff' }}>Status: Downloaded newer image [40MB]</OutputLog>
            </TerminalBlock>
          </PipelineCard>

          {/* Card 2: THE ORCHESTRATOR */}
          <PipelineCard>
            <CardTitle>THE ORCHESTRATOR</CardTitle>
            <CardDesc>Kubernetes StatefulSets with native local PVC mmap.</CardDesc>
            <TerminalBlock>
              <div>
                <Prompt>$ </Prompt>
                <OutputLog style={{ color: '#ffffff' }}>helm repo add raqim charts.raqim.sh</OutputLog>
              </div>
              <div>
                <Prompt>$ </Prompt>
                <OutputLog style={{ color: '#ffffff' }}>helm install raqim-os raqim/raqim-os</OutputLog>
              </div>
              <OutputLog style={{ color: '#71717a' }}>deploying statefulset/raqim-core...</OutputLog>
            </TerminalBlock>
          </PipelineCard>

          {/* Card 3: THE HARDWARE */}
          <PipelineCard>
            <CardTitle>THE HARDWARE</CardTitle>
            <CardDesc>Server diagnostics and local NVMe disk arrays.</CardDesc>
            <VisualWrapper>
              <ServerRackSvg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Rack Unit 1 */}
                <rect x="5" y="8" width="190" height="18" rx="2" fill="#09090b" stroke="#27272a" strokeWidth="1.5" />
                <text x="18" y="20" fill="#52525b" fontSize="8" fontFamily="monospace">NODE-01</text>
                <LEDCircle cx="130" cy="17" r="2.5" $delay="0s" />
                <LEDCircle cx="142" cy="17" r="2.5" $delay="0.2s" />
                <LEDCircle cx="154" cy="17" r="2.5" $delay="0.1s" />
                <LEDCircle cx="166" cy="17" r="2.5" $delay="0.3s" />
                <LEDCircle cx="178" cy="17" r="2.5" $delay="0.15s" />

                {/* Rack Unit 2 */}
                <rect x="5" y="31" width="190" height="18" rx="2" fill="#09090b" stroke="#27272a" strokeWidth="1.5" />
                <text x="18" y="43" fill="#52525b" fontSize="8" fontFamily="monospace">NODE-02</text>
                <LEDCircle cx="130" cy="40" r="2.5" $delay="0.1s" />
                <LEDCircle cx="142" cy="40" r="2.5" $delay="0.3s" />
                <LEDCircle cx="154" cy="40" r="2.5" $delay="0.15s" />
                <LEDCircle cx="166" cy="40" r="2.5" $delay="0.05s" />
                <LEDCircle cx="178" cy="40" r="2.5" $delay="0.25s" />

                {/* Rack Unit 3 */}
                <rect x="5" y="54" width="190" height="18" rx="2" fill="#09090b" stroke="#27272a" strokeWidth="1.5" />
                <text x="18" y="66" fill="#52525b" fontSize="8" fontFamily="monospace">NVME-00</text>
                <LEDCircle cx="130" cy="63" r="2.5" $delay="0.2s" />
                <LEDCircle cx="142" cy="63" r="2.5" $delay="0.05s" />
                <LEDCircle cx="154" cy="63" r="2.5" $delay="0.35s" />
                <LEDCircle cx="166" cy="63" r="2.5" $delay="0.15s" />
                <LEDCircle cx="178" cy="63" r="2.5" $delay="0s" />
              </ServerRackSvg>
            </VisualWrapper>
          </PipelineCard>
        </PipelineGrid>

        <CtaContainer>
          <PrimaryCta href="/docs">[ Read the Docs ]</PrimaryCta>
          <SecondaryCta href="https://github.com/muhammad0320/synapse" target="_blank" rel="noopener noreferrer">
            [ View GitHub ]
          </SecondaryCta>
        </CtaContainer>
      </ContentWrapper>
    </SectionContainer>
  );
}
