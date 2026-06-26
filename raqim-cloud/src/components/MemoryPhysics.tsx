'use client';

import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const SectionContainer = styled.section`
  background-color: #000000;
  padding: 120px 24px;
  display: flex;
  justify-content: center;
  border-top: 1px solid #27272a; /* strict 1px border-zinc-800 */
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 48px;
  }
`;

const LeftColumn = styled(motion.div)`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const SectionTag = styled.div`
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff; /* Solid white */
  letter-spacing: 0.15em; /* Wide-tracked */
  text-transform: uppercase;
  margin-bottom: 24px;
`;

const Headline = styled.h2`
  font-family: var(--font-geist-sans), sans-serif;
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  color: #ffffff;
  line-height: 1.1;
  letter-spacing: -0.04em;
  margin: 0 0 24px 0;
`;

const SubHeadline = styled.p`
  font-family: var(--font-geist-sans), sans-serif;
  font-size: 1.125rem;
  color: #a1a1aa;
  line-height: 1.6;
  margin: 0 0 40px 0;
  max-width: 480px;
`;

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const FeatureItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FeatureTitle = styled.div`
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.75rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

const FeatureDesc = styled.div`
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.875rem;
  color: #71717a;
`;

const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const DiagramContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

const DiagramCard = styled.div`
  background: #09090b;
  border: 1px solid #27272a; /* Zinc 800 */
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #27272a;
  padding-bottom: 12px;
`;

const CardTitle = styled.h3`
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.75rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin: 0;
`;

const CardSubtitle = styled.span`
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.75rem;
  color: #71717a;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const NodeRow = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 0.6fr 1.2fr;
  gap: 16px;
  align-items: center;
  position: relative;
`;

const NodeBox = styled.div<{ $accent?: 'cyan' | 'red' | 'zinc' }>`
  background: #000000;
  border: 1px solid ${props => 
    props.$accent === 'cyan' ? '#00e5ff' : 
    props.$accent === 'red' ? '#7f1d1d' : 
    '#27272a'
  };
  padding: 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const NodeLabel = styled.span`
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.75rem;
  font-weight: 700;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const NodeMeta = styled.span<{ $accent?: 'cyan' | 'red' }>`
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.65rem;
  color: ${props => 
    props.$accent === 'cyan' ? '#00e5ff' : 
    props.$accent === 'red' ? '#ef4444' : 
    '#71717a'
  };
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ConnectionArrow = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.75rem;
  color: #3f3f46;
`;

const ActiveVectorContainer = styled.div`
  position: relative;
  height: 1px;
  background: #27272a;
  width: 100%;
  margin-top: 8px;
  overflow: hidden;
`;

const ActiveVectorLine = styled(motion.div)`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  background: #00e5ff;
  width: 80px;
`;

const CodeTerminal = styled.div`
  background: #000000;
  border: 1px solid #27272a;
  border-radius: 0;
  overflow: hidden;
  box-shadow: none;
  display: flex;
  flex-direction: column;
`;

const CodeTerminalHeader = styled.div`
  height: 32px;
  background: #18181b;
  border-bottom: 1px solid #27272a;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 8px;
`;

