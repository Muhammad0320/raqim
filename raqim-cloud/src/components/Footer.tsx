'use client';

import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';

const FooterContainer = styled.footer`
  background-color: #000000;
  border-top: 1px solid #27272a; /* strict 1px border-zinc-800 */
  padding: 80px 32px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  width: 100%;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 64px;
  margin-bottom: 80px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr 1fr;
    gap: 48px;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 40px;
  }
`;

const BrandColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const LogoIcon = styled.svg`
  width: 32px;
  height: 32px;
  color: #ffffff;
`;

const LogoText = styled.span`
  font-family: var(--font-geist-mono), monospace;
  font-size: 1.125rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.2em;
  text-transform: uppercase;
`;

const BrandSubtext = styled.p`
  font-family: var(--font-geist-sans), sans-serif;
  font-size: 0.875rem;
  color: #a1a1aa; /* Zinc 400 */
  line-height: 1.6;
  max-width: 240px;
`;

const LinkColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const ColumnTitle = styled.h4`
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.875rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const LinkList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FooterLink = styled(Link)`
  font-family: var(--font-geist-sans), sans-serif;
  font-size: 0.875rem;
  color: #71717a; /* zinc-500 */
  text-decoration: none;
  transition: all 0.2s ease-in-out;

  &:hover {
    color: #00E5FF; /* glows cyan strictly on hover */
    text-shadow: 0 0 8px rgba(0, 229, 255, 0.6);
  }
`;

const BottomBar = styled.div`
  max-width: 1200px;
  width: 100%;
  padding-top: 32px;
  border-top: 1px solid #27272a; /* zinc-800 */
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 24px;
    align-items: flex-start;
  }
`;

const Copyright = styled.div`
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.75rem;
  color: #52525b; /* zinc-600 */
`;

const SocialIcons = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const SocialLink = styled.a`
  color: #52525b;
  transition: all 0.2s ease-in-out;

  &:hover {
    color: #00E5FF;
    text-shadow: 0 0 8px rgba(0, 229, 255, 0.5);
  }

  svg {
    width: 20px;
    height: 20px;
    fill: currentColor;
  }
`;

export default function Footer() {
  return (
    <FooterContainer>
      <FooterContent>
        {/* Column 1: Brand */}
        <BrandColumn>
          <LogoSection>
            <LogoIcon viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="logo-glow-footer" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              {/* Heavy vertical spine monolith */}
              <path d="M28 15v70" stroke="currentColor" strokeWidth="8" strokeLinecap="square" />
              {/* Sharp, geometric upper loop */}
              <path d="M28 19h36l12 16l-12 16H28" stroke="currentColor" strokeWidth="8" strokeLinecap="square" strokeLinejoin="miter" />
              {/* Intersecting sharp, glowing cyan diagonal zero-copy bypass path */}
              <path d="M46 49l28 36" stroke="#00E5FF" strokeWidth="8" strokeLinecap="square" filter="url(#logo-glow-footer)" />
            </LogoIcon>
            <LogoText>RAQIM CLOUD</LogoText>
          </LogoSection>
          <BrandSubtext>
            The zero-copy, bare-metal Agentic OS. Zero garbage collection. Global CRDT state.
          </BrandSubtext>
        </BrandColumn>

        {/* Column 2: Developers */}
        <LinkColumn>
          <ColumnTitle>Developers</ColumnTitle>
          <LinkList>
            <FooterLink href="/docs">Documentation</FooterLink>
            <FooterLink href="/docs/toolchain">Python SDK</FooterLink>
            <FooterLink href="/docs/toolchain">Rust WASM SDK</FooterLink>
            <FooterLink href="/docs/toolchain">MCP Bridge</FooterLink>
          </LinkList>
        </LinkColumn>

        {/* Column 3: Core Physics */}
        <LinkColumn>
          <ColumnTitle>Core Physics</ColumnTitle>
          <LinkList>
            <FooterLink href="/docs/physics/architecture">Loro CRDTs</FooterLink>
            <FooterLink href="/docs/core-systems/aegis-firewall">Aegis Firewall</FooterLink>
            <FooterLink href="/docs/core-systems/temporal-router">Temporal Router</FooterLink>
            <FooterLink href="/docs/physics/architecture">Zero-Copy TCP</FooterLink>
          </LinkList>
        </LinkColumn>

        {/* Column 4: Enterprise */}
        <LinkColumn>
          <ColumnTitle>Enterprise</ColumnTitle>
          <LinkList>
            <FooterLink href="/pricing">Pricing & Tiers</FooterLink>
            <FooterLink href="/docs">Security Whitepaper</FooterLink>
            <FooterLink href="/docs/deployment/kubernetes">Self-Hosting K8s</FooterLink>
            <FooterLink href="/docs">Contact Sales</FooterLink>
          </LinkList>
        </LinkColumn>
      </FooterContent>

      <BottomBar>
        <Copyright>&copy; {new Date().getFullYear()} Raqim Systems Inc.</Copyright>
        <SocialIcons>
          <SocialLink href="https://github.com/muhammad0320/synapse" target="_blank" aria-label="GitHub">
            <svg viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </SocialLink>
          <SocialLink href="https://x.com" target="_blank" aria-label="X (Twitter)">
            <svg viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </SocialLink>
        </SocialIcons>
      </BottomBar>
    </FooterContainer>
  );
}
