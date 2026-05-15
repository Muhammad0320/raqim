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
  background: #09090b;
  border: 1px solid #27272a;
  border-radius: 8px;
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.8);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 24px;
`;

const SvgVisual = styled.svg`
  width: 100%;
  height: auto;
  border: 1px solid #18181b;
  background-color: #000000;
  border-radius: 4px;
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

const StringLiteral = styled.span`
  color: #98c379;
`;

const Bracket = styled.span`
  color: #e4e4e7;
`;

export default function AegisGatekeeper() {
  const LOOP_DURATION = 8;
  const Y_PATH = 160;

  return (
    <SectionContainer>
      <ContentWrapper>
        <LeftColumn
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <SectionTag>[ AEGIS GATEKEEPER ]</SectionTag>
          <Headline>Zero-Trust. Default Deny.</Headline>
          <SubHeadline>
            API keys are a vulnerability. Raqim demands physical cryptography. Every A2A TCP packet is an IngressEnvelope sealed with an Ed25519 signature. Aegis inspects the namespace ACL in microseconds. If a wandering agent violates its capability boundary, the packet is dropped, and the agent is instantly quarantined.
          </SubHeadline>

          <FeatureList>
            <FeatureItem>
              <FeatureTitle>Ed25519 Handshake</FeatureTitle>
              <FeatureDesc>Mathematical proof of identity.</FeatureDesc>
            </FeatureItem>
            <FeatureItem>
              <FeatureTitle>Namespace ACLs</FeatureTitle>
              <FeatureDesc>Strict routing capabilities (e.g., /finance/*).</FeatureDesc>
            </FeatureItem>
            <FeatureItem>
              <FeatureTitle>Auto-Quarantine</FeatureTitle>
              <FeatureDesc>Rogue agent isolation at the socket layer.</FeatureDesc>
            </FeatureItem>
          </FeatureList>
        </LeftColumn>

        <RightColumn>
          <UiShell>
            <SvgVisual viewBox="0 0 600 320" preserveAspectRatio="xMidYMid meet">
              <defs>
                <filter id="glowRedAegis" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glowCyanAegis" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Swarm State Node */}
              <circle cx="500" cy={Y_PATH} r="40" fill="#09090b" stroke="#27272a" strokeWidth="2" strokeDasharray="4 4" />
              <text x="500" y={Y_PATH + 4} fill="#71717a" fontSize="12" fontFamily="monospace" textAnchor="middle">SWARM</text>
              <text x="500" y={Y_PATH + 18} fill="#71717a" fontSize="12" fontFamily="monospace" textAnchor="middle">STATE</text>

              {/* Aegis Boundary */}
              <motion.line 
                x1="300" y1="20" x2="300" y2="300" 
                strokeWidth="4"
                animate={{ 
                  stroke: ["#27272a", "#27272a", "#ef4444", "#27272a", "#27272a", "#06b6d4", "#27272a"] 
                }}
                transition={{ duration: LOOP_DURATION, times: [0, 0.18, 0.19, 0.3, 0.61, 0.625, 0.75], repeat: Infinity }}
              />
              <text x="290" y="30" fill="#52525b" fontSize="10" fontFamily="monospace" transform="rotate(-90 290 30)">AEGIS BOUNDARY</text>

              {/* Quarantine Panel */}
              <rect x="20" y="20" width="160" height="30" rx="4" fill="#18181b" stroke="#3f3f46" />
              <text x="30" y="39" fill="#a1a1aa" fontSize="10" fontFamily="monospace">QUARANTINED_AGENTS:</text>
              
              <motion.text x="160" y="39" fill="#ef4444" fontSize="12" fontFamily="monospace" fontWeight="bold"
                animate={{ opacity: [1, 0, 0, 1] }}
                transition={{ duration: LOOP_DURATION, times: [0, 0.25, 0.9, 1], repeat: Infinity }}
              >
                0
              </motion.text>
              <motion.text x="160" y="39" fill="#ef4444" fontSize="12" fontFamily="monospace" fontWeight="bold"
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: LOOP_DURATION, times: [0, 0.25, 0.9, 1], repeat: Infinity }}
              >
                1
              </motion.text>

              {/* --- PHASE 1: Rogue Agent (Red) --- */}
              <motion.g
                animate={{ 
                  x: [-50, 260, 260, 260],
                  opacity: [0, 1, 1, 0]
                }}
                transition={{ duration: LOOP_DURATION, times: [0, 0.1875, 0.19, 0.2], repeat: Infinity }}
              >
                <rect x="0" y={Y_PATH - 15} width="40" height="30" rx="4" fill="#450a0a" stroke="#ef4444" filter="url(#glowRedAegis)" />
                <path d="M 12 155 L 28 155 M 20 147 L 28 155 L 20 163" fill="transparent" stroke="#fca5a5" strokeWidth="2" />
                
                {/* Labels above packet */}
                <rect x="-30" y={Y_PATH - 50} width="100" height="20" rx="2" fill="#18181b" />
                <text x="-25" y={Y_PATH - 36} fill="#ef4444" fontSize="9" fontFamily="monospace">Agent: a8f9...</text>
                
                <rect x="-30" y={Y_PATH - 75} width="100" height="20" rx="2" fill="#18181b" />
                <text x="-25" y={Y_PATH - 61} fill="#e4e4e7" fontSize="9" fontFamily="monospace">Intent: /core/admin</text>
              </motion.g>

              {/* Rogue Fragments */}
              {[...Array(8)].map((_, i) => (
                <motion.circle
                  key={`frag-${i}`}
                  r="2"
                  fill="#ef4444"
                  filter="url(#glowRedAegis)"
                  initial={{ cx: 280, cy: Y_PATH }}
                  animate={{ 
                    cx: [280, 280, 200 + Math.random() * 60, 200 + Math.random() * 60],
                    cy: [Y_PATH, Y_PATH, Y_PATH - 60 + Math.random() * 120, Y_PATH - 60 + Math.random() * 120],
                    opacity: [0, 0, 1, 0]
                  }}
                  transition={{ duration: LOOP_DURATION, times: [0, 0.1875, 0.22, 0.3], repeat: Infinity }}
                />
              ))}

              <motion.g
                animate={{ opacity: [0, 0, 1, 0, 0] }}
                transition={{ duration: LOOP_DURATION, times: [0, 0.1875, 0.2, 0.3, 1], repeat: Infinity }}
              >
                <text x="320" y={Y_PATH - 20} fill="#ef4444" fontSize="12" fontFamily="monospace" fontWeight="bold" filter="url(#glowRedAegis)">[SIG_FAIL]</text>
                <text x="320" y={Y_PATH} fill="#ef4444" fontSize="12" fontFamily="monospace" fontWeight="bold" filter="url(#glowRedAegis)">[CAPABILITY_VIOLATION]</text>
              </motion.g>


              {/* --- PHASE 2: Authorized Agent (Cyan) --- */}
              <motion.g
                animate={{ 
                  x: [0, 0, 260, 320, 500, 500],
                  opacity: [0, 0, 1, 1, 0, 0],
                  scale: [1, 1, 1, 1, 0.5, 0.5]
                }}
                transition={{ duration: LOOP_DURATION, times: [0, 0.4375, 0.625, 0.65, 0.8125, 1], repeat: Infinity }}
              >
                <rect x="0" y={Y_PATH - 15} width="40" height="30" rx="4" fill="#083344" stroke="#06b6d4" filter="url(#glowCyanAegis)" />
                <path d="M 12 155 L 28 155 M 20 147 L 28 155 L 20 163" fill="transparent" stroke="#67e8f9" strokeWidth="2" />
                
                {/* Labels above packet */}
                <rect x="-30" y={Y_PATH - 50} width="100" height="20" rx="2" fill="#18181b" />
                <text x="-25" y={Y_PATH - 36} fill="#06b6d4" fontSize="9" fontFamily="monospace">Agent: b2c4...</text>
                
                <rect x="-30" y={Y_PATH - 75} width="105" height="20" rx="2" fill="#18181b" />
                <text x="-25" y={Y_PATH - 61} fill="#e4e4e7" fontSize="9" fontFamily="monospace">Intent: /finance/ledger</text>
              </motion.g>

              <motion.g
                animate={{ opacity: [0, 0, 1, 0, 0] }}
                transition={{ duration: LOOP_DURATION, times: [0, 0.625, 0.64, 0.75, 1], repeat: Infinity }}
              >
                <text x="320" y={Y_PATH - 10} fill="#06b6d4" fontSize="12" fontFamily="monospace" fontWeight="bold" filter="url(#glowCyanAegis)">[SIG_VERIFIED]</text>
              </motion.g>

              {/* Swarm State Flash */}
              <motion.circle 
                cx="500" cy={Y_PATH} r="40" fill="none" strokeWidth="4" filter="url(#glowCyanAegis)"
                animate={{ 
                  stroke: ["transparent", "transparent", "#06b6d4", "transparent", "transparent"],
                  scale: [1, 1, 1.1, 1, 1]
                }}
                transition={{ duration: LOOP_DURATION, times: [0, 0.8, 0.82, 0.9, 1], repeat: Infinity }}
              />

            </SvgVisual>

            <CodeContainer>
              <Pre>
                <Comment># aegis.toml (The Source of Truth)</Comment>
                <br />
                <Bracket>[</Bracket><StringLiteral>"b2c4d8cd98f00b204e9800998ecf8427e"</StringLiteral><Bracket>]</Bracket>
                <br />
                <Keyword>alias</Keyword> = <StringLiteral>"finance_router"</StringLiteral>
                <br />
                <Keyword>public_key_hex</Keyword> = <StringLiteral>"f9a2..."</StringLiteral>
                <br />
                <Comment># Strict capability routing. Wandering outside this triggers quarantine.</Comment>
                <br />
                <Keyword>capability</Keyword> = <Bracket>[</Bracket><StringLiteral>"/finance/ledger/*"</StringLiteral>, <StringLiteral>"/system/handshake"</StringLiteral><Bracket>]</Bracket>
              </Pre>
            </CodeContainer>
          </UiShell>
        </RightColumn>
      </ContentWrapper>
    </SectionContainer>
  );
}
