'use client';

import React from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';

const SectionContainer = styled.section`
  background-color: #000000;
  padding: 120px 24px;
  display: flex;
  justify-content: center;
  border-top: 1px solid #27272a; /* strict border-zinc-800 */
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  width: 100%;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  background-color: #09090b;
  border: 1px solid #27272a; /* strict border-zinc-800 */
  overflow: hidden;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const LeftColumn = styled(motion.div)`
  display: flex;
  flex-direction: column;
  border-right: 1px solid #27272a; /* strict border-zinc-800 */

  @media (max-width: 1024px) {
    border-right: none;
    border-bottom: 1px solid #27272a;
  }
`;

const RightColumn = styled(motion.div)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 64px 48px;
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
  max-width: 520px;
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

const SvgContainer = styled.div`
  background: #000000;
  border-bottom: 1px solid #27272a;
  padding: 32px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.8);
`;

const SvgVisual = styled.svg`
  width: 100%;
  height: auto;
  max-width: 540px;
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
  min-height: 160px;
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

const StringLiteral = styled.span`
  color: #98c379;
`;

const Operator = styled.span`
  color: #56b6c2;
`;

// Gossip pulse scrolling animation
const gossipFlow = keyframes`
  from { stroke-dashoffset: 0; }
  to { stroke-dashoffset: -80; }
`;

const GossipLine = styled.path`
  stroke: rgba(0, 229, 255, 0.45);
  stroke-width: 1.5;
  stroke-dasharray: 8 8;
  animation: ${gossipFlow} 1.5s linear infinite;
`;

