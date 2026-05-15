'use client';

import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const SectionContainer = styled.section`
  background-color: #09090b;
  padding: 120px 24px;
  display: flex;
  justify-content: center;
  border-top: 1px solid rgba(39, 39, 42, 0.5); /* zinc-800 */
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
  text-shadow: 0 0 12px rgba(6, 182, 212, 0.4);
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

const UiShell = styled.div`
  background: #000000;
  border: 1px solid #27272a;
  border-radius: 8px;
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.8);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const GraphArea = styled.div`
  padding: 32px;
  position: relative;
  height: 220px;
  background: radial-gradient(circle at 50% 50%, rgba(39, 39, 42, 0.3) 0%, transparent 70%);
`;

const TerminalPanel = styled(motion.div)`
  background: #09090b;
  border-top: 1px solid #27272a;
  padding: 0 16px;
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.8rem;
  color: #e4e4e7;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const TerminalHeader = styled.div`
  color: #52525b;
  font-weight: bold;
  margin: 12px 0;
  letter-spacing: 0.05em;
  font-size: 0.75rem;
`;

const TerminalLine = styled(motion.div)`
  overflow: hidden;
  white-space: nowrap;
  color: #a1a1aa;
  line-height: 1.8;
`;

const CodeContainer = styled.div`
  background: #000000;
  border: 1px solid #27272a;
  border-left: 2px solid #06b6d4;
  border-radius: 4px;
  padding: 24px;
  overflow-x: auto;
`;

const Pre = styled.pre`
  margin: 0;
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #e4e4e7;
`;

const Comment = styled.span`
  color: #71717a;
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

const StringLiteral = styled.span`
  color: #98c379;
`;

