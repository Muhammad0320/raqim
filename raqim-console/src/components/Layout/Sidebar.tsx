'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

// Animations
const rotateOuter = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulseGlow = keyframes`
  0%, 100% { opacity: 0.5; filter: drop-shadow(0 0 2px #00f3ff); }
  50% { opacity: 1; filter: drop-shadow(0 0 8px #00f3ff); }
`;

const blinkHeartbeat = keyframes`
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
`;

// Styled Components
const SidebarContainer = styled.aside`
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background-color: #050505;
  border-right: 1px solid #1f1f23;
  height: 100%;
  z-index: 40;
  box-sizing: border-box;
  font-family: monospace;
`;

const LogoSection = styled.div`
  padding: 24px;
  border-bottom: 1px solid #1f1f23;
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(180deg, #09090b 0%, #050505 100%);
  box-sizing: border-box;
`;

const LogoWrapper = styled.div`
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  svg .outer-ring {
    transform-origin: center;
    animation: ${rotateOuter} 20s linear infinite;
  }

  svg .inner-nucleus {
    animation: ${pulseGlow} 2s ease-in-out infinite;
  }
`;

const BrandName = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const BrandTitle = styled.h1`
  font-size: 14px;
  font-weight: 900;
  letter-spacing: 0.22em;
  color: #ffffff;
  margin: 0;
  text-transform: uppercase;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.15);
`;

const BrandSubtitle = styled.span`
  font-size: 9px;
  font-weight: bold;
  letter-spacing: 0.28em;
  color: #00f3ff;
  text-transform: uppercase;
  opacity: 0.9;
  text-shadow: 0 0 5px rgba(0, 243, 255, 0.3);
`;

const ProfileSection = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #1f1f23;
  background-color: rgba(9, 9, 11, 0.2);
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
`;

const ProfileHeader = styled.div`
  font-size: 9px;
  color: #71717a;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-weight: bold;
`;

const OperatorDetails = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const TerminalAvatar = styled.div`
  width: 32px;
  height: 32px;
  border: 1px solid #27272a;
  background-color: #09090b;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    inset: -3px;
    border: 1px dashed rgba(255, 255, 255, 0.1);
  }
`;

const AvatarText = styled.span`
  font-size: 11px;
  color: #ffffff;
  font-weight: bold;
`;

const OperatorMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const OperatorId = styled.span`
  font-size: 12px;
  font-weight: bold;
  color: #ffffff;
`;

const OperatorStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const HeartbeatDot = styled.span`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: #10b981;
  box-shadow: 0 0 6px #10b981;
  animation: ${blinkHeartbeat} 1.5s infinite;
`;

const StatusText = styled.span`
  font-size: 9px;
  color: #a1a1aa;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

const LicenseRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 9px;
  border-top: 1px dashed #1f1f23;
  padding-top: 8px;
  margin-top: 4px;
`;

const LicenseLabel = styled.span`
  color: #52525b;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

const LicenseValue = styled.span`
  color: #00f3ff;
  font-weight: bold;
  letter-spacing: 0.12em;
  text-shadow: 0 0 5px rgba(0, 243, 255, 0.2);
`;

const NavList = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  flex: 1;
  overflow-y: auto;
  box-sizing: border-box;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: #1f1f23;
  }
`;

const NavLink = styled(Link)<{ $isActive: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  color: ${props => props.$isActive ? '#ffffff' : '#71717a'};
  text-decoration: none;
  font-size: 12px;
  font-weight: ${props => props.$isActive ? 'bold' : 'normal'};
  letter-spacing: 0.15em;
  text-transform: uppercase;
  transition: color 0.2s;
  box-sizing: border-box;

  &:hover {
    color: #ffffff;
  }
`;

const ActiveLine = styled(motion.div)`
  position: absolute;
  left: 0;
  top: 12%;
  height: 76%;
  width: 2px;
  background-color: #00f3ff;
  box-shadow: 0 0 8px #00f3ff;
`;

const IconSpan = styled.span<{ $isActive: boolean }>`
  font-size: 20px;
  color: ${props => props.$isActive ? '#00f3ff' : '#52525b'};
  transition: color 0.2s;
  
  ${props => props.$isActive && `
    filter: drop-shadow(0 0 4px rgba(0, 243, 255, 0.8));
  `}

  ${NavLink}:hover & {
    color: #00f3ff;
    filter: drop-shadow(0 0 4px rgba(0, 243, 255, 0.5));
  }
`;

const BottomSection = styled.div`
  padding: 24px;
  border-top: 1px solid #1f1f23;
  background-color: #020202;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-sizing: border-box;
`;

const DiagnosticGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-bottom: 1px dashed #1f1f23;
  padding-bottom: 12px;
`;

const DiagnosticRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 9px;
  font-family: monospace;
`;

const DiagnosticLabel = styled.span`
  color: #52525b;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

const DiagnosticValue = styled.span<{ $alert?: boolean }>`
  color: ${props => props.$alert ? '#ef4444' : '#a1a1aa'};
  font-weight: bold;
