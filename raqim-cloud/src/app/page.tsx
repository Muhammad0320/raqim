'use client';

import React from 'react';
import styled from 'styled-components';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import MemoryPhysics from '@/components/MemoryPhysics';
import NervousSystem from '@/components/NervousSystem';
import TemporalRouter from '@/components/TemporalRouter';
import AegisGatekeeper from '@/components/AegisGatekeeper';
import SovereignDeployment from '@/components/SovereignDeployment';
import Footer from '@/components/Footer';

const PageContainer = styled.main`
  min-height: 100vh;
  background-color: #000000;
  color: #ffffff;
  display: flex;
  flex-direction: column;
`;

export default function Home() {
  return (
    <PageContainer>
      <Navbar />
      <Hero />
      <MemoryPhysics />
      <NervousSystem />
      <TemporalRouter />
      <AegisGatekeeper />
      <SovereignDeployment />
      <Footer />
    </PageContainer>
  );
}
