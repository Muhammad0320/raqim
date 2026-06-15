'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrentSession } from '../../actions/admin';

// Keyframe Animations
const blinkHeartbeat = keyframes`
  0%, 100% { opacity: 0.35; }
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
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  flex-shrink: 0;

  svg .r-part, svg .r-accent, svg .hex-border, svg .hex-bg {
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  &:hover svg .r-part {
    fill: #ffffff;
    filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.4));
  }

  &:hover svg .r-accent {
    filter: drop-shadow(0 0 15px rgba(0, 243, 255, 0.9)) brightness(1.2);
  }

  &:hover svg .hex-border {
    stroke: #00f3ff;
    opacity: 0.8;
  }
  
  &:hover svg .hex-bg {
    fill: #121214;
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

const TerminalAvatar = styled.div<{ $isActive: boolean }>`
  width: 32px;
  height: 32px;
  border: 1px solid ${props => props.$isActive ? '#27272a' : '#ff003c'};
  background-color: #09090b;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: ${props => props.$isActive ? 'none' : '0 0 8px rgba(255, 0, 60, 0.15)'};
  
  &::after {
    content: '';
    position: absolute;
    inset: -3px;
    border: 1px dashed ${props => props.$isActive ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 0, 60, 0.2)'};
  }
`;

const AvatarText = styled.span<{ $isActive: boolean }>`
  font-size: 11px;
  color: ${props => props.$isActive ? '#ffffff' : '#ff003c'};
  font-weight: bold;
`;

const OperatorMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
`;

const OperatorId = styled.span`
  font-size: 12px;
  font-weight: bold;
  color: #ffffff;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`;

const OperatorStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const HeartbeatDot = styled.span<{ $isActive: boolean }>`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: ${props => props.$isActive ? '#10b981' : '#ff003c'};
  box-shadow: 0 0 6px ${props => props.$isActive ? '#10b981' : '#ff003c'};
  animation: ${blinkHeartbeat} 1.5s infinite;
`;

const StatusText = styled.span<{ $isActive: boolean }>`
  font-size: 9px;
  color: ${props => props.$isActive ? '#a1a1aa' : '#ff003c'};
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: bold;
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

const LicenseValue = styled.span<{ $isActive: boolean }>`
  color: ${props => props.$isActive ? '#00f3ff' : '#71717a'};
  font-weight: bold;
  letter-spacing: 0.12em;
  text-shadow: ${props => props.$isActive ? '0 0 5px rgba(0, 243, 255, 0.2)' : 'none'};
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