export default function NervousSystem() {
  const NODE_FRA = { x: 180, y: 110 };
  const NODE_IAD = { x: 180, y: 310 };
  const NODE_HND = { x: 450, y: 210 };
  const CENTER_POINT = { x: 300, y: 210 };

  return (
    <SectionContainer id="architecture">
      <ContentWrapper>
        <LeftColumn
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <SvgContainer>
            <SvgVisual viewBox="0 0 600 400" preserveAspectRatio="xMidYMid meet">
              <defs>
                <filter id="glowCyanMesh" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glowResolved" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Zenoh Gossip dashed lines */}
              <GossipLine d={`M ${NODE_FRA.x} ${NODE_FRA.y} L ${NODE_IAD.x} ${NODE_IAD.y}`} />
              <GossipLine d={`M ${NODE_IAD.x} ${NODE_IAD.y} L ${NODE_HND.x} ${NODE_HND.y}`} />
              <GossipLine d={`M ${NODE_HND.x} ${NODE_HND.y} L ${NODE_FRA.x} ${NODE_FRA.y}`} />

              {/* Collision Pulses traveling to center */}
              <motion.circle
                r="5" fill="#00E5FF" filter="url(#glowCyanMesh)"
                animate={{
                  cx: [NODE_FRA.x, CENTER_POINT.x],
                  cy: [NODE_FRA.y, CENTER_POINT.y],
                  opacity: [1, 1, 0]
                }}
                transition={{
                  duration: 6,
                  times: [0, 0.29, 0.3],
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
              <motion.circle
                r="5" fill="#00E5FF" filter="url(#glowCyanMesh)"
                animate={{
                  cx: [NODE_HND.x, CENTER_POINT.x],
                  cy: [NODE_HND.y, CENTER_POINT.y],
                  opacity: [1, 1, 0]
                }}
                transition={{
                  duration: 6,
                  times: [0, 0.29, 0.3],
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />

              {/* Collision Ripple Wave */}
              <motion.circle
                cx={CENTER_POINT.x} cy={CENTER_POINT.y} r="10"
                stroke="#00E5FF" strokeWidth="2" fill="none"
                animate={{
                  r: [10, 10, 60, 100],
                  opacity: [0, 0, 1, 0],
                }}
                transition={{
                  duration: 6,
                  times: [0, 0.29, 0.3, 0.48],
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />

              {/* Node FRA: Vector [12, 4, 1] */}
              <g>
                <rect x="90" y="70" width="180" height="80" rx="4" fill="#09090b" stroke="#27272a" strokeWidth="1.5" />
                <rect x="90" y="70" width="180" height="4" fill="#00E5FF" rx="2" />
                <text x="105" y="93" fill="#00E5FF" fontSize="11" fontFamily="monospace" fontWeight="bold">NODE: FRA (FRANKEURT)</text>
                <text x="105" y="113" fill="#ffffff" fontSize="12" fontFamily="monospace" fontWeight="bold">VEC: [12, 4, 1]</text>
                <text x="105" y="133" fill="#52525b" fontSize="10" fontFamily="monospace">RTT: 14ms | STATUS: ACTIVE</text>
                <circle cx={NODE_FRA.x + 75} cy={NODE_FRA.y} r="4" fill="#00E5FF" filter="url(#glowCyanMesh)" />
              </g>

              {/* Node IAD: Vector [11, 4, 2] */}
              <g>
                <rect x="90" y="270" width="180" height="80" rx="4" fill="#09090b" stroke="#27272a" strokeWidth="1.5" />
                <rect x="90" y="270" width="180" height="4" fill="#27272a" rx="2" />
                <text x="105" y="293" fill="#a1a1aa" fontSize="11" fontFamily="monospace" fontWeight="bold">NODE: IAD (VIRGINIA)</text>
                <text x="105" y="313" fill="#ffffff" fontSize="12" fontFamily="monospace" fontWeight="bold">VEC: [11, 4, 2]</text>
                <text x="105" y="333" fill="#52525b" fontSize="10" fontFamily="monospace">RTT: 3ms | STATUS: ACTIVE</text>
                <circle cx={NODE_IAD.x + 75} cy={NODE_IAD.y} r="4" fill="#a1a1aa" />
              </g>

              {/* Node HND: Vector [10, 4, 3] */}
              <g>
                <rect x="360" y="170" width="180" height="80" rx="4" fill="#09090b" stroke="#27272a" strokeWidth="1.5" />
                <rect x="360" y="170" width="180" height="4" fill="#27272a" rx="2" />
                <text x="375" y="193" fill="#a1a1aa" fontSize="11" fontFamily="monospace" fontWeight="bold">NODE: HND (TOKYO)</text>
                <text x="375" y="213" fill="#ffffff" fontSize="12" fontFamily="monospace" fontWeight="bold">VEC: [10, 4, 3]</text>
                <text x="375" y="233" fill="#52525b" fontSize="10" fontFamily="monospace">RTT: 81ms | STATUS: ACTIVE</text>
                <circle cx={NODE_HND.x + 75} cy={NODE_HND.y} r="4" fill="#a1a1aa" />
              </g>

              {/* Stark White O(1) RESOLVED Badge */}
              <motion.g
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: [0, 0, 1, 1, 0, 0],
                  scale: [0.9, 0.9, 1.05, 1, 0.9, 0.9]
                }}
                transition={{
                  duration: 6,
                  times: [0, 0.28, 0.31, 0.63, 0.67, 1],
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <rect x="200" y="190" width="200" height="40" rx="4" fill="#ffffff" stroke="#00E5FF" strokeWidth="2" filter="url(#glowResolved)" />
                <text x="300" y="215" fill="#000000" fontSize="12" fontFamily="monospace" fontWeight="bold" textAnchor="middle">O(1) RESOLVED</text>
              </motion.g>

            </SvgVisual>
          </SvgContainer>

          <CodeTerminal>
            <CodeTerminalHeader>
              <MacDotsRow>
                <MacDot $color="#ff5f56" />
                <MacDot $color="#ffbd2e" />
                <MacDot $color="#27c93f" />
              </MacDotsRow>
              <FileTab>resolve.rs</FileTab>
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
              </LineNumbersGutter>
              <CodeBody>
                <Pre>
                  <Comment>// Peer-to-Peer CRDT Resolution (No Redis, No Locks)</Comment>
                  <br />
                  <Keyword>let</Keyword> <Variable>target_brain</Variable> = <Variable>brain_registry</Variable>.<FunctionName>get_or_create_brain</FunctionName>(<Variable>target_namespace</Variable>);
                  <br />
                  <br />
                  <Comment>// Mathematical resolution. Deterministic across all edge nodes.</Comment>
                  <br />
                  <Variable>target_brain</Variable>.<FunctionName>assimilate_foreign_thought</FunctionName>(<Operator>&amp;</Operator><Variable>remote_bytes</Variable>).<FunctionName>expect</FunctionName>(<StringLiteral>"CRDT Merge Failed"</StringLiteral>);
                </Pre>
              </CodeBody>
            </EditorContainer>
            <VimStatusLine>
              <div>
                <VimMode>NORMAL</VimMode>
                <span>src/crdt/resolve.rs</span>
              </div>
              <div>
                <span>utf-8 [rust] 5:1</span>
              </div>
            </VimStatusLine>
          </CodeTerminal>
        </LeftColumn>

        <RightColumn
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <SectionTag>[ SOVEREIGN NERVOUS SYSTEM ]</SectionTag>
          <Headline>Global State. Zero Database Locks.</Headline>
          <SubHeadline>
            Standard AI swarms choke on centralized Redis locks. Raqim deploys a peer-to-peer Zenoh mesh layered with Loro CRDTs. Agents mutate local memory instantly; the mesh resolves conflicts mathematically. True edge-to-edge autonomy.
          </SubHeadline>

          <FeatureList>
            <FeatureItem>
              <FeatureTitle>Zenoh Gossip Protocol</FeatureTitle>
              <FeatureDesc>Sub-millisecond P2P routing bypassing central cloud infrastructure.</FeatureDesc>
            </FeatureItem>
            <FeatureItem>
              <FeatureTitle>Loro CRDT Layer</FeatureTitle>
              <FeatureDesc>Deterministic mathematical convergence for global swarm state.</FeatureDesc>
            </FeatureItem>
          </FeatureList>
        </RightColumn>
      </ContentWrapper>
    </SectionContainer>
  );
}
