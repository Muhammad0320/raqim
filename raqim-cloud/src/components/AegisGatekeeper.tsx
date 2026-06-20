'use client';

import React from 'react';
import styled, { keyframes } from 'styled-components';
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
  grid-template-columns: 1.05fr 0.95fr;
  background-color: #09090b;
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
  max-width: 500px;
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
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const VisualArea = styled.div`
  padding: 32px;
  background: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #27272a;
`;

const SvgVisual = styled.svg`
  width: 100%;
  height: auto;
  max-width: 500px;
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
  min-height: 180px;
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
  background: #e5c07b; /* yellow mode indicator for config file edit */
  color: #18181b;
  padding: 1px 6px;
  margin-right: 8px;
  font-weight: 900;
  text-transform: uppercase;
`;

// Syntax colors
const Comment = styled.span`
  color: #5c6370;
  font-style: italic;
`;

const SectionHeader = styled.span`
  color: #c678dd;
  font-weight: bold;
`;

const KeyName = styled.span`
  color: #e06c75;
`;

const StringVal = styled.span`
  color: #98c379;
`;

const SyntaxSymbol = styled.span`
  color: #56b6c2;
`;

export default function AegisGatekeeper() {
  const LOOP_DURATION = 8;
  const Y_PATH = 160;

  return (
    <SectionContainer id="security">
      <ContentWrapper>
        <LeftColumn
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <SectionTag>[ AEGIS GATEKEEPER ]</SectionTag>
          <Headline>Zero-Trust. Default Deny.</Headline>
          <SubHeadline>
            API keys are a vulnerability. Raqim demands physical cryptography. Every A2A TCP packet is an IngressEnvelope sealed with an Ed25519 signature. Aegis inspects the namespace ACL in microseconds. If an agent breaches its boundary, the packet is shattered.
          </SubHeadline>

          <FeatureList>
            <FeatureItem>
              <FeatureTitle>Ed25519 Handshakes</FeatureTitle>
              <FeatureDesc>Socket-level signatures enforcing physical cryptography constraints.</FeatureDesc>
            </FeatureItem>
            <FeatureItem>
              <FeatureTitle>Hot-Reloaded RAM ACLs</FeatureTitle>
              <FeatureDesc>Microsecond lookup of security namespaces with zero memory lock degradation.</FeatureDesc>
            </FeatureItem>
          </FeatureList>
        </LeftColumn>

        <RightColumn>
          <UiShell>
            <VisualArea>
              <SvgVisual viewBox="0 0 600 320" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <filter id="glowCrimson" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Swarm Memory Node (Target destination for authorized packets) */}
                <g>
                  <circle cx="500" cy={Y_PATH} r="40" fill="#09090b" stroke="#27272a" strokeWidth="2" strokeDasharray="4 4" />
                  {/* Swarm Memory ripple rings upon authorized packet landing */}
                  <motion.circle
                    cx="500" cy={Y_PATH} r="40" fill="none" stroke="#00E5FF" strokeWidth="2.5"
                    animate={{
                      r: [40, 40, 60, 80],
                      opacity: [0, 0, 0.7, 0]
                    }}
                    transition={{
                      duration: LOOP_DURATION,
                      times: [0, 0.85, 0.87, 0.95, 1],
                      repeat: Infinity,
                      ease: "easeOut"
                    }}
                  />
                  <text x="500" y={Y_PATH + 4} fill="#a1a1aa" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">SWARM</text>
                  <text x="500" y={Y_PATH + 16} fill="#a1a1aa" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">MEMORY</text>
                </g>

                {/* Vertical Aegis Firewall boundary line */}
                <g>
                  <line x1="300" y1="20" x2="300" y2="300" stroke="#27272a" strokeWidth="2.5" />
                  {/* Glowing core indicator of boundary */}
                  <motion.line
                    x1="300" y1="20" x2="300" y2="300"
                    strokeWidth="3.5"
                    animate={{
                      stroke: ["#27272a", "#27272a", "#E11D48", "#27272a", "#27272a", "#00E5FF", "#27272a"],
                    }}
                    transition={{
                      duration: LOOP_DURATION,
                      times: [0, 0.22, 0.24, 0.35, 0.7, 0.72, 0.85],
                      repeat: Infinity
                    }}
                  />
                  <text x="290" y="30" fill="#52525b" fontSize="9" fontFamily="monospace" transform="rotate(-90 290 30)" letter-spacing="0.1em">AEGIS FIREWALL</text>
                </g>

                {/* Diagnostic stats telemetry box */}
                <g>
                  <rect x="20" y="20" width="170" height="36" rx="4" fill="#09090b" stroke="#27272a" />
                  <text x="32" y="42" fill="#71717a" fontSize="10" fontFamily="monospace">QUARANTINE_SOCKETS: </text>
                  {/* Quarantine counter goes from 0 to 1 when rogue packet hits */}
                  <motion.text
                    x="160" y="42" fill="#E11D48" fontSize="11" fontFamily="monospace" fontWeight="bold"
                    animate={{
                      opacity: [1, 1, 0, 0, 1, 1],
                    }}
                    transition={{
                      duration: LOOP_DURATION,
                      times: [0, 0.23, 0.24, 0.55, 0.56, 1],
                      repeat: Infinity
                    }}
                  >
                    0
                  </motion.text>
                  <motion.text
                    x="160" y="42" fill="#E11D48" fontSize="11" fontFamily="monospace" fontWeight="bold"
                    animate={{
                      opacity: [0, 0, 1, 1, 0, 0],
                    }}
                    transition={{
                      duration: LOOP_DURATION,
                      times: [0, 0.23, 0.24, 0.55, 0.56, 1],
                      repeat: Infinity
                    }}
                  >
                    1
                  </motion.text>
                </g>

                {/* --- ANIMATION 1: Rogue Crimson Packet --- */}
                <motion.g
                  animate={{
                    x: [-45, 260, 260, 260],
                    opacity: [0, 1, 1, 0]
                  }}
                  transition={{
                    duration: LOOP_DURATION,
                    times: [0, 0.22, 0.23, 0.25],
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                >
                  <rect x="0" y={Y_PATH - 15} width="45" height="30" rx="4" fill="rgba(225, 29, 72, 0.1)" stroke="#E11D48" strokeWidth="2" filter="url(#glowCrimson)" />
                  <path d="M 12 160 L 32 160 M 22 152 L 32 160 L 22 168" fill="transparent" stroke="#E11D48" strokeWidth="2" />
                  
                  {/* labels on rogue envelope */}
                  <rect x="-35" y={Y_PATH - 46} width="115" height="18" rx="2" fill="#09090b" stroke="#27272a" />
                  <text x="-28" y={Y_PATH - 34} fill="#E11D48" fontSize="8" fontFamily="monospace">Agent: rogue_7a</text>
                  
                  <rect x="-35" y={Y_PATH - 68} width="115" height="18" rx="2" fill="#09090b" stroke="#27272a" />
                  <text x="-28" y={Y_PATH - 56} fill="#ffffff" fontSize="8" fontFamily="monospace">Intent: /core/admin</text>
                </motion.g>

                {/* Crimson rogue shatters fragments */}
                {[...Array(8)].map((_, i) => {
                  const angle = (i * Math.PI) / 4;
                  const distance = 40 + Math.random() * 50;
                  const endX = 265 + Math.cos(angle) * distance;
                  const endY = Y_PATH + Math.sin(angle) * distance;
                  return (
                    <motion.circle
                      key={`rogue-frag-${i}`}
                      r="3"
                      fill="#E11D48"
                      filter="url(#glowCrimson)"
                      initial={{ cx: 275, cy: Y_PATH }}
                      animate={{
                        cx: [275, 275, endX, endX],
                        cy: [Y_PATH, Y_PATH, endY, endY],
                        opacity: [0, 0, 1, 0]
                      }}
                      transition={{
                        duration: LOOP_DURATION,
                        times: [0, 0.22, 0.24, 0.35],
                        repeat: Infinity,
                        ease: "easeOut"
                      }}
                    />
                  );
                })}

                {/* Rogue Interdiction Rejected Alert Badge */}
                <motion.g
                  animate={{
                    opacity: [0, 0, 1, 0, 0],
                    scale: [0.9, 0.9, 1.05, 0.9, 0.9]
                  }}
                  transition={{
                    duration: LOOP_DURATION,
                    times: [0, 0.22, 0.24, 0.5, 1],
                    repeat: Infinity
                  }}
                >
                  <rect x="290" y="80" width="180" height="34" rx="4" fill="#ffffff" stroke="#E11D48" strokeWidth="2" filter="url(#glowCrimson)" />
                  <text x="380" y="101" fill="#000000" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">[CRYPTO_SPOOF: REJECTED]</text>
                </motion.g>

                {/* --- ANIMATION 2: Authorized Cyan Packet --- */}
                <motion.g
                  animate={{
                    x: [-45, -45, 260, 480, 480],
                    opacity: [0, 0, 1, 1, 0],
                    scale: [1, 1, 1, 1, 0.5]
                  }}
                  transition={{
                    duration: LOOP_DURATION,
                    times: [0, 0.48, 0.7, 0.85, 0.88],
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <rect x="0" y={Y_PATH - 15} width="45" height="30" rx="4" fill="rgba(0, 229, 255, 0.1)" stroke="#00E5FF" strokeWidth="2" filter="url(#glowCyan)" />
                  <path d="M 12 160 L 32 160 M 22 152 L 32 160 L 22 168" fill="transparent" stroke="#00E5FF" strokeWidth="2" />
                  
                  {/* labels on authorized envelope */}
                  <rect x="-35" y={Y_PATH - 46} width="115" height="18" rx="2" fill="#09090b" stroke="#27272a" />
                  <text x="-28" y={Y_PATH - 34} fill="#00E5FF" fontSize="8" fontFamily="monospace">Agent: worker_b2</text>
                  
                  <rect x="-35" y={Y_PATH - 68} width="115" height="18" rx="2" fill="#09090b" stroke="#27272a" />
                  <text x="-28" y={Y_PATH - 56} fill="#ffffff" fontSize="8" fontFamily="monospace">Intent: /finance/ledger</text>
                </motion.g>

                {/* Authorized Verified Alert Badge */}
                <motion.g
                  animate={{
                    opacity: [0, 0, 1, 0, 0],
                    scale: [0.9, 0.9, 1.05, 0.9, 0.9]
                  }}
                  transition={{
                    duration: LOOP_DURATION,
                    times: [0, 0.7, 0.72, 0.85, 1],
                    repeat: Infinity
                  }}
                >
                  <rect x="290" y="220" width="160" height="34" rx="4" fill="#09090b" stroke="#00E5FF" strokeWidth="2" filter="url(#glowCyan)" />
                  <text x="370" y="241" fill="#00E5FF" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">[SIG_VERIFIED]</text>
                </motion.g>

              </SvgVisual>
            </VisualArea>

            <CodeTerminal>
              <CodeTerminalHeader>
                <MacDotsRow>
                  <MacDot $color="#ff5f56" />
                  <MacDot $color="#ffbd2e" />
                  <MacDot $color="#27c93f" />
                </MacDotsRow>
                <FileTab>aegis.toml</FileTab>
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
                </LineNumbersGutter>
                <CodeBody>
                  <Pre>
                    <Comment># aegis.toml (Hot-Reloaded RAM Firewall)</Comment>
                    <br />
                    <SectionHeader>[groups.finance_worker]</SectionHeader>
                    <br />
                    <KeyName>allowed_namespaces</KeyName> <SyntaxSymbol>=</SyntaxSymbol> <SyntaxSymbol>[</SyntaxSymbol><StringVal>"/finance/ledger/*"</StringVal><SyntaxSymbol>]</SyntaxSymbol>
                    <br />
                    <KeyName>blocked_namespaces</KeyName> <SyntaxSymbol>=</SyntaxSymbol> <SyntaxSymbol>[</SyntaxSymbol><StringVal>"/core/admin"</StringVal><SyntaxSymbol>]</SyntaxSymbol>
                    <br />
                    <br />
                    <Comment># A packet outside this ACL triggers global quarantine in O(1)</Comment>
                  </Pre>
                </CodeBody>
              </EditorContainer>
              <VimStatusLine>
                <div>
                  <VimMode>NORMAL</VimMode>
                  <span>aegis.toml</span>
                </div>
                <div>
                  <span>utf-8 [toml] 6:1</span>
                </div>
              </VimStatusLine>
            </CodeTerminal>
          </UiShell>
        </RightColumn>
      </ContentWrapper>
    </SectionContainer>
  );
}