export default function TemporalRouter() {
  const LOOP_DURATION = 8;
  const nodes = [50, 150, 250, 350, 450];
  const targetX = 250;
  const targetY = 80;

  return (
    <SectionContainer>
      <ContentWrapper>
        <LeftColumn
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <SectionTag>[ TEMPORAL ROUTER ]</SectionTag>
          <Headline>Reality Forking. Git for AI State.</Headline>
          <SubHeadline>
            Never guess why an agent hallucinated. Scrub back to any cryptographic tx_id, inject a ForkConfig, and spin up a phantom WASM sandbox. Raqim mutates the WasiP1Ctx environment variables, forcing the agent into an alternate reality without polluting the live Swarm CRDT.
          </SubHeadline>

          <FeatureList>
            <FeatureItem>
              <FeatureTitle>WASM Sandboxing</FeatureTitle>
              <FeatureDesc>Zero-downtime, OS-level environment subversion.</FeatureDesc>
            </FeatureItem>
            <FeatureItem>
              <FeatureTitle>Isolated Telemetry</FeatureTitle>
              <FeatureDesc>Observe the phantom agent via a dedicated, cryptographic SSE stream.</FeatureDesc>
            </FeatureItem>
            <FeatureItem>
              <FeatureTitle>Out-of-Band Eviction</FeatureTitle>
              <FeatureDesc>OS-enforced memory resets for Python SDKs.</FeatureDesc>
            </FeatureItem>
          </FeatureList>
        </LeftColumn>

        <RightColumn>
          <UiShell>
            <GraphArea>
              <svg width="100%" height="100%" viewBox="0 0 500 220" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <filter id="glowOrange" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glowWhite" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Main Branch Line */}
                <line x1="20" y1={targetY} x2="480" y2={targetY} stroke="#3f3f46" strokeWidth="3" />

                {/* Phantom Branch Line (Animated) */}
                <motion.path
                  d={`M ${targetX} ${targetY} Q ${targetX} 160 ${targetX + 80} 160 L ${targetX + 160} 160`}
                  fill="transparent"
                  stroke="#ea580c" /* amber/orange */
                  strokeWidth="3"
                  strokeDasharray="200"
                  filter="url(#glowOrange)"
                  animate={{ strokeDashoffset: [200, 200, 0, 0, 200] }}
                  transition={{ duration: LOOP_DURATION, times: [0, 0.1875, 0.25, 0.875, 1], repeat: Infinity }}
                />

                {/* Main Branch Nodes */}
                {nodes.map((x, i) => (
                  <g key={i}>
                    <circle cx={x} cy={targetY} r="6" fill="#18181b" stroke="#71717a" strokeWidth="2" />
                    {x === targetX && (
                      <motion.circle
                        cx={x} cy={targetY} r="8" fill="none" stroke="#ffffff" strokeWidth="2" filter="url(#glowWhite)"
                        animate={{ opacity: [0, 1, 1, 0, 0], scale: [1, 1.5, 1, 1, 1] }}
                        transition={{ duration: LOOP_DURATION, times: [0, 0.15, 0.875, 0.9, 1], repeat: Infinity }}
                      />
                    )}
                  </g>
                ))}

                {/* Phantom Branch Node (Animated) */}
                <motion.circle
                  cx={targetX + 80} cy={160} r="6" fill="#18181b" stroke="#ea580c" strokeWidth="2" filter="url(#glowOrange)"
                  animate={{ opacity: [0, 0, 1, 1, 0] }}
                  transition={{ duration: LOOP_DURATION, times: [0, 0.22, 0.25, 0.875, 1], repeat: Infinity }}
                />
                <motion.text
                  x={targetX + 95} y={164} fill="#ea580c" fontSize="10" fontFamily="monospace" filter="url(#glowOrange)"
                  animate={{ opacity: [0, 0, 1, 1, 0] }}
                  transition={{ duration: LOOP_DURATION, times: [0, 0.22, 0.25, 0.875, 1], repeat: Infinity }}
                >
                  phantom_fork_8492
                </motion.text>

                {/* TxID Label for Target Node */}
                <text x={targetX - 30} y={targetY - 16} fill="#a1a1aa" fontSize="10" fontFamily="monospace">TxID: 8492</text>

                {/* Cursor (Animated) */}
                <motion.g
                  animate={{ 
                    x: [350, targetX + 10, targetX + 10, targetX + 10, 350],
                    y: [targetY + 40, targetY + 10, targetY + 10, targetY + 10, targetY + 40],
                    scale: [1, 1, 0.8, 1, 1]
                  }}
                  transition={{ 
                    duration: LOOP_DURATION, 
                    times: [0, 0.125, 0.15, 0.875, 1], 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <path d="M0 0 L 12 12 L 5 12 L 5 20 L -2 16 L 0 0 Z" fill="#ffffff" stroke="#000000" strokeWidth="1" filter="url(#glowWhite)"/>
                </motion.g>

              </svg>
            </GraphArea>

            <TerminalPanel
              animate={{ height: [0, 0, 100, 100, 0], opacity: [0, 0, 1, 1, 0], paddingBottom: [0, 0, 16, 16, 0] }}
              transition={{ duration: LOOP_DURATION, times: [0, 0.25, 0.3125, 0.875, 1], repeat: Infinity, ease: "easeInOut" }}
            >
              <TerminalHeader>[ ISOLATED TELEMETRY STREAM ]</TerminalHeader>
              <TerminalLine
                animate={{ width: ["0%", "0%", "100%", "100%", "0%"] }}
                transition={{ duration: LOOP_DURATION, times: [0, 0.3125, 0.5, 0.875, 1], repeat: Infinity, ease: "linear" }}
              >
                <span style={{ color: '#06b6d4' }}>[PHANTOM_OS]</span> WASI Context Rebuilt. Environment Overrides Injected.
              </TerminalLine>
              <TerminalLine
                animate={{ width: ["0%", "0%", "100%", "100%", "0%"] }}
                transition={{ duration: LOOP_DURATION, times: [0, 0.5, 0.6875, 0.875, 1], repeat: Infinity, ease: "linear" }}
              >
                <span style={{ color: '#ea580c' }}>[AGENT_HEX]</span> Recalculating fiscal routing table...
              </TerminalLine>
            </TerminalPanel>
          </UiShell>

          <CodeContainer>
            <Pre>
              <Comment>// Inject Deep Reality overrides (Environment Variables)</Comment>
              <br />
              <Keyword>pub fn</Keyword> <FunctionName>build_wasi_context</FunctionName>(<Variable>fork</Variable>: Option&lt;ForkConfig&gt;) -&gt; WasiP1Ctx {'{'}
              <br />
              {'    '}<Keyword>let mut</Keyword> <Variable>builder</Variable> = WasiCtxBuilder::<FunctionName>new</FunctionName>();
              <br />
              <br />
              {'    '}<Keyword>if let</Keyword> Some(config) = fork {'{'}
              <br />
              {'        '}<Keyword>for</Keyword> (key, value) <Keyword>in</Keyword> config.env_overrides {'{'}
              <br />
              {'            '}builder.<FunctionName>env</FunctionName>(&amp;key, &amp;value); <Comment>// The agent wakes up in a new reality</Comment>
              <br />
              {'        }'}
              <br />
              {'    }'}
              <br />
              {'    '}builder.<FunctionName>build_p1</FunctionName>()
              <br />
              {'}'}
            </Pre>
          </CodeContainer>
        </RightColumn>
      </ContentWrapper>
    </SectionContainer>
  );
}
