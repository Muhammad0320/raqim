'use client';

import React from 'react';
import styled from 'styled-components';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import MemoryPhysics from '@/components/MemoryPhysics';
import NervousSystem from '@/components/NervousSystem';

const PageContainer = styled.main`
  min-height: 100vh;
  background-color: #000000;
  color: #ffffff;
  display: flex;
  flex-direction: column;
`;

const Footer = styled.footer`
  border-top: 1px solid rgba(39, 39, 42, 0.5); /* zinc-800 equivalent */
  padding: 48px 32px;
  text-align: center;
  color: #52525b; /* zinc-600 */
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.875rem;
  background-color: #000000;
`;

export default function Home() {
  return (
    <PageContainer>
      <Navbar />
      <Hero />
      <MemoryPhysics />
      <NervousSystem />
      <Footer>
        <p>&copy; {new Date().getFullYear()} Raqim Systems Inc. All rights reserved. Zero marketing fluff.</p>
      </Footer>
    </PageContainer>
  );
}
