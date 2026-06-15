'use client';

import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { triggerRealityFork } from '../actions/admin';
import { useSwarmStore } from '../lib/store/useSwarmStore';

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background-color: rgba(2, 2, 2, 0.9);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const ModalContainer = styled(motion.div)`
  background-color: #050505;
  border: 1px solid #00f3ff;
  box-shadow: 0 0 30px rgba(0, 243, 255, 0.25);
  width: 100%;
  max-width: 600px;
  font-family: monospace;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const Header = styled.div`
  background-color: #0c0c0e;
  border-bottom: 1px solid #1f1f23;
  padding: 14px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #00f3ff;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CloseBtn = styled.button`
  background: transparent;
  border: none;
  color: #71717a;
  cursor: pointer;
  font-family: monospace;
  font-size: 12px;
  
  &:hover {
    color: #ffffff;
  }
`;

const Body = styled.form`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FieldRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 9px;
  color: #71717a;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const Input = styled.input`
  background-color: #09090b;
  border: 1px solid #27272a;
  color: #ffffff;
  padding: 8px 12px;
  font-size: 12px;
  font-family: monospace;
  outline: none;

  &:focus {
    border-color: #00f3ff;
    box-shadow: 0 0 8px rgba(0, 243, 255, 0.15);
  }
`;

const EditorContainer = styled.div`
  border: 1px solid #27272a;
  height: 200px;
  background-color: #1e1e1e;
  overflow: hidden;
`;

const ErrorMsg = styled.div`
  font-size: 11px;
  color: #ff003c;
  background-color: rgba(255, 0, 60, 0.05);
  border: 1px solid rgba(255, 0, 60, 0.15);
  padding: 10px;
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
`;

const Button = styled.button<{ $variant?: 'primary' }>`
  background-color: ${props => props.$variant === 'primary' ? '#00f3ff' : 'transparent'};
  border: 1px solid ${props => props.$variant === 'primary' ? 'transparent' : '#27272a'};
  color: ${props => props.$variant === 'primary' ? '#000000' : '#a1a1aa'};
  padding: 8px 16px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: bold;
  font-family: monospace;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background-color: ${props => props.$variant === 'primary' ? '#00bccc' : '#1f1f23'};
    color: #ffffff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  background-color: rgba(2, 2, 2, 0.95);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 2px solid rgba(0, 243, 255, 0.1);
  border-top-color: #00f3ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const SuccessOverlay = styled.div`
  position: absolute;
  inset: 0;
  background-color: rgba(2, 2, 2, 0.95);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #00f3ff;
  text-align: center;
  padding: 40px;
`;

const ToggleButton = styled.button`
  position: absolute;
  bottom: 24px;
  right: 24px;
  background-color: #050505;
  color: #00f3ff;
  border: 1px solid #00f3ff;
  padding: 10px 20px;
  font-family: monospace;
  font-size: 11px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  cursor: pointer;
  z-index: 5;
  box-shadow: 0 4px 15px rgba(0, 243, 255, 0.15);
  transition: all 0.2s;

  &:hover {
    background-color: #00f3ff;
    color: #000000;
    box-shadow: 0 0 15px rgba(0, 243, 255, 0.4);
  }
