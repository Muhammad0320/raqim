'use client';

import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirewallStore, AegisAlert } from '../../store/firewallStore';

const RadarContainer = styled.div`
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, #18181b 0%, #09090b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const Svg = styled.svg`
  width: 100%;
  height: 100%;
  max-width: 600px;
  max-height: 600px;
  overflow: visible;
`;

const RadarCircle = styled.circle`
  fill: none;
  stroke: #27272a;
  stroke-width: 1;
`;

// Mathematical helpers
function hashStringToNum(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getCoordinates(alert: AegisAlert, maxRadius: number) {
  const angleDeg = hashStringToNum(alert.attempted_path) % 360;
  const angleRad = (angleDeg * Math.PI) / 180;
  
  // Radius mapped from 20% to 90% of max radius
  const radiusPct = 0.2 + (hashStringToNum(alert.agent_hex) % 70) / 100;
  const r = maxRadius * radiusPct;

  return {
    x: r * Math.cos(angleRad),
    y: r * Math.sin(angleRad),
  };
}

export default function ThreatRadar() {
  const alerts = useFirewallStore(state => state.alerts);
  const size = 600;
  const center = size / 2;
  const maxRadius = center - 20;

  return (
    <RadarContainer>
      <Svg viewBox={`0 0 ${size} ${size}`}>
        {/* Radar Grids */}
        <RadarCircle cx={center} cy={center} r={maxRadius * 0.33} />
        <RadarCircle cx={center} cy={center} r={maxRadius * 0.66} />
        <RadarCircle cx={center} cy={center} r={maxRadius} />
        
        {/* Crosshairs */}
        <line x1={center} y1={0} x2={center} y2={size} stroke="#27272a" />
        <line x1={0} y1={center} x2={size} y2={center} stroke="#27272a" />

        <AnimatePresence>
          {alerts.map(alert => {
            const { x, y } = getCoordinates(alert, maxRadius);
            // Default red, amber for rate limits or warnings
            const color = alert.violation_type.includes('RATE') || alert.violation_type.includes('WARN') 
              ? '#f59e0b' 
              : '#ef4444';
            
            return (
              <motion.g 
                key={alert.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 3 }}
                transition={{ duration: 0.5 }}
                transform={`translate(${center + x}, ${center + y})`}
              >
                {/* Pulsing Aura */}
                <motion.circle
                  r={12}
                  fill={color}
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 0, r: 24 }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
                {/* Core Blip */}
                <circle r={4} fill={color} />
                <text x={10} y={4} fill="#a1a1aa" fontSize={10} fontFamily="monospace">
                  {alert.agent_hex.substring(0, 6)}
                </text>
              </motion.g>
            );
          })}
        </AnimatePresence>
      </Svg>
    </RadarContainer>
  );
}
