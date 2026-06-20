'use client';

import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
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
  grid-template-columns: 0.95fr 1.05fr;
  background-color: #000000;
  border: 1px solid #27272a; /* strict 1px border-zinc-800 */
  overflow: hidden;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const LeftColumn = styled(motion.div)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 64px 48px;
  border-right: 1px solid #27272a; /* strict 1px border-zinc-800 */

  @media (max-width: 1024px) {
    border-right: none;
    border-bottom: 1px solid #27272a;
  }
`;

const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #09090b;
`;

const SectionTag = styled.div`
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.875rem;
  font-weight: 600;
  color: #00E5FF; /* sharp cyan */
  letter-spacing: 0.05em;
  margin-bottom: 24px;
  text-shadow: 0 0 12px rgba(0, 229, 255, 0.4);
`;

const Headline = styled.h2`
  font-family: var(--font-geist-sans), sans-serif;
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 950;
  color: #ffffff;
  line-height: 1.05;
  letter-spacing: -0.04em;
  margin: 0 0 24px 0;
`;

const SubHeadline = styled.p`
  font-family: var(--font-geist-sans), sans-serif;
  font-size: 1.125rem;
  color: #a1a1aa; /* Zinc 400 */
  line-height: 1.6;
  margin: 0 0 40px 0;
  max-width: 480px;
`;

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  border-top: 1px solid #27272a;
  padding-top: 32px;
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
  color: #a1a1aa; /* Zinc 400 */
`;

const UiShell = styled.div`
  background: #000000;
  border-bottom: 1px solid #27272a;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const GraphArea = styled.div`
  padding: 32px;
  position: relative;
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SvgVisual = styled.svg`
  width: 100%;
  height: auto;
  max-width: 480px;
`;

const TerminalPanel = styled.div`
  background: #000000;
  border-top: 1px solid #27272a;
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.8rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const TerminalHeader = styled.div`
  background: #18181b;
  color: #71717a;
  font-weight: bold;
  padding: 8px 16px;
  letter-spacing: 0.05em;
  font-size: 0.7rem;
  border-bottom: 1px solid #27272a;
`;

const TerminalBody = styled.div`
  padding: 16px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  background-color: #000000;
`;

const TerminalLine = styled.div`
  white-space: pre-wrap;
  color: #abb2bf;
  line-height: 1.7;
`;

const Cursor = styled.span`
  display: inline-block;
  width: 8px;
  height: 14px;
  background-color: #abb2bf;
  margin-left: 4px;
  vertical-align: middle;
  animation: blink 1s step-end infinite;

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
`;

const CodeTerminal = styled.div`
  background: #09090b;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const CodeTerminalHeader = styled.div`
  height: 36px;
  background: #18181b;
  border-bottom: 1px solid #27272a;
  display: flex;
  align-items: center;
  padding: 0 16px;
  justify-content: space-between;
`;

const MacDotsRow = styled.div`
  display: flex;
  gap: 8px;
`;

const MacDot = styled.div<{ $color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${(props) => props.$color};
`;

const FileTab = styled.span`
  color: #71717a;
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.75rem;
`;

const EditorContainer = styled.div`
  display: flex;
  background: #09090b;
  padding: 24px;
  overflow-x: auto;
`;

const LineNumbersGutter = styled.div`
  color: #5c6370;
  text-align: right;
  padding-right: 16px;
  user-select: none;
  border-right: 1px solid #27272a;
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.875rem;
  line-height: 1.6;
`;

const CodeBody = styled.div`
  padding-left: 16px;
  flex: 1;
`;

const Pre = styled.pre`
  margin: 0;
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #abb2bf;
`;

const VimStatusLine = styled.div`
  background: #18181b;
  color: #abb2bf;
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.75rem;
  display: flex;
  justify-content: space-between;
  padding: 6px 12px;
  font-weight: bold;
  border-top: 1px solid #27272a;
`;

const VimMode = styled.span`
  background: #61afef; /* blue mode indicator */
  color: #18181b;
  padding: 1px 6px;
  margin-right: 8px;
  font-weight: 900;
  text-transform: uppercase;
`;

// One Dark Pro Syntax Highlight Spans
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

const pulseOrange = keyframes`
  0% {
    stroke-width: 1.5;
    stroke-opacity: 0.6;
  }
  50% {
    stroke-width: 3.5;
    stroke-opacity: 1;
  }
  100% {
    stroke-width: 1.5;
    stroke-opacity: 0.6;
  }
`;

const SandboxContainer = styled.rect`
  stroke: #ea580c;
  fill: rgba(234, 88, 12, 0.08);
  animation: ${pulseOrange} 2s infinite ease-in-out;
`;

const pulseForkLine = keyframes`
  from {
    stroke-dashoffset: 40;
  }
  to {
    stroke-dashoffset: 0;
  }
`;

