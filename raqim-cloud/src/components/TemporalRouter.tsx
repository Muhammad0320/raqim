'use client';

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

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

const RightColumn = styled(motion.div)`
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

const ShellHeader = styled.div`
  height: 36px;
  background: #18181b;
  border-bottom: 1px solid #27272a;
  display: flex;
  align-items: center;
  padding: 0 16px;
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.75rem;
  color: #71717a;
  letter-spacing: 0.05em;
`;

const SvgContainer = styled.div`
  padding: 24px;
  height: 220px;
  position: relative;
`;

const SvgVisual = styled.svg`
  width: 100%;
  height: 100%;
`;

const TerminalPanel = styled(motion.div)`
  background: #09090b;
  border-top: 1px solid #27272a;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const TerminalHeader = styled.div`
  padding: 8px 16px;
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.75rem;
  color: #f59e0b; /* amber */
  font-weight: 600;
  background: rgba(245, 158, 11, 0.05);
  border-bottom: 1px solid rgba(245, 158, 11, 0.1);
  text-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
`;

const TerminalBody = styled.div`
  padding: 16px;
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.875rem;
  color: #e4e4e7;
  line-height: 1.6;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TerminalLine = styled(motion.div)`
  display: flex;
  align-items: flex-start;
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

const TypeName = styled.span`
  color: #e5c07b;
`;

const Variable = styled.span`
  color: #e06c75;
`;

// Helper component for typewriter effect
const TypewriterText = ({ text, delayMs = 30 }: { text: string; delayMs?: number }) => {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.substring(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, delayMs);
    return () => clearInterval(interval);
  }, [text, delayMs]);

  return <>{displayed}</>;
};

export default function TemporalRouter() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    let mounted = true;
    const sequence = async () => {
      const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
      
      while (mounted) {
        setStep(0); // Reset
        await delay(1000);
        setStep(1); // Scrub cursor to 8492
        await delay(1200);
        setStep(2); // Click
        await delay(300);
        setStep(3); // Draw branch
        await delay(800);
        setStep(4); // Open terminal
        await delay(600);
        setStep(5); // Type line 1
        await delay(2000);
        setStep(6); // Type line 2
        await delay(4000);
      }
    };
    sequence();
    return () => { mounted = false; };
  }, []);

  const TX_Y = 50;
  const nodes = [
    { id: '8490', x: 50 },
    { id: '8491', x: 150 },
    { id: '8492', x: 250 },
    { id: '8493', x: 350 },
    { id: '8494', x: 450 },
  ];

  const targetNode = nodes[2]; // 8492
  
  // Cursor positions based on steps
  const cursorVariants = {
    step0: { x: 480, y: 70, scale: 1 },
    step1: { x: targetNode.x + 10, y: targetNode.y + 20, scale: 1 },
    step2: { x: targetNode.x + 10, y: targetNode.y + 20, scale: 0.8 },
    afterClick: { x: targetNode.x + 10, y: targetNode.y + 20, scale: 1, opacity: 0.5 },
  };

  const getCursorVariant = () => {
    if (step === 0) return "step0";
    if (step === 1) return "step1";
    if (step === 2) return "step2";
    return "afterClick";
  };

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
            <ShellHeader>RAQIM CONSOLE // MAIN_CRDT_BRANCH</ShellHeader>
            <SvgContainer>
              <SvgVisual viewBox="0 0 500 180" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <filter id="glowAmber" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glowCyanDag" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Main Branch Lines */}
                <line x1="10" y1={TX_Y} x2="490" y2={TX_Y} stroke="#27272a" strokeWidth="2" />
                
                {/* Fork Path */}
                <motion.path
                  d={`M ${targetNode.x} ${targetNode.y} L ${targetNode.x} 120 L 450 120`}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  filter="url(#glowAmber)"
                  strokeDasharray="4 4"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: step >= 3 ? 1 : 0 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                />

                {/* Main Nodes */}
                {nodes.map((node) => (
                  <g key={node.id}>
                    <circle cx={node.x} cy={TX_Y} r="6" fill="#18181b" stroke="#06b6d4" strokeWidth="2" />
                    <text x={node.x} y={TX_Y - 15} fill="#a1a1aa" fontSize="10" fontFamily="monospace" textAnchor="middle">
                      Tx: {node.id}
                    </text>
                  </g>
                ))}

                {/* Target Node Highlight (8492) */}
                <motion.circle 
                  cx={targetNode.x} cy={TX_Y} r="6" fill="#06b6d4" filter="url(#glowCyanDag)"
                  animate={{ opacity: step >= 2 ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                />

                {/* Phantom Node */}
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: step >= 3 ? 1 : 0 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                >
                  <circle cx="450" cy="120" r="6" fill="#f59e0b" filter="url(#glowAmber)" />
                  <text x="440" y="140" fill="#f59e0b" fontSize="10" fontFamily="monospace" textAnchor="end">
                    phantom_fork_8492
                  </text>
                </motion.g>

                {/* Cursor */}
                <motion.g
                  variants={cursorVariants}
                  animate={getCursorVariant()}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  style={{ transformOrigin: "top left" }}
                >
                  {/* Standard SVG Cursor shape */}
                  <polygon points="0,0 15,10 6,11 0,20" fill="#ffffff" stroke="#000000" strokeWidth="1" />
                </motion.g>

              </SvgVisual>
            </SvgContainer>

            <AnimatePresence>
              {step >= 4 && (
                <TerminalPanel
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <TerminalHeader>[ ISOLATED TELEMETRY STREAM ]</TerminalHeader>
                  <TerminalBody>
                    {step >= 5 && (
                      <TerminalLine>
                        <span style={{ color: '#f59e0b', marginRight: '8px' }}>&gt;</span>
                        <span style={{ color: '#e4e4e7' }}>
                          <TypewriterText text="[PHANTOM_OS] WASI Context Rebuilt. Environment Overrides Injected." delayMs={20} />
                        </span>
                      </TerminalLine>
                    )}
                    {step >= 6 && (
                      <TerminalLine>
                        <span style={{ color: '#f59e0b', marginRight: '8px' }}>&gt;</span>
                        <span style={{ color: '#e4e4e7' }}>
                          <TypewriterText text="[AGENT_HEX] Recalculating fiscal routing table..." delayMs={20} />
                        </span>
                      </TerminalLine>
                    )}
                  </TerminalBody>
                </TerminalPanel>
              )}
            </AnimatePresence>
          </UiShell>

          <CodeContainer>
            <Pre>
              <Comment>// Inject Deep Reality overrides (Environment Variables)</Comment>
              <br />
              <Keyword>pub</Keyword> <Keyword>fn</Keyword> <FunctionName>build_wasi_context</FunctionName>(<Variable>fork</Variable>: <TypeName>Option</TypeName>&lt;<TypeName>ForkConfig</TypeName>&gt;) -&gt; <TypeName>WasiP1Ctx</TypeName> {'{'}
              <br />
              {'    '}<Keyword>let</Keyword> <Keyword>mut</Keyword> <Variable>builder</Variable> = <TypeName>WasiCtxBuilder</TypeName>::<FunctionName>new</FunctionName>();
              <br />
              <br />
              {'    '}<Keyword>if let</Keyword> <TypeName>Some</TypeName>(<Variable>config</Variable>) = fork {'{'}
              <br />
              {'        '}<Keyword>for</Keyword> (<Variable>key</Variable>, <Variable>value</Variable>) <Keyword>in</Keyword> config.env_overrides {'{'}
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
