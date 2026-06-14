import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { useSwarmStore } from '../../lib/store/useSwarmStore';

const RadarContainer = styled.div`
  height: 240px;
  background-color: #09090b;
  border-bottom: 1px solid #27272a;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  background-color: #18181b;
  border-bottom: 1px solid #27272a;
  padding: 8px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
`;

const Title = styled.span`
  font-family: monospace;
  font-size: 10px;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: bold;
`;

const RadarContent = styled.div`
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #020202;
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const SweepLine = styled.div`
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  pointer-events: none;
  background: conic-gradient(from 0deg at 50% 50%, rgba(6, 182, 212, 0.15) 0deg, rgba(6, 182, 212, 0) 90deg);
  animation: ${spin} 4s linear infinite;
  z-index: 1;
`;

interface RadarBlip {
  id: string;
  x: number;
  y: number;
  violation_type: string;
  timestamp: number;
}

const hashToAngle = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
};

const hashToRadius = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Radius percentage: 20% to 90%
  return 20 + (Math.abs(hash) % 71);
};

export function ThreatRadar() {
  const aegisAlerts = useSwarmStore(state => state.aegisAlerts);
  const [blips, setBlips] = useState<RadarBlip[]>([]);

  useEffect(() => {
    if (aegisAlerts.length === 0) return;
    const latestAlert = aegisAlerts[aegisAlerts.length - 1];

    const id = `${latestAlert.agent_hex}-${latestAlert.timestamp}`;
    setBlips(prev => {
      if (prev.some(b => b.id === id)) return prev;

      const angle = hashToAngle(latestAlert.attempted_path || '');
      const radiusPercent = hashToRadius(latestAlert.agent_hex || '') / 100;
      const r = radiusPercent * 85; // Map to scale (max r=85 relative to 100 center)
      const rad = (angle * Math.PI) / 180;
      const x = 100 + r * Math.cos(rad);
      const y = 100 + r * Math.sin(rad);

      const newBlip: RadarBlip = {
        id,
        x,
        y,
        violation_type: latestAlert.violation_type,
        timestamp: Date.now()
      };

      return [...prev, newBlip];
    });
  }, [aegisAlerts]);

  // Ring buffer cleanup: remove blips older than 15s
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setBlips(prev => prev.filter(b => now - b.timestamp < 15000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <RadarContainer>
      <Header>
        <Title>Threat Radar Grid</Title>
      </Header>
      <RadarContent>
        <SweepLine />
        <svg width="100%" height="100%" viewBox="0 0 200 200" style={{ position: 'absolute', zIndex: 2 }}>
          <defs>
            <radialGradient id="radarFade" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(6,182,212,0.02)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.9)" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="98" fill="url(#radarFade)" stroke="#27272a" strokeWidth="0.5" />
          <circle cx="100" cy="100" r="70" fill="none" stroke="#27272a" strokeWidth="0.5" strokeDasharray="3 3" />
          <circle cx="100" cy="100" r="40" fill="none" stroke="#27272a" strokeWidth="0.5" strokeDasharray="3 3" />
          
          {/* Axis lines */}
          <line x1="100" y1="2" x2="100" y2="198" stroke="#1c1917" strokeWidth="0.5" />
          <line x1="2" y1="100" x2="198" y2="100" stroke="#1c1917" strokeWidth="0.5" />

          {/* Plot Blips */}
          {blips.map(blip => {
            const color = blip.violation_type === 'CRYPTO_SPOOF' ? '#ef4444' : '#ffb300';
            return (
              <g key={blip.id}>
                {/* Sonar expansion circle */}
                <motion.circle
                  cx={blip.x}
                  cy={blip.y}
                  r={12}
                  fill="none"
                  stroke={color}
                  strokeWidth={1}
                  initial={{ scale: 0.5, opacity: 0.8 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'easeOut' }}
                />
                {/* Main Blip */}
                <motion.circle
                  cx={blip.x}
                  cy={blip.y}
                  r={5}
                  fill={color}
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ 
                    scale: [1, 1.4, 1],
                    opacity: [1, 0.4, 0]
                  }}
                  transition={{ 
                    scale: { repeat: Infinity, duration: 1.8 },
                    opacity: { duration: 15, ease: 'linear' }
                  }}
                />
              </g>
            );
          })}
        </svg>
      </RadarContent>
    </RadarContainer>
  );
}
