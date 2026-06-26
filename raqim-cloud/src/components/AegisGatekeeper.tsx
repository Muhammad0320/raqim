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
  height: 100%;
  flex: 1;
`;

const VisualArea = styled.div`
  padding: 32px;
  background: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #27272a;
  flex: 1.2;
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
  flex: 0.8;
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
  const Y_PATH = 120;

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
              <FeatureTitle>Local Cryptographic Identity Firewall</FeatureTitle>
              <FeatureDesc>Always enabled. Enforces hardware-level signature checks for absolute zero-copy container isolation.</FeatureDesc>
            </FeatureItem>
            <FeatureItem>
              <FeatureTitle>Global Out-of-Band Quarantine Sync</FeatureTitle>
              <FeatureDesc>Enterprise Tier. Real-time threat telemetry propagation across the global Zenoh quarantine mesh.</FeatureDesc>
            </FeatureItem>
          </FeatureList>
        </LeftColumn>

        <RightColumn>
          <UiShell>
            <VisualArea>
              <SvgVisual viewBox="0 0 600 260" preserveAspectRatio="xMidYMid meet">
                {/* 1px Solid Ingress Path Line */}
                <line x1="40" y1={Y_PATH} x2="380" y2={Y_PATH} stroke="#27272a" strokeWidth="1" />
                <line x1="380" y1={Y_PATH} x2="440" y2={Y_PATH} stroke="#27272a" strokeWidth="1" />
                
                {/* Quarantine Eviction Path Line */}
                <path d={`M 230 ${Y_PATH} L 230 200 L 300 200`} fill="none" stroke="#27272a" strokeWidth="1" />

                {/* Audit Node Block */}
                <g>
                  <rect x="140" y={Y_PATH - 35} width="180" height="70" fill="#09090b" stroke="#27272a" strokeWidth="1" />
                  <text x="230" y={Y_PATH - 15} fill="#ffffff" fontSize="9" fontFamily="var(--font-geist-mono), monospace" fontWeight="bold" textAnchor="middle">AUDIT NODE</text>
                  <text x="230" y={Y_PATH} fill="#a1a1aa" fontSize="7.5" fontFamily="var(--font-geist-mono), monospace" textAnchor="middle">ED25519 VERIFICATION &amp;</text>
                  <text x="230" y={Y_PATH + 12} fill="#a1a1aa" fontSize="7.5" fontFamily="var(--font-geist-mono), monospace" textAnchor="middle">LINEAGE TOKEN MATCH</text>
                </g>

                {/* Eviction Block */}
                <g>
                  <rect x="300" y="175" width="260" height="50" fill="#09090b" stroke="#7f1d1d" strokeWidth="1" />
                  <text x="430" y="205" fill="#ef4444" fontSize="8" fontFamily="var(--font-geist-mono), monospace" fontWeight="bold" textAnchor="middle">[ ZENOH_QUARANTINE_MESH_EVICTION ]</text>
                </g>

                {/* Hypervisor Core Block */}
                <g>
                  <rect x="440" y={Y_PATH - 35} width="130" height="70" fill="#09090b" stroke="#00e5ff" strokeWidth="1" />
                  <text x="505" y={Y_PATH - 5} fill="#ffffff" fontSize="9" fontFamily="var(--font-geist-mono), monospace" fontWeight="bold" textAnchor="middle">HYPERVISOR</text>
                  <text x="505" y={Y_PATH + 10} fill="#00e5ff" fontSize="8" fontFamily="var(--font-geist-mono), monospace" textAnchor="middle">EXECUTION CORE</text>
                </g>

                {/* Labels */}
                <text x="40" y={Y_PATH - 15} fill="#71717a" fontSize="8" fontFamily="var(--font-geist-mono), monospace">INGRESS</text>

                {/* --- ANIMATIONS --- */}
                {/* Verified Envelope (Cyan) */}
                <motion.g
                  animate={{
                    x: [40, 140, 140, 440],
                    y: [Y_PATH - 6, Y_PATH - 6, Y_PATH - 6, Y_PATH - 6],
                    opacity: [0, 1, 1, 1, 0]
                  }}
                  transition={{
                    duration: 6,
                    times: [0, 0.25, 0.45, 0.8, 1],
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <rect width="12" height="12" fill="#00e5ff" />
                </motion.g>

                {/* Rogue Envelope (Red) */}
                <motion.g
                  animate={{
                    x: [40, 140, 140, 140, 300],
                    y: [Y_PATH - 6, Y_PATH - 6, Y_PATH - 6, 200 - 6, 200 - 6],
                    opacity: [0, 0, 1, 1, 1, 0]
                  }}
                  transition={{
                    duration: 6,
                    times: [0, 0.35, 0.5, 0.65, 0.85, 1],
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <rect width="12" height="12" fill="#ef4444" />
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
                <div style={{ display: 'flex', alignItems: 'center' }}>
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
