import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const RibbonContainer = styled.div`
  height: 120px;
  width: 100%;
  background: #09090b;
  border-bottom: 1px solid #27272a;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
`;

const Title = styled.div`
  font-size: 10px;
  color: #a1a1aa;
  text-transform: uppercase;
  margin-bottom: 16px;
  letter-spacing: 1px;
`;

const Axis = styled.div`
  position: relative;
  height: 2px;
  width: 100%;
  background: #27272a;
  display: flex;
  align-items: center;
`;

const Tick = styled.div<{ $pct: number }>`
  position: absolute;
  left: ${p => p.$pct}%;
  top: 8px;
  font-size: 10px;
  color: #52525b;
  font-family: monospace;
  transform: translateX(-50%);
`;

const Dot = styled(motion.div)<{ $source: string, $pct: number }>`
  position: absolute;
  left: ${p => p.$pct}%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${p => p.$source === 'HOT_WAL' ? '#ffb300' : '#06b6d4'};
  box-shadow: 0 0 10px ${p => p.$source === 'HOT_WAL' ? 'rgba(255, 179, 0, 0.6)' : 'rgba(6, 182, 212, 0.6)'};
  top: 50%;
`;

export default function DistributionRibbon({ results }: { results: any[] }) {
  return (
    <RibbonContainer>
      <Title>Similarity Distribution Ribbon [0.0 - 1.0]</Title>
      <Axis>
        {[0, 0.25, 0.5, 0.75, 1.0].map(val => (
          <Tick key={val} $pct={val * 100}>{val.toFixed(2)}</Tick>
        ))}
        {results.map((res) => (
          <Dot
            key={res.id}
            $source={res.source}
            $pct={res.similarity_score * 100}
            initial={{ opacity: 0, scale: 0, y: '-50%', x: '-50%' }}
            animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          />
        ))}
      </Axis>
    </RibbonContainer>
  );
}
