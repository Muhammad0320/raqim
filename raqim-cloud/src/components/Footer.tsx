'use client';

import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';

const FooterContainer = styled.footer`
  background-color: #000000;
  border-top: 1px solid rgba(39, 39, 42, 0.5); /* zinc-800 */
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
  color: #00f3ff;
  filter: drop-shadow(0 0 8px rgba(0, 243, 255, 0.6));
`;

const LogoText = styled.span`
  font-family: var(--font-geist-mono), monospace;
  font-size: 1.125rem;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  
  span {
    color: #00f3ff;
    margin-left: 4px;
  }
`;

const BrandSubtext = styled.p`
  font-family: var(--font-geist-sans), sans-serif;
  font-size: 0.875rem;
  color: #a1a1aa; /* zinc-400 */
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
  transition: color 0.2s ease;

  &:hover {
    color: #e4e4e7; /* zinc-200 */
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
  transition: color 0.2s ease;

  &:hover {
    color: #e4e4e7;
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
              <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" stroke="currentColor" strokeWidth="4" fill="none" />
              <path d="M50 25 L75 38 L75 62 L50 75 L25 62 L25 38 Z" stroke="currentColor" strokeWidth="2" fill="none" />
              <circle cx="50" cy="50" r="6" fill="currentColor" />
              <line x1="50" y1="5" x2="50" y2="25" stroke="currentColor" strokeWidth="2" />
              <line x1="10" y1="25" x2="25" y2="38" stroke="currentColor" strokeWidth="2" />
              <line x1="90" y1="25" x2="75" y2="38" stroke="currentColor" strokeWidth="2" />
              <line x1="10" y1="75" x2="25" y2="62" stroke="currentColor" strokeWidth="2" />
              <line x1="90" y1="75" x2="75" y2="62" stroke="currentColor" strokeWidth="2" />
              <line x1="50" y1="95" x2="50" y2="75" stroke="currentColor" strokeWidth="2" />
            </LogoIcon>
            <LogoText>RAQIM<span>CLOUD</span></LogoText>
          </LogoSection>
          <BrandSubtext>
            The deterministic Swarm OS. Zero garbage collection. Global CRDT state.
          </BrandSubtext>
        </BrandColumn>

        {/* Column 2: Developers */}
        <LinkColumn>
          <ColumnTitle>Developers</ColumnTitle>
          <LinkList>
            <FooterLink href="/docs">Documentation</FooterLink>
            <FooterLink href="/docs/python">Python SDK</FooterLink>
            <FooterLink href="/docs/rust">Rust WASM SDK</FooterLink>
            <FooterLink href="/docs/cli">CLI Tool</FooterLink>
            <FooterLink href="/docs/mcp">MCP Bridge</FooterLink>
          </LinkList>
        </LinkColumn>

        {/* Column 3: Core Physics */}
        <LinkColumn>
          <ColumnTitle>Core Physics</ColumnTitle>
          <LinkList>
            <FooterLink href="#architecture">Loro CRDTs</FooterLink>
            <FooterLink href="#security">Aegis Firewall</FooterLink>
            <FooterLink href="#temporal">Temporal Router</FooterLink>
            <FooterLink href="#memory">Zero-Copy Ingress</FooterLink>
          </LinkList>
        </LinkColumn>

        {/* Column 4: Enterprise */}
        <LinkColumn>
          <ColumnTitle>Enterprise</ColumnTitle>
          <LinkList>
            <FooterLink href="/whitepaper">Security Whitepaper</FooterLink>
            <FooterLink href="/docs/self-hosting">Self-Hosting Guide</FooterLink>
            <FooterLink href="/sales">Contact Sales</FooterLink>
          </LinkList>
        </LinkColumn>
      </FooterContent>

      <BottomBar>
        <Copyright>&copy; {new Date().getFullYear()} Raqim Systems Inc.</Copyright>
        <SocialIcons>
          <SocialLink href="https://github.com/raqim" target="_blank" aria-label="GitHub">
            <svg viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </SocialLink>
          <SocialLink href="https://x.com/raqim" target="_blank" aria-label="X (Twitter)">
            <svg viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </SocialLink>
          <SocialLink href="https://discord.com" target="_blank" aria-label="Discord">
            <svg viewBox="0 0 24 24">
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
            </svg>
          </SocialLink>
        </SocialIcons>
      </BottomBar>
    </FooterContainer>
  );
}
