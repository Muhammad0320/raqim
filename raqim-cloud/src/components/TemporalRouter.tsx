'use client';

import React, { useEffect, useState } from 'react';
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
  grid-template-columns: 1fr 1fr; /* Symmetric grid system */
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
  color: #ffffff; /* Solid white */
  letter-spacing: 0.15em; /* Wide-tracked */
  text-transform: uppercase;
  margin-bottom: 24px;
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
  flex: 1;
`;

const GraphArea = styled.div`
  padding: 32px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1.2;
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
  flex: 0.8;
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
  display: flex;
  flex-direction: column;
  background-color: #000000;
  flex: 1;
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
  flex: 1;
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
  flex: 1;
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

  const timelineY = 60;
  const forkNodeX = 180;

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
              <SvgVisual viewBox="0 0 500 200" preserveAspectRatio="xMidYMid meet">
                {/* Baseline wire (Live Swarm CRDT) */}
                <line x1="30" y1={timelineY} x2="470" y2={timelineY} stroke="#27272a" strokeWidth="2" />
                <text x="30" y={timelineY - 12} fill="#a1a1aa" fontSize="8" fontFamily="var(--font-geist-mono), monospace" fontWeight="bold">LIVE SWARM CRDT BASELINE</text>

                {/* Fork Simulation Node */}
                <circle cx={forkNodeX} cy={timelineY} r="5" fill="#ea580c" stroke="#ea580c" strokeWidth="1" />
                <text x={forkNodeX - 25} y={timelineY + 18} fill="#ea580c" fontSize="8" fontFamily="var(--font-geist-mono), monospace" fontWeight="bold">TX: 1780842242</text>

                {/* Sandboxed Parallel Thread shooting out */}
                <motion.path
                  d={`M ${forkNodeX} ${timelineY} Q ${forkNodeX + 40} 130 ${forkNodeX + 80} 130 L 470 130`}
                  fill="none"
                  stroke="#ea580c"
                  strokeWidth="1.5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Sandboxed parallel thread annotation */}
                <text x="270" y="118" fill="#ea580c" fontSize="7" fontFamily="var(--font-geist-mono), monospace" fontWeight="bold">PHANTOM WASM SANDBOX (ISOLATED)</text>

                {/* Nodes along baseline wire */}
                {[60, 120, 240, 300, 360, 420].map((cx, idx) => (
                  <circle key={`base-node-${idx}`} cx={cx} cy={timelineY} r="3" fill="#09090b" stroke="#27272a" strokeWidth="1" />
                ))}
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

          <CodeTerminal>
            <CodeTerminalHeader>
              <MacDotsRow>
                <MacDot $color="#ff5f56" />
                <MacDot $color="#ffbd2e" />
                <MacDot $color="#27c93f" />
              </MacDotsRow>
              <FileTab>router.rs</FileTab>
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
                <br />
                11
                <br />
                12
              </LineNumbersGutter>
              <CodeBody>
                <Pre>
                  <Comment>// Derive unique 16-byte cryptographic salt directly from the target TxID</Comment>
                  <br />
                  <Keyword>let</Keyword> <Variable>tx_id_bytes</Variable> = <Variable>target_tx_id</Variable>.<FunctionName>unwrap_or</FunctionName>(<Operator>0</Operator>).<FunctionName>to_be_bytes</FunctionName>();
                  <br />
                  <Keyword>let mut</Keyword> <Variable>salt</Variable> = <Operator>[</Operator><Operator>0u8</Operator>; <Operator>16</Operator><Operator>]</Operator>;
                  <br />
                  <Variable>salt</Variable><Operator>[</Operator><Operator>0</Operator><Operator>..</Operator><Operator>8</Operator><Operator>]</Operator>.<FunctionName>copy_from_slice</FunctionName>(<Operator>&amp;</Operator><Variable>tx_id_bytes</Variable>);
                  <br />
                  <Variable>salt</Variable><Operator>[</Operator><Operator>8</Operator><Operator>..</Operator><Operator>16</Operator><Operator>]</Operator>.<FunctionName>copy_from_slice</FunctionName>(<Operator>&amp;</Operator><Variable>tx_id_bytes</Variable>);
                  <br />
                  <br />
                  <Comment>// Apply bitwise XOR mutation to safely isolate Phantom ID</Comment>
                  <br />
                  <Keyword>for</Keyword> <Variable>i</Variable> <Keyword>in</Keyword> <Operator>0</Operator><Operator>..</Operator><Operator>16</Operator> <Operator>{'{'}</Operator>
                  <br />
                  {'    '}<Variable>phantom_bytes</Variable><Operator>[</Operator><Variable>i</Variable><Operator>]</Operator> <Operator>^=</Operator> <Variable>salt</Variable><Operator>[</Operator><Variable>i</Variable><Operator>]</Operator>;
                  <br />
                  {'    '}<Variable>phantom_bytes</Variable><Operator>[</Operator><Variable>i</Variable><Operator>]</Operator> <Operator>^=</Operator> <Operator>0xFF</Operator>;
                  <br />
                  <Operator>{'}'}</Operator>
                </Pre>
              </CodeBody>
            </EditorContainer>
            <VimStatusLine>
              <div>
                <VimMode>NORMAL</VimMode>
                <span>src/router.rs</span>
              </div>
              <div>
                <span>utf-8 [rust] 12:1</span>
              </div>
            </VimStatusLine>
          </CodeTerminal>
        </RightColumn>
      </ContentWrapper>
    </SectionContainer>
  );
}
