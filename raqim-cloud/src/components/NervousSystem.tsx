'use client';

import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const SectionContainer = styled.section`
  background-color: #000000;
  padding: 120px 24px;
  display: flex;
  justify-content: center;
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
    /* Reverse order on mobile so visual is on top */
  }
`;

const LeftColumn = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 32px;
  @media (max-width: 1024px) {
    order: 2;
  }
`;

const RightColumn = styled(motion.div)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  @media (max-width: 1024px) {
    order: 1;
  }
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

const SvgContainer = styled.div`
  background: #09090b;
  border: 1px solid #27272a;
  border-radius: 8px;
  padding: 24px;
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  position: relative;
`;

const SvgVisual = styled.svg`
  width: 100%;
  height: auto;
`;

const CodeContainer = styled.div`
  background: #09090b;
  border: 1px solid #27272a;
  border-left: 2px solid #06b6d4;
  border-radius: 4px;
  padding: 24px;
  overflow-x: auto;
  margin-top: 24px;
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

export default function NervousSystem() {
  const NODE_A = { x: 150, y: 100 }; // Frankfurt
  const NODE_B = { x: 100, y: 300 }; // Virginia
  const NODE_C = { x: 450, y: 200 }; // Tokyo

  return (
    <SectionContainer>
      <ContentWrapper>
        <LeftColumn>
          <SvgContainer>
            <SvgVisual viewBox="0 0 600 400" preserveAspectRatio="xMidYMid meet">
              <defs>
                <filter id="glowCyanMesh" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glowNode" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Base Network Lines */}
              <line x1={NODE_A.x} y1={NODE_A.y} x2={NODE_B.x} y2={NODE_B.y} stroke="#27272a" strokeWidth="2" strokeDasharray="4 4" />
              <line x1={NODE_B.x} y1={NODE_B.y} x2={NODE_C.x} y2={NODE_C.y} stroke="#27272a" strokeWidth="2" strokeDasharray="4 4" />
              <line x1={NODE_C.x} y1={NODE_C.y} x2={NODE_A.x} y2={NODE_A.y} stroke="#27272a" strokeWidth="2" strokeDasharray="4 4" />

              {/* Data Pulses */}
              {/* A -> C */}
              <motion.circle
                r="4" fill="#06b6d4" filter="url(#glowCyanMesh)"
                animate={{ cx: [NODE_A.x, NODE_A.x, NODE_C.x, NODE_C.x], cy: [NODE_A.y, NODE_A.y, NODE_C.y, NODE_C.y], opacity: [0, 0, 1, 1, 0, 0] }}
                transition={{ duration: 4, times: [0, 0.35, 0.375, 0.6, 0.625, 1], repeat: Infinity, ease: "linear" }}
              />
              {/* B -> C */}
              <motion.circle
                r="4" fill="#06b6d4" filter="url(#glowCyanMesh)"
                animate={{ cx: [NODE_B.x, NODE_B.x, NODE_C.x, NODE_C.x], cy: [NODE_B.y, NODE_B.y, NODE_C.y, NODE_C.y], opacity: [0, 0, 1, 1, 0, 0] }}
                transition={{ duration: 4, times: [0, 0.35, 0.375, 0.6, 0.625, 1], repeat: Infinity, ease: "linear" }}
              />
              {/* A -> B */}
              <motion.circle
                r="4" fill="#06b6d4" filter="url(#glowCyanMesh)"
                animate={{ cx: [NODE_A.x, NODE_A.x, NODE_B.x, NODE_B.x], cy: [NODE_A.y, NODE_A.y, NODE_B.y, NODE_B.y], opacity: [0, 0, 1, 1, 0, 0] }}
                transition={{ duration: 4, times: [0, 0.35, 0.375, 0.6, 0.625, 1], repeat: Infinity, ease: "linear" }}
              />
              {/* B -> A */}
              <motion.circle
                r="4" fill="#06b6d4" filter="url(#glowCyanMesh)"
                animate={{ cx: [NODE_B.x, NODE_B.x, NODE_A.x, NODE_A.x], cy: [NODE_B.y, NODE_B.y, NODE_A.y, NODE_A.y], opacity: [0, 0, 1, 1, 0, 0] }}
                transition={{ duration: 4, times: [0, 0.35, 0.375, 0.6, 0.625, 1], repeat: Infinity, ease: "linear" }}
              />

              {/* Node Backgrounds & Labels */}
              <g>
                <motion.circle 
                  cx={NODE_A.x} cy={NODE_A.y} r="8" stroke="#06b6d4" strokeWidth="2"
                  animate={{ fill: ["#18181b", "#06b6d4", "#18181b", "#18181b", "#06b6d4", "#18181b", "#18181b"] }}
                  transition={{ duration: 4, times: [0, 0.25, 0.3, 0.625, 0.65, 0.7, 1], repeat: Infinity }}
                />
                <text x={NODE_A.x - 65} y={NODE_A.y - 15} fill="#a1a1aa" fontSize="12" fontFamily="monospace">Node A (FRA)</text>
              </g>

              <g>
                <motion.circle 
                  cx={NODE_B.x} cy={NODE_B.y} r="8" stroke="#06b6d4" strokeWidth="2"
                  animate={{ fill: ["#18181b", "#06b6d4", "#18181b", "#18181b", "#06b6d4", "#18181b", "#18181b"] }}
                  transition={{ duration: 4, times: [0, 0.25, 0.3, 0.625, 0.65, 0.7, 1], repeat: Infinity }}
                />
                <text x={NODE_B.x - 60} y={NODE_B.y + 25} fill="#a1a1aa" fontSize="12" fontFamily="monospace">Node B (IAD)</text>
              </g>

              <g>
                <motion.circle 
                  cx={NODE_C.x} cy={NODE_C.y} r="8" stroke="#06b6d4" strokeWidth="2"
                  animate={{ fill: ["#18181b", "#18181b", "#18181b", "#18181b", "#06b6d4", "#18181b", "#18181b"] }}
                  transition={{ duration: 4, times: [0, 0.25, 0.3, 0.625, 0.65, 0.7, 1], repeat: Infinity }}
                />
                <text x={NODE_C.x + 15} y={NODE_C.y + 5} fill="#a1a1aa" fontSize="12" fontFamily="monospace">Node C (HND)</text>
              </g>

              {/* Popups */}
              <motion.g
                animate={{ opacity: [0, 1, 1, 0, 0] }}
                transition={{ duration: 4, times: [0, 0.25, 0.35, 0.375, 1], repeat: Infinity }}
              >
                <rect x={NODE_A.x + 15} y={NODE_A.y - 30} width="130" height="20" rx="2" fill="#18181b" stroke="#3f3f46" />
                <text x={NODE_A.x + 20} y={NODE_A.y - 16} fill="#e4e4e7" fontSize="10" fontFamily="monospace">Local Mutate: Tx_1</text>
              </motion.g>

              <motion.g
                animate={{ opacity: [0, 1, 1, 0, 0] }}
                transition={{ duration: 4, times: [0, 0.25, 0.35, 0.375, 1], repeat: Infinity }}
              >
                <rect x={NODE_B.x + 15} y={NODE_B.y - 20} width="130" height="20" rx="2" fill="#18181b" stroke="#3f3f46" />
                <text x={NODE_B.x + 20} y={NODE_B.y - 6} fill="#e4e4e7" fontSize="10" fontFamily="monospace">Local Mutate: Tx_2</text>
              </motion.g>

              {/* Merge Text Overlay */}
              <motion.g
                animate={{ opacity: [0, 0, 1, 1, 0] }}
                transition={{ duration: 4, times: [0, 0.65, 0.68, 0.88, 1], repeat: Infinity }}
              >
                <rect x="180" y="160" width="240" height="40" rx="4" fill="rgba(6, 182, 212, 0.15)" stroke="#06b6d4" strokeWidth="2" filter="url(#glowCyanMesh)" />
                <text x="195" y="184" fill="#ffffff" fontSize="12" fontFamily="monospace" fontWeight="bold">Loro Merge: Conflict Resolved in O(1)</text>
              </motion.g>

            </SvgVisual>
          </SvgContainer>

          <CodeContainer>
            <Pre>
              <Comment>// Peer-to-Peer CRDT Resolution (No Redis, No Locks)</Comment>
              <br />
              <Keyword>let</Keyword> <Keyword>mut</Keyword> <Variable>local_brain</Variable> = LoroDoc::<FunctionName>new</FunctionName>();
              <br />
              <br />
              <Comment>// Zenoh asynchronously delivers the remote state vector</Comment>
              <br />
              <Keyword>let</Keyword> <Variable>remote_bytes</Variable> = zenoh_subscriber.<FunctionName>recv</FunctionName>().<Keyword>await</Keyword>?;
              <br />
              <br />
              <Comment>// Mathematical resolution. Deterministic across all edge nodes.</Comment>
              <br />
              local_brain.<FunctionName>import</FunctionName>(&amp;remote_bytes).<FunctionName>expect</FunctionName>(<span style={{ color: '#98c379' }}>"CRDT Merge Failed"</span>);
            </Pre>
          </CodeContainer>
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
              <FeatureTitle>Zenoh</FeatureTitle>
              <FeatureDesc>Sub-millisecond peer-to-peer mesh routing.</FeatureDesc>
            </FeatureItem>
            <FeatureItem>
              <FeatureTitle>Loro CRDT</FeatureTitle>
              <FeatureDesc>Deterministic, lock-free state resolution.</FeatureDesc>
            </FeatureItem>
          </FeatureList>
        </RightColumn>
      </ContentWrapper>
    </SectionContainer>
  );
}