`;

const ControlButton = styled.button`
  width: 100%;
  background-color: #050505;
  border: 1px solid #27272a;
  color: #a1a1aa;
  padding: 10px;
  font-family: monospace;
  font-size: 10px;
  font-weight: bold;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;

  &:hover {
    background-color: #ef4444;
    color: #000000;
    border-color: #ef4444;
    box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);
  }
`;

export function Sidebar() {
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const navLinks = [
    { href: '/', icon: 'dashboard', label: 'Dashboard' },
    { href: '/topology', icon: 'hub', label: 'Topology' },
    { href: '/firewall', icon: 'security', label: 'Aegis Firewall' },
    { href: '/vault', icon: 'database', label: 'Audit Vault' },
    { href: '/router', icon: 'timeline', label: 'Memory Router' },
  ];

  return (
    <SidebarContainer>
      <LogoSection>
        <LogoWrapper>
          <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer Hexagon with slow rotate */}
            <polygon 
              className="outer-ring" 
              points="50,5 90,28 90,72 50,95 10,72 10,28" 
              stroke="#ffffff" 
              strokeWidth="5" 
              strokeLinejoin="round" 
            />
            {/* Inner Hexagon Synapse web */}
            <polygon 
              points="50,22 75,36 75,64 50,78 25,64 25,36" 
              stroke="#00f3ff" 
              strokeWidth="3.5" 
              strokeLinejoin="round"
              opacity="0.8" 
            />
            {/* Pulsing Synapse center nucleus */}
            <circle 
              className="inner-nucleus" 
              cx="50" 
              cy="50" 
              r="8" 
              fill="#00f3ff" 
            />
            {/* Connection axon struts */}
            <line x1="50" y1="5" x2="50" y2="22" stroke="#ffffff" strokeWidth="2.5" />
            <line x1="10" y1="28" x2="25" y2="36" stroke="#ffffff" strokeWidth="2.5" />
            <line x1="90" y1="28" x2="75" y2="36" stroke="#ffffff" strokeWidth="2.5" />
            <line x1="10" y1="72" x2="25" y2="64" stroke="#ffffff" strokeWidth="2.5" />
            <line x1="90" y1="72" x2="75" y2="64" stroke="#ffffff" strokeWidth="2.5" />
            <line x1="50" y1="95" x2="50" y2="78" stroke="#ffffff" strokeWidth="2.5" />
          </svg>
        </LogoWrapper>
        <BrandName>
          <BrandTitle>Raqim OS</BrandTitle>
          <BrandSubtitle>Console // Core</BrandSubtitle>
        </BrandName>
      </LogoSection>

      <ProfileSection>
        <ProfileHeader>Operator Session</ProfileHeader>
        <OperatorDetails>
          <TerminalAvatar>
            <AvatarText>OP</AvatarText>
          </TerminalAvatar>
          <OperatorMeta>
            <OperatorId>0x7F4B2D9</OperatorId>
            <OperatorStatus>
              <HeartbeatDot />
              <StatusText>Enclave Nominal</StatusText>
            </OperatorStatus>
          </OperatorMeta>
        </OperatorDetails>
        <LicenseRow>
          <LicenseLabel>License Node</LicenseLabel>
          <LicenseValue>Enterprise</LicenseValue>
        </LicenseRow>
      </ProfileSection>

      <NavList>
        {navLinks.map((link, index) => {
          const isActive = pathname === link.href;
          return (
            <NavLink
              key={link.href}
              href={link.href}
              $isActive={isActive}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Premium Framer Motion Hover Background */}
              <AnimatePresence>
                {hoveredIndex === index && (
                  <motion.div
                    layoutId="sidebar-hover-bg"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '2px',
                      zIndex: -1
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  />
                )}
              </AnimatePresence>

              {/* Active Indicator Sliding bar */}
              {isActive && (
                <ActiveLine 
                  layoutId="sidebar-active-bar" 
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              <IconSpan $isActive={isActive} className="material-symbols-outlined">
                {link.icon}
              </IconSpan>
              
              <motion.span
                animate={{ x: hoveredIndex === index && !isActive ? 4 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {link.label}
              </motion.span>
            </NavLink>
          );
        })}
      </NavList>

      <BottomSection>
        <DiagnosticGroup>
          <DiagnosticRow>
            <DiagnosticLabel>Uptime</DiagnosticLabel>
            <DiagnosticValue>14h 22m 09s</DiagnosticValue>
          </DiagnosticRow>
          <DiagnosticRow>
            <DiagnosticLabel>Core Latency</DiagnosticLabel>
            <DiagnosticValue>1.2 ms</DiagnosticValue>
          </DiagnosticRow>
          <DiagnosticRow>
            <DiagnosticLabel>Active Peers</DiagnosticLabel>
            <DiagnosticValue>08</DiagnosticValue>
          </DiagnosticRow>
        </DiagnosticGroup>

        <ControlButton>
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>lock</span>
          Lock Session
        </ControlButton>
      </BottomSection>
    </SidebarContainer>
  );
}
