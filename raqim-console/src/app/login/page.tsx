'use client';

import React from 'react';
import styled, { keyframes } from 'styled-components';
import { authenticateConsole, bootOpenCore } from './actions';

const PageContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #09090b;
  color: #ffffff;
  font-family: 'JetBrains Mono', 'Space Mono', monospace;
  padding: 1rem;
`;

const glowPulse = keyframes`
  0% { box-shadow: 0 0 10px rgba(255, 255, 255, 0.05), inset 0 0 10px rgba(255, 255, 255, 0.02); }
  50% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.1), inset 0 0 15px rgba(255, 255, 255, 0.05); }
  100% { box-shadow: 0 0 10px rgba(255, 255, 255, 0.05), inset 0 0 10px rgba(255, 255, 255, 0.02); }
`;

const LoginContainer = styled.div`
  width: 100%;
  max-width: 480px;
  padding: 3rem;
  background-color: #09090b;
  border: 1px solid rgba(255, 255, 255, 0.15);
  animation: ${glowPulse} 4s ease-in-out infinite;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 2px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
  }
`;

const LogoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const LogoText = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.05em;
  margin: 0;
  color: #ffffff;
  
  span {
    color: rgba(255, 255, 255, 0.4);
    font-weight: 400;
    margin-left: 0.5rem;
  }
`;

const SystemStatus = styled.div`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &::before {
    content: '';
    display: block;
    width: 6px;
    height: 6px;
    background-color: #ffffff;
    border-radius: 50%;
    box-shadow: 0 0 8px #ffffff;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Label = styled.label`
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.6);
`;

const Input = styled.input`
  width: 100%;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-family: inherit;
  font-size: 0.875rem;
  padding: 1rem;
  outline: none;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: #ffffff;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.1);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.2);
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
`;

const PrimaryButton = styled.button`
  width: 100%;
  background: #ffffff;
  color: #09090b;
  border: none;
  padding: 1rem;
  font-family: inherit;
  font-weight: 700;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
  }
  
  &:active {
    transform: translateY(1px);
  }
`;

const SecondaryButton = styled.button`
  width: 100%;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  border: 1px solid transparent;
  padding: 0.75rem;
  font-family: inherit;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: #ffffff;
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.02);
  }
`;

export default function LoginPage() {
  return (
    <PageContainer>
      <LoginContainer>
        <LogoWrapper>
          <LogoText>
            raqim_os <span>// console</span>
          </LogoText>
          <SystemStatus>Aegis Terminal Active</SystemStatus>
        </LogoWrapper>
        
        <Form action={authenticateConsole}>
          <InputGroup>
            <Label htmlFor="license_key">Enterprise License Key (JWT)</Label>
            <Input 
              id="license_key" 
              name="license_key" 
              type="text" 
              placeholder="eyJhbGciOiJIUzI1NiIsInR5c..." 
              autoComplete="off"
              spellCheck="false"
            />
          </InputGroup>
          
          <ButtonContainer>
            <PrimaryButton type="submit">
              [ Authenticate Console ]
            </PrimaryButton>
          </ButtonContainer>
        </Form>
        
        <form action={bootOpenCore}>
          <SecondaryButton type="submit">
            [ Boot Open Core (Local LAN) ]
          </SecondaryButton>
        </form>
      </LoginContainer>
    </PageContainer>
  );
}