const MacDot = styled.div<{ $color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${(props) => props.$color};
`;

const CodeTerminalBody = styled.div`
  padding: 24px;
  overflow-x: auto;
`;

const Pre = styled.pre`
  margin: 0;
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #abb2bf;
`;

const Comment = styled.span`
  color: #5c6370;
  font-style: italic;
`;

const Keyword = styled.span`
  color: #c678dd;
`;

const FunctionName = styled.span`
  color: #61afef;
`;

const Variable = styled.span`
  color: #e06c75;
`;

const TypeName = styled.span`
  color: #e5c07b;
`;

const Operator = styled.span`
  color: #56b6c2;
`;

const StringLiteral = styled.span`
  color: #98c379;
`;

export default function MemoryPhysics() {
  return (
    <SectionContainer>
      <ContentWrapper>
        <LeftColumn
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <SectionTag>[ MEMORY ARCHITECTURE ]</SectionTag>
          <Headline>Eradicate Deserialization. Cast Directly to Memory.</Headline>
          <SubHeadline>
            Raqim abandons JSON and HTTP overhead. By weaponizing rkyv, mmap2, and iceoryx2, TCP packets are cast directly to Rust structs. Zero parsing. Zero Garbage Collection pauses. O(1) memory access.
          </SubHeadline>

          <FeatureList>
            <FeatureItem>
              <FeatureTitle>rkyv</FeatureTitle>
              <FeatureDesc>Deterministic Zero-Copy Deserialization.</FeatureDesc>
            </FeatureItem>
            <FeatureItem>
              <FeatureTitle>iceoryx2</FeatureTitle>
              <FeatureDesc>Lock-free, True Zero-Copy IPC.</FeatureDesc>
            </FeatureItem>
            <FeatureItem>
              <FeatureTitle>mmap2</FeatureTitle>
              <FeatureDesc>NVMe-backed continuous memory paging.</FeatureDesc>
            </FeatureItem>
          </FeatureList>
        </LeftColumn>

        <RightColumn>
          <DiagramContainer>
            {/* Legacy Stack Card */}
            <DiagramCard>
              <CardHeader>
                <CardTitle>LEGACY AI STACK</CardTitle>
                <CardSubtitle>DESERIALIZATION BOTTLENECK</CardSubtitle>
              </CardHeader>
              <NodeRow>
                <NodeBox $accent="zinc">
                  <NodeLabel>INCOMING PAYLOAD</NodeLabel>
                  <NodeMeta>128KB JSON STRING</NodeMeta>
                </NodeBox>
                <ConnectionArrow>&gt;&gt;&gt;</ConnectionArrow>
                <NodeBox $accent="red">
                  <NodeLabel>JSON.PARSE()</NodeLabel>
                  <NodeMeta>GC PAUSE OVERHEAD</NodeMeta>
                </NodeBox>
              </NodeRow>
            </DiagramCard>

            {/* Raqim OS Card */}
            <DiagramCard>
              <CardHeader>
                <CardTitle>RAQIM OS (ZERO-COPY)</CardTitle>
                <CardSubtitle style={{ color: '#00e5ff' }}>LATENCY: &lt; 1µs</CardSubtitle>
              </CardHeader>
              <NodeRow>
                <NodeBox $accent="zinc">
                  <NodeLabel>TCP INGRESS</NodeLabel>
                  <NodeMeta>RAW BYTE BUFFER</NodeMeta>
                </NodeBox>
                <ConnectionArrow style={{ color: '#00e5ff' }}>&gt;&gt;&gt;</ConnectionArrow>
                <NodeBox $accent="cyan">
                  <NodeLabel>#[REPR(C)]</NodeLabel>
                  <NodeMeta style={{ color: '#ffffff' }}>rkyv::access</NodeMeta>
                </NodeBox>
              </NodeRow>
              <ActiveVectorContainer>
                <ActiveVectorLine
                  animate={{ x: ['-100%', '500%'] }}
                  transition={{
                    repeat: Infinity,
                    duration: 2.0,
                    ease: 'linear'
                  }}
                />
              </ActiveVectorContainer>
            </DiagramCard>
          </DiagramContainer>

          <CodeTerminal>
            <CodeTerminalHeader>
              <MacDot $color="#ff5f56" />
              <MacDot $color="#ffbd2e" />
              <MacDot $color="#27c93f" />
              <span style={{ marginLeft: '8px', color: '#71717a', fontFamily: 'var(--font-geist-mono)', fontSize: '11px' }}>src/main.rs</span>
            </CodeTerminalHeader>
            <CodeTerminalBody>
              <Pre>
                <Comment>// Zero-Copy Cast: The incoming packet IS the memory layout.</Comment>
                <br />
                <Comment>// Validated alignment check ensures zero hypervisor panic loops.</Comment>
                <br />
                <Keyword>let</Keyword> <Variable>archived_state</Variable> = <TypeName>rkyv</TypeName><Operator>::</Operator><FunctionName>access</FunctionName><Operator>::&lt;</Operator><TypeName>AgentState</TypeName><Operator>,</Operator> <TypeName>rkyv</TypeName><Operator>::</Operator><TypeName>rancor</TypeName><Operator>::</Operator><TypeName>Error</TypeName><Operator>&gt;(&amp;</Operator><Variable>payload_bytes</Variable><Operator>)</Operator>
                <br />
                {'    '}<Operator>.</Operator><FunctionName>expect</FunctionName><Operator>(</Operator><StringLiteral>"FATAL: Cryptographic Memory Alignment Violation"</StringLiteral><Operator>);</Operator>
              </Pre>
            </CodeTerminalBody>
          </CodeTerminal>
        </RightColumn>
      </ContentWrapper>
    </SectionContainer>
  );
}