`;

const initialJson = `{
  "override_seed": 42,
  "inject_network": "PHANTOM_MAIN",
  "env_overrides": {
    "DEBUG_MODE": "true"
  },
  "config_overrides": {
    "bypass_firewall": "true"
  }
}`;

export function TimeMachineModal() {
  const { activeTxId, thoughts, setIsForking } = useSwarmStore();
  const [isOpen, setIsOpen] = useState(false);
  const [agentId, setAgentId] = useState('');
  const [txId, setTxId] = useState<number | ''>('');
  const [forkConfigJson, setForkConfigJson] = useState(initialJson);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync with timeline selection when active thought changes
  useEffect(() => {
    if (isOpen && activeTxId) {
      const activeThought = thoughts[activeTxId];
      if (activeThought) {
        setAgentId(activeThought.agent_hex);
        setTxId(activeThought.tx_id);
      }
    }
  }, [activeTxId, isOpen, thoughts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentId || txId === '') return;

    setLoading(true);
    setError(null);

    let parsedConfig = {};
    try {
      if (forkConfigJson.trim()) {
        parsedConfig = JSON.parse(forkConfigJson);
      }
    } catch (err) {
      setError('INVALID FORK_CONFIG JSON STRUCTURE');
      setLoading(false);
      return;
    }

    try {
      const res = await triggerRealityFork(agentId, Number(txId), parsedConfig);
      if (res.success) {
        setSuccess(true);
        setIsForking(true);
        setTimeout(() => {
          setSuccess(false);
          setIsOpen(false);
        }, 2500);
      } else {
        setError(res.error || 'Failed to initialize temporal routing.');
      }
    } catch (err: any) {
      setError(err.message || 'Fatal temporal routing error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <ToggleButton onClick={() => setIsOpen(true)}>
          <span className="material-symbols-outlined align-middle mr-2 text-[14px]">alt_route</span>
          Time Machine Core
        </ToggleButton>
      )}

      <AnimatePresence>
        {isOpen && (
          <Overlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <ModalContainer
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', stiffness: 150, damping: 18 }}
            >
              <Header>
                <Title>
                  <span className="material-symbols-outlined text-[14px]">history</span>
                  Initialize Temporal Reality Fork
                </Title>
                <CloseBtn onClick={() => setIsOpen(false)}>[X]</CloseBtn>
              </Header>

              <Body onSubmit={handleSubmit}>
                <FieldRow>
                  <FieldGroup>
                    <Label>Target Agent Hex ID</Label>
                    <Input 
                      required
                      placeholder="e.g., f3e9a2..."
                      value={agentId}
                      onChange={e => setAgentId(e.target.value)}
                    />
                  </FieldGroup>
                  <FieldGroup>
                    <Label>Target Transaction ID</Label>
                    <Input 
                      required
                      type="number"
                      placeholder="e.g., 4050"
                      value={txId}
                      onChange={e => setTxId(e.target.value !== '' ? Number(e.target.value) : '')}
                    />
                  </FieldGroup>
                </FieldRow>

                <FieldGroup>
                  <Label>Fork Configuration (JSON)</Label>
                  <EditorContainer>
                    <Editor
                      height="100%"
                      defaultLanguage="json"
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 11,
                        fontFamily: 'monospace',
                        lineNumbers: 'off',
                        scrollBeyondLastLine: false,
                        padding: { top: 10 }
                      }}
                      value={forkConfigJson}
                      onChange={value => setForkConfigJson(value || '')}
                    />
                  </EditorContainer>
                </FieldGroup>

                {error && <ErrorMsg>{error}</ErrorMsg>}

                <Footer>
                  <Button type="button" onClick={() => setIsOpen(false)} disabled={loading}>
                    Abort
                  </Button>
                  <Button type="submit" $variant="primary" disabled={loading || !agentId || txId === ''}>
                    Execute Reality Fork
                  </Button>
                </Footer>
              </Body>

              {/* Loading State Overlay */}
              <AnimatePresence>
                {loading && (
                  <LoadingOverlay
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Spinner />
                    <div className="font-mono text-xs text-[#00f3ff] tracking-widest" style={{ animation: `${pulse} 1.5s infinite` }}>
                      [ REBUILDING WASI CONTEXT... ]
                    </div>
                  </LoadingOverlay>
                )}
              </AnimatePresence>

              {/* Success Confirmation State Overlay */}
              <AnimatePresence>
                {success && (
                  <SuccessOverlay
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <span className="material-symbols-outlined text-[36px] animate-bounce">check_circle</span>
                    <div className="font-mono text-sm uppercase tracking-widest font-bold">
                      Reality Fork Initialized Successfully
                    </div>
                    <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
                      Diverging stream redirected to Phantom Timeline
                    </div>
                  </SuccessOverlay>
                )}
              </AnimatePresence>
            </ModalContainer>
          </Overlay>
        )}
      </AnimatePresence>
    </>
  );
}