const ControlButton = styled.button<{ $authAction?: boolean }>`
  width: 100%;
  background-color: #050505;
  border: 1px solid ${props => props.$authAction ? '#00f3ff' : '#27272a'};
  color: ${props => props.$authAction ? '#00f3ff' : '#a1a1aa'};
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
    background-color: ${props => props.$authAction ? '#00f3ff' : '#ef4444'};
    color: #000000;
    border-color: ${props => props.$authAction ? '#00f3ff' : '#ef4444'};
    box-shadow: 0 0 10px ${props => props.$authAction ? 'rgba(0, 243, 255, 0.4)' : 'rgba(239, 68, 68, 0.4)'};
  }
`;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [session, setSession] = useState<{
    loading: boolean;
    authenticated: boolean;
    subject: string;
    features: string[];
  }>({
    loading: true,
    authenticated: false,
    subject: '',
    features: [],
  });

  useEffect(() => {
    getCurrentSession()
      .then((res) => {
        setSession({
          loading: false,
          authenticated: res.authenticated,
          subject: res.subject || '',
          features: res.features || [],
        });
      })
      .catch((err) => {
        console.error("Failed to fetch session metadata:", err);
        setSession({
          loading: false,
          authenticated: false,
          subject: '',
          features: [],
        });
      });
  }, [pathname]);

  const handleSessionAction = () => {
    if (session.authenticated) {
      document.cookie = "raqim_license=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      router.push('/login');
    } else {
      router.push('/login');
    }
  };

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
          <svg width="44" height="44" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="main-plate" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#a1a1aa" />
              </linearGradient>
              <linearGradient id="accent-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f3ff" />
                <stop offset="100%" stopColor="#0088ff" />
              </linearGradient>
              <linearGradient id="dark-plate" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#18181b" />
                <stop offset="100%" stopColor="#09090b" />
              </linearGradient>
            </defs>

            {/* Outer Technical Hexagon */}
            <polygon className="hex-bg" points="50,2 93,25 93,75 50,98 7,75 7,25" fill="url(#dark-plate)" stroke="#27272a" strokeWidth="2" />
            
            {/* Inner Hexagon Outline */}
            <polygon className="hex-border" points="50,10 85,30 85,70 50,90 15,70 15,30" fill="none" stroke="#27272a" strokeWidth="1" opacity="0.5" />

            {/* --- Intricate 'R' Construction --- */}
            
            {/* Left Stem - Composed of two parallel bars for detail */}
            <rect className="r-part" x="28" y="24" width="6" height="52" fill="url(#main-plate)" />
            <rect className="r-part" x="36" y="24" width="4" height="52" fill="url(#main-plate)" opacity="0.8" />
            
            {/* Top Loop section - Outer plate */}
            <path className="r-part" d="M42 24 L68 24 L76 32 L76 46 L68 54 L42 54 Z" fill="url(#main-plate)" />
            
            {/* Inner Hole for Top Loop */}
            <path d="M42 32 L62 32 L66 36 L66 42 L62 46 L42 46 Z" fill="#09090b" />

            {/* The Accent Leg - A dynamic glowing angular piece */}
            <polygon className="r-accent" points="42,58 54,58 74,78 62,78" fill="url(#accent-cyan)" />

            {/* --- Micro Details --- */}
            <circle cx="31" cy="24" r="1.5" fill="#09090b" />
            <circle cx="31" cy="76" r="1.5" fill="#09090b" />
            <circle cx="76" cy="32" r="1.5" fill="#09090b" />
            <circle cx="76" cy="46" r="1.5" fill="#09090b" />
            
            {/* Glowing base nodes */}
            <rect className="r-accent" x="28" y="80" width="6" height="2" fill="url(#accent-cyan)" />
            <rect className="r-accent" x="36" y="80" width="4" height="2" fill="url(#accent-cyan)" />

            {/* Data lines */}
            <line x1="54" y1="58" x2="80" y2="58" stroke="#27272a" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="80" y1="58" x2="80" y2="78" stroke="#27272a" strokeWidth="1" strokeDasharray="2 2" />
          </svg>
        </LogoWrapper>
        <BrandName>
          <BrandTitle>Raqim OS</BrandTitle>
          <BrandSubtitle>Console // Core</BrandSubtitle>
        </BrandName>
      </LogoSection>

      <ProfileSection>
        <ProfileHeader>Operator Session</ProfileHeader>
        {session.loading ? (
          <div style={{ fontSize: '10px', color: '#71717a', letterSpacing: '1px' }}>
            [ VERIFYING SESSION... ]
          </div>
        ) : (
          <>
            <OperatorDetails>
              <TerminalAvatar $isActive={session.authenticated}>
                <AvatarText $isActive={session.authenticated}>
                  {session.authenticated ? 'OP' : '??'}
                </AvatarText>
              </TerminalAvatar>
              <OperatorMeta>
                <OperatorId title={session.subject}>
                  {session.authenticated ? session.subject : 'UNAUTHENTICATED'}
                </OperatorId>
                <OperatorStatus>
                  <HeartbeatDot $isActive={session.authenticated} />
                  <StatusText $isActive={session.authenticated}>
                    {session.authenticated ? 'Enclave Nominal' : 'DEGRADED / IDLE'}
                  </StatusText>
                </OperatorStatus>
              </OperatorMeta>
            </OperatorDetails>
            <LicenseRow>
              <LicenseLabel>License Node</LicenseLabel>
              <LicenseValue $isActive={session.authenticated}>
                {session.authenticated 
                  ? (session.features.length > 0 ? 'Enterprise' : 'Open Core')
                  : 'NONE // IDLE'
                }
              </LicenseValue>
            </LicenseRow>
          </>
        )}
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
            <DiagnosticValue>{session.authenticated ? '14h 22m 09s' : '00h 00m 00s'}</DiagnosticValue>
          </DiagnosticRow>
          <DiagnosticRow>
            <DiagnosticLabel>Core Latency</DiagnosticLabel>
            <DiagnosticValue>{session.authenticated ? '1.2 ms' : '--- ms'}</DiagnosticValue>
          </DiagnosticRow>
          <DiagnosticRow>
            <DiagnosticLabel>Active Peers</DiagnosticLabel>
            <DiagnosticValue>{session.authenticated ? '08' : '00'}</DiagnosticValue>
          </DiagnosticRow>
        </DiagnosticGroup>

        <ControlButton 
          $authAction={!session.authenticated}
          onClick={handleSessionAction}
          disabled={session.loading}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
            {session.authenticated ? 'lock' : 'login'}
          </span>
          {session.authenticated ? 'Lock Session' : 'Authenticate'}
        </ControlButton>
      </BottomSection>
    </SidebarContainer>
  );
}