const ForkLine = styled.path`
  stroke: #ea580c;
  stroke-width: 2.5;
  stroke-dasharray: 6 4;
  fill: none;
  animation: ${pulseForkLine} 1.5s linear infinite;
`;

const SYSTEM_LOGS = [
  "[TIME MACHINE] Generating Ephemeral Sandbox Credentials for Phantom: 8f3a9b...",
  "[TIME MACHINE] Injected 4 deep environment variables",
  "[SYSTEM] LanceDB Snapshot Secured for TxID: 1780842242",
  "[PHANTOM_OS] WASI Context Rebuilt. Booting Deterministic Hypervisor..."
];

export default function TemporalRouter() {
  const [typedLogs, setTypedLogs] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let active = true;
    const runTypewriter = async () => {
      setTypedLogs([]);
      setIsComplete(false);
      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      for (let i = 0; i < SYSTEM_LOGS.length; i++) {
        if (!active) return;
        const line = SYSTEM_LOGS[i];
        setTypedLogs((prev) => [...prev, ""]);

        for (let j = 0; j < line.length; j++) {
          if (!active) return;
          setTypedLogs((prev) => {
            const next = [...prev];
            next[i] = line.substring(0, j + 1);
            return next;
          });
          await delay(10);
        }
        await delay(500); // pause 500ms between lines
      }
      if (active) {
        setIsComplete(true);
      }
    };

    runTypewriter();
    return () => {
      active = false;
    };
  }, []);

  const nodes = [60, 130, 200, 270, 340, 410];
  const forkNodeX = 200; // TxID: 1780842242
  const timelineY = 80;

  return (
    <SectionContainer id="toolchain">
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
            Never guess why an agent hallucinated. Scrub back to any transaction. Raqim mutates the WasiP1Ctx environment variables, forcing the agent into an alternate reality without polluting the live Swarm CRDT.
          </SubHeadline>

          <FeatureList>
            <FeatureItem>
              <FeatureTitle>Ephemeral WASM Contexts</FeatureTitle>
              <FeatureDesc>Spins up sandboxed virtual runtimes on the fly to replay state sequences.</FeatureDesc>
            </FeatureItem>
            <FeatureItem>
              <FeatureTitle>State-Variable Isolation</FeatureTitle>
              <FeatureDesc>Mutates WasiP1Ctx environment pointers dynamically without affecting main memory.</FeatureDesc>
            </FeatureItem>
          </FeatureList>
        </LeftColumn>

        <RightColumn>
          <UiShell>
            <GraphArea>
              <SvgVisual viewBox="0 0 500 220" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <filter id="glowOrange" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glowWhite" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Main Branch Line */}
                <line x1="30" y1={timelineY} x2="470" y2={timelineY} stroke="#27272a" strokeWidth="2.5" />

                {/* Orthogonal Fork Branch downwards in stark Orange */}
                <ForkLine d={`M ${forkNodeX} ${timelineY} L ${forkNodeX} 145 L 275 145`} />

                {/* Pulsating Phantom WASM Sandbox Container */}
                <g>
                  <SandboxContainer x="275" y="115" width="180" height="60" rx="4" />
                  <text x="290" y="133" fill="#ea580c" fontSize="10" fontFamily="monospace" fontWeight="bold">PHANTOM WASM SANDBOX</text>
                  <text x="290" y="151" fill="#ffffff" fontSize="9" fontFamily="monospace">TX REF: 1780842242</text>
                  <text x="290" y="165" fill="#71717a" fontSize="9" fontFamily="monospace">STATUS: ISOLATED RUNTIME</text>
                </g>

                {/* Main Branch Nodes */}
                {nodes.map((x, i) => {
                  const isForkNode = x === forkNodeX;
                  const isHeadNode = i === nodes.length - 1;
                  return (
                    <g key={i}>
                      <circle
                        cx={x} cy={timelineY} r={isForkNode ? "7" : "5"}
                        fill={isForkNode ? "#ea580c" : "#09090b"}
                        stroke={isForkNode ? "#ea580c" : (isHeadNode ? "#00E5FF" : "#27272a")}
                        strokeWidth="2"
                      />
                      {isForkNode && (
                        <circle
                          cx={x} cy={timelineY} r="12"
                          fill="none" stroke="#ea580c" strokeWidth="1.5" strokeOpacity="0.4"
                          filter="url(#glowOrange)"
                        />
                      )}
                      <text x={x - 18} y={timelineY - 12} fill={isForkNode ? "#ea580c" : "#52525b"} fontSize="8" fontFamily="monospace">
                        {isForkNode ? "tx_2242" : `tx_224${i}`}
                      </text>
                    </g>
                  );
                })}

                <text x={forkNodeX - 45} y={timelineY + 20} fill="#ea580c" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  [Fork Point]
                </text>
              </SvgVisual>
            </GraphArea>

            <TerminalPanel>
              <TerminalHeader>SYSTEM LOGS // CORE DAEMON TELEMETRY</TerminalHeader>
              <TerminalBody>
                {typedLogs.map((line, index) => {
                  const isLastLine = index === typedLogs.length - 1;
                  const isTimeMachine = line.startsWith("[TIME MACHINE]");
                  const isSystem = line.startsWith("[SYSTEM]");
                  const isPhantom = line.startsWith("[PHANTOM_OS]");

                  let prefixColor = "#a1a1aa";
                  if (isTimeMachine) prefixColor = "#ea580c";
                  if (isSystem) prefixColor = "#71717a";
                  if (isPhantom) prefixColor = "#00E5FF";

                  const prefixMatch = line.match(/^(\[[A-Z0-9_ ]+\])(.*)/);
                  const bracket = prefixMatch ? prefixMatch[1] : "";
                  const text = prefixMatch ? prefixMatch[2] : line;

                  return (
                    <TerminalLine key={index}>
                      <span style={{ color: prefixColor, fontWeight: 'bold' }}>{bracket}</span>
                      <span style={{ color: '#ffffff' }}>{text}</span>
                      {isLastLine && !isComplete && <Cursor />}
                    </TerminalLine>
                  );
                })}
                {typedLogs.length === 0 && (
                  <TerminalLine>
                    <Cursor />
                  </TerminalLine>
                )}
              </TerminalBody>
            </TerminalPanel>
          </UiShell>
        </RightColumn>

        {/* WASI Code Snip Neovim Terminal */}
        <div style={{ gridColumn: 'span 2', width: '100%', borderTop: '1px solid #27272a' }}>
          <CodeTerminal>
            <CodeTerminalHeader>
              <MacDotsRow>
                <MacDot $color="#ff5f56" />
                <MacDot $color="#ffbd2e" />
                <MacDot $color="#27c93f" />
              </MacDotsRow>
              <FileTab>wasi_env.rs</FileTab>
            </CodeTerminalHeader>
            <EditorContainer>
              <LineNumbersGutter>
                1
                <br />
                2
                <br />
                3
                <br />
                4
                <br />
                5
                <br />
                6
                <br />
                7
                <br />
                8
                <br />
                9
                <br />
                10
              </LineNumbersGutter>
              <CodeBody>
                <Pre>
                  <Comment>// Inject Deep Reality overrides (Environment Variables)</Comment>
                  <br />
                  <Keyword>pub fn</Keyword> <FunctionName>build_wasi_context</FunctionName>(<Variable>fork</Variable>: <TypeName>Option</TypeName>&lt;<TypeName>ForkConfig</TypeName>&gt;) -&gt; <TypeName>WasiP1Ctx</TypeName> <Operator>{'{'}</Operator>
                  <br />
                  {'    '}<Keyword>let mut</Keyword> <Variable>builder</Variable> = <TypeName>WasiCtxBuilder</TypeName><Operator>::</Operator><FunctionName>new</FunctionName><Operator>()</Operator>;
                  <br />
                  <br />
                  {'    '}<Keyword>if let</Keyword> <TypeName>Some</TypeName><Operator>(</Operator><Variable>config</Variable><Operator>)</Operator> = <Variable>fork</Variable> <Operator>{'{'}</Operator>
                  <br />
                  {'        '}<Keyword>for</Keyword> <Operator>(</Operator><Variable>key</Variable>, <Variable>value</Variable><Operator>)</Operator> <Keyword>in</Keyword> <Variable>config</Variable>.<Variable>env_overrides</Variable> <Operator>{'{'}</Operator>
                  <br />
                  {'            '}<Variable>builder</Variable>.<FunctionName>env</FunctionName><Operator>(&amp;</Operator><Variable>key</Variable>, <Operator>&amp;</Operator><Variable>value</Variable><Operator>)</Operator>; <Comment>// Agent reality mutation</Comment>
                  <br />
                  {'        }'}
                  <br />
                  {'    }'}
                  <br />
                  {'    '}<Variable>builder</Variable>.<FunctionName>build_p1</FunctionName><Operator>()</Operator>
                  <br />
                  <Operator>{'}'}</Operator>
                </Pre>
              </CodeBody>
            </EditorContainer>
            <VimStatusLine>
              <div>
                <VimMode>NORMAL</VimMode>
                <span>src/sandbox/wasi_env.rs</span>
              </div>
              <div>
                <span>utf-8 [rust] 10:1</span>
              </div>
            </VimStatusLine>
          </CodeTerminal>
        </div>
      </ContentWrapper>
    </SectionContainer>
  );
}
