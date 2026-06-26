'use client';

import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const SectionContainer = styled.section`
  background-color: #09090b;
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
  color: #06b6d4;
  letter-spacing: 0.05em;
  margin-bottom: 24px;
  text-shadow: none;
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
  font-size: 1rem;
  font-weight: 700;
  color: #ffffff;
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

const SvgContainer = styled.div`
  background: #000000;
  border: 1px solid #27272a;
  border-radius: 0;
  padding: 24px;
  box-shadow: none;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SvgVisual = styled.svg`
  width: 100%;
  height: auto;
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
          <SvgContainer>
            <SvgVisual viewBox="0 0 600 380" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="legacyLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3f3f46" />
                  <stop offset="100%" stopColor="#7f1d1d" />
                </linearGradient>
                <linearGradient id="raqimLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0891b2" />
                  <stop offset="100%" stopColor="#00E5FF" />
                </linearGradient>
                <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glowRed" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Legacy Stack Background */}
              <rect x="10" y="10" width="580" height="150" rx="4" fill="#18181b" stroke="#27272a" />
              <text x="30" y="35" fill="#52525b" fontSize="12" fontFamily="monospace" fontWeight="bold">LEGACY AI STACK</text>

              {/* Legacy Line */}
              <line x1="80" y1="90" x2="520" y2="90" stroke="url(#legacyLine)" strokeWidth="2" strokeDasharray="4 4" />

              {/* Legacy Elements */}
              <motion.g
                initial={{ x: -20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <rect x="40" y="70" width="100" height="40" rx="4" fill="#27272a" stroke="#3f3f46" />
                <text x="50" y="94" fill="#a1a1aa" fontSize="12" fontFamily="monospace">Incoming Payload</text>
              </motion.g>

              {/* Bottleneck / GC */}
              <rect x="230" y="60" width="140" height="60" rx="4" fill="#450a0a" stroke="#7f1d1d" filter="url(#glowRed)" />
              <text x="245" y="85" fill="#fca5a5" fontSize="12" fontFamily="monospace">JSON.parse()</text>
              <text x="245" y="105" fill="#ef4444" fontSize="10" fontFamily="monospace">+ Garbage Collector</text>

              {/* Legacy Fragments / CPU Waste Animation */}
              {[...Array(6)].map((_, i) => (
                <motion.circle
                  key={`frag-${i}`}
                  cx="370"
                  cy={80 + (i % 2 === 0 ? i * 2 : -i * 2)}
                  r="2"
                  fill="#ef4444"
                  filter="url(#glowRed)"
                  initial={{ cx: 300, cy: 90, opacity: 0 }}
                  whileInView={{
                    cx: 400 + Math.random() * 40,
                    cy: 50 + Math.random() * 80,
                    opacity: [0, 1, 0]
                  }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}

              <motion.g
                initial={{ x: 20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <rect x="460" y="70" width="80" height="40" rx="4" fill="#27272a" stroke="#3f3f46" />
                <text x="485" y="94" fill="#a1a1aa" fontSize="12" fontFamily="monospace">RAM</text>
              </motion.g>


              {/* Raqim OS Background */}
              <rect x="10" y="180" width="580" height="180" rx="4" fill="#09090b" stroke="#18181b" />
              <text x="30" y="205" fill="#00E5FF" fontSize="12" fontFamily="monospace" fontWeight="bold">RAQIM OS (ZERO-COPY)</text>

              {/* Raqim Line */}
              <line x1="80" y1="260" x2="520" y2="260" stroke="url(#raqimLine)" strokeWidth="2" />
              
              <motion.line
                x1="350" y1="260" x2="350" y2="320"
                stroke="#00E5FF" strokeWidth="2" strokeDasharray="4 4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 1.5 }}
              />

              {/* Raqim Incoming */}
              <motion.g
                initial={{ x: -20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <rect x="40" y="240" width="140" height="40" rx="4" fill="#000000" stroke="#00E5FF" />
                <text x="50" y="264" fill="#00E5FF" fontSize="12" fontFamily="monospace">TCP Ingress (Bytes)</text>
              </motion.g>

              {/* Fast Path Payload Animation */}
              <motion.rect
                width="140" height="40" rx="4" fill="rgba(0, 229, 255, 0.15)" stroke="#00E5FF"
                filter="url(#glowCyan)"
                initial={{ x: 40, y: 240 }}
                whileInView={{ x: 230 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
              />

              {/* Rust Struct Snap Overlay */}
              <motion.g
                initial={{ opacity: 0, scale: 1.1 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.2, delay: 0.9 }}
              >
                <rect x="230" y="235" width="140" height="50" rx="4" fill="rgba(0, 229, 255, 0.1)" stroke="#00E5FF" strokeWidth="2" filter="url(#glowCyan)" />
                <text x="260" y="255" fill="#ffffff" fontSize="14" fontFamily="monospace" fontWeight="bold">#[repr(C)]</text>
                <text x="245" y="275" fill="#00E5FF" fontSize="10" fontFamily="monospace">rkyv::access_unchecked</text>
              </motion.g>

              {/* Telemetry Process IPC */}
              <motion.g
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 1.2 }}
              >
                <rect x="280" y="320" width="140" height="30" rx="4" fill="#18181b" stroke="#00E5FF" />
                <text x="295" y="340" fill="#a1a1aa" fontSize="11" fontFamily="monospace">Telemetry Process</text>
              </motion.g>

              <motion.text
                x="360" y="295" fill="#a1a1aa" fontSize="10" fontFamily="monospace"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 1.6 }}
              >
                iceoryx2 shared memory
              </motion.text>
              
              <motion.text
                x="440" y="340" fill="#00E5FF" fontSize="12" fontFamily="monospace" fontWeight="bold" filter="url(#glowCyan)"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: [0, 1, 0.5, 1] }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 1.8 }}
              >
                Latency: &lt; 1µs
              </motion.text>

            </SvgVisual>
          </SvgContainer>

          <CodeTerminal>
            <CodeTerminalHeader>
              <MacDot $color="#ff5f56" />
              <MacDot $color="#ffbd2e" />
              <MacDot $color="#27c93f" />
              <span style={{ marginLeft: '8px', color: '#71717a', fontFamily: 'var(--font-geist-mono)', fontSize: '11px' }}>memory_cast.rs</span>
            </CodeTerminalHeader>
            <CodeTerminalBody>
              <Pre>
                <Comment>// Zero-Copy Cast: The packet IS the memory.</Comment>
                <br />
                <Keyword>let</Keyword> <Variable>archived_state</Variable> = <Keyword>unsafe</Keyword> <Operator>{'{'}</Operator>
                <br />
                {'    '}<TypeName>rkyv</TypeName><Operator>::</Operator><FunctionName>access_unchecked</FunctionName><Operator>::&lt;&lt;</Operator><TypeName>AgentState</TypeName> <Keyword>as</Keyword> <TypeName>Archive</TypeName><Operator>&gt;::</Operator><TypeName>Archived</TypeName><Operator>&gt;(&amp;</Operator><Variable>payload_bytes</Variable><Operator>)</Operator>
                <br />
                <Operator>{'}'};</Operator>
              </Pre>
            </CodeTerminalBody>
          </CodeTerminal>
        </RightColumn>
      </ContentWrapper>
    </SectionContainer>
  );
}
