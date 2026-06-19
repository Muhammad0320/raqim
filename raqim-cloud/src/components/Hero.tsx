'use client';

import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

const HeroContainer = styled.section`
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120px 24px 64px;
  background-color: #000000;
  overflow: hidden;
`;

const RadialGradient = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.05) 0%, rgba(0, 0, 0, 0) 70%);
  filter: blur(60px);
  z-index: 0;
  pointer-events: none;
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 10;
  max-width: 1200px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Headline = styled(motion.h1)`
  font-family: var(--font-geist-sans), sans-serif;
  font-size: clamp(3.5rem, 8vw, 7rem);
  font-weight: 900;
  color: #ffffff;
  letter-spacing: -0.04em;
  line-height: 1.1;
  text-align: center;
  margin: 0 0 24px 0;
  text-shadow: 4px 4px 0px #00E5FF;
`;

const SubHeadline = styled(motion.p)`
  font-family: var(--font-geist-mono), monospace;
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: #a1a1aa; /* zinc-400 */
  text-align: center;
  max-width: 800px;
  line-height: 1.6;
  margin: 0 0 64px 0;
`;

const GridContainer = styled(motion.div)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  width: 100%;
  max-width: 1000px;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const TerminalWindow = styled.div`
  background: #09090b;
  border: 1px solid #27272a;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
`;

const TerminalHeader = styled.div`
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

const TerminalBody = styled.div`
  padding: 24px;
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.875rem;
  color: #e4e4e7;
  line-height: 1.7;
  min-height: 180px;
  display: flex;
  flex-direction: column;
`;

const TerminalLine = styled.div`
  display: flex;
`;

const TerminalPrompt = styled.span`
  color: #06b6d4;
  margin-right: 12px;
`;

const Cursor = styled.span`
  display: inline-block;
  width: 8px;
  height: 16px;
  background-color: #e4e4e7;
  margin-left: 4px;
  vertical-align: middle;
  animation: blink 1s step-end infinite;

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
`;

const BenchmarkHud = styled.div`
  background: #000000;
  border: 1px solid #27272a;
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
`;

const pulseGlow = keyframes`
  0% {
    text-shadow: 0 0 10px rgba(0, 229, 255, 0.4), 0 0 20px rgba(0, 229, 255, 0.2);
  }
  50% {
    text-shadow: 0 0 20px rgba(0, 229, 255, 0.8), 0 0 35px rgba(0, 229, 255, 0.5), 0 0 50px rgba(0, 229, 255, 0.3);
  }
  100% {
    text-shadow: 0 0 10px rgba(0, 229, 255, 0.4), 0 0 20px rgba(0, 229, 255, 0.2);
  }
`;

const BenchmarkValue = styled(motion.div)`
  font-family: var(--font-geist-mono), monospace;
  font-size: clamp(3rem, 6vw, 4.5rem);
  font-weight: 700;
  color: #00E5FF;
  line-height: 1;
  margin-bottom: 8px;
  animation: ${pulseGlow} 2s infinite ease-in-out;
`;

const BenchmarkLabel = styled.div`
  font-family: var(--font-geist-mono), monospace;
  font-size: 1rem;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: auto;
`;

const HonestyDisclaimer = styled.div`
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.75rem;
  color: #52525b; /* zinc-600 */
  margin-top: 32px;
  line-height: 1.5;
`;

const CODE_LINES = [
  "$ helm install raqim raqim/raqim-os \\",
  "    --set licenseKey=YOUR_KEY \\",
  "    --set storage=500Gi"
];

export default function Hero() {
  const [typedLines, setTypedLines] = useState<string[]>([]);
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  useEffect(() => {
    let active = true;
    const runTypewriter = async () => {
      setTypedLines([]);
      setIsTypingComplete(false);
      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      for (let i = 0; i < CODE_LINES.length; i++) {
        if (!active) return;
        const line = CODE_LINES[i];
        setTypedLines((prev) => [...prev, ""]);

        for (let j = 0; j < line.length; j++) {
          if (!active) return;
          setTypedLines((prev) => {
            const copy = [...prev];
            copy[i] = line.substring(0, j + 1);
            return copy;
          });
          await delay(20 + Math.random() * 15);
        }

        if (i < CODE_LINES.length - 1) {
          await delay(500); // Pause 500ms between lines
        }
      }
      if (active) {
        setIsTypingComplete(true);
      }
    };

    runTypewriter();
    return () => {
      active = false;
    };
  }, []);

  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString());

  useEffect(() => {
    const controls = animate(count, 104203, {
      duration: 2.5,
      ease: "easeOut",
      delay: 0.5,
    });
    return controls.stop;
  }, [count]);

  return (
    <HeroContainer>
      <RadialGradient />
      
      <ContentWrapper>
        <Headline
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          The Zero-Copy Agentic OS.
        </Headline>
        
        <SubHeadline
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          Bypass the garbage collector. Deterministic memory isolation and global CRDT state for bare-metal multi-agent swarms.
        </SubHeadline>

        <GridContainer
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <TerminalWindow>
            <TerminalHeader>
              <MacDot $color="#ff5f56" />
              <MacDot $color="#ffbd2e" />
              <MacDot $color="#27c93f" />
            </TerminalHeader>
            <TerminalBody>
              {typedLines.map((line, index) => {
                const isLastLine = index === typedLines.length - 1;
                return (
                  <TerminalLine key={index}>
                    <pre>
                      {line}
                      {isLastLine && <Cursor />}
                    </pre>
                  </TerminalLine>
                );
              })}
              {typedLines.length === 0 && (
                <TerminalLine>
                  <pre>
                    <Cursor />
                  </pre>
                </TerminalLine>
              )}
            </TerminalBody>
          </TerminalWindow>

          <BenchmarkHud>
            <BenchmarkValue>{rounded}</BenchmarkValue>
            <BenchmarkLabel>Tx/sec (Zero-Copy Throughput)</BenchmarkLabel>
            
            <HonestyDisclaimer>
              *Benchmarked on PCIe 4.0 NVMe, 32-Core AMD EPYC. Throughput scales linearly with bare-metal I/O limits.
            </HonestyDisclaimer>
          </BenchmarkHud>
        </GridContainer>
      </ContentWrapper>
    </HeroContainer>
  );
}
