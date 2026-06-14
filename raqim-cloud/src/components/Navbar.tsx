'use client';

import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';

const NavContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(39, 39, 42, 0.5); /* zinc-800 equivalent */
  z-index: 100;
`;

const LeftSection = styled.div`
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

const CenterSection = styled.nav`
  display: flex;
  align-items: center;
  gap: 32px;

  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled(Link)`
  font-size: 0.875rem;
  font-weight: 500;
  color: #a1a1aa; /* zinc-400 */
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    color: #ffffff;
    text-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const GitHubButton = styled.a`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  background: transparent;
  color: #a1a1aa;
  font-size: 0.875rem;
  font-family: var(--font-geist-mono), monospace;
  text-decoration: none;
  border: 1px solid transparent;
  transition: all 0.2s ease;

  &:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }

  svg {
    width: 16px;
    height: 16px;
    fill: currentColor;
  }
`;

const CtaButton = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  background: #000000;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  text-decoration: none;
  box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.05), 0 0 15px rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(255, 255, 255, 0.5);
    box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.1), 0 0 20px rgba(255, 255, 255, 0.2);
  }
`;

export default function Navbar() {
  return (
    <NavContainer>
      <LeftSection>
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
      </LeftSection>

      <CenterSection>
        <NavLink href="/docs">Docs</NavLink>
        <NavLink href="#architecture">Architecture</NavLink>
        <NavLink href="#toolchain">Toolchain</NavLink>
        <NavLink href="#enterprise">Enterprise</NavLink>
      </CenterSection>

      <RightSection>
        <GitHubButton href="https://github.com/muhammad0320/synapse" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          14.2k
        </GitHubButton>
        <CtaButton href="/auth/login">
          [ Deploy Daemon ]
        </CtaButton>
      </RightSection>
    </NavContainer>
  );
}
