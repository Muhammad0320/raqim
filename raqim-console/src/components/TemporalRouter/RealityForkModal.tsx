'use client';

import React, { useState, useTransition, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import Editor from '@monaco-editor/react';
import { useSwarmStore } from '../../lib/store/useSwarmStore';
import { executeTimeTravel } from '../../actions/admin';

const DrawerContainer = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 0;
  right: 0;
  width: 380px;
  height: 100%;
  background-color: #050505;
  border-left: 1px solid #27272a;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  z-index: 50;
  transform: translateX(${props => props.$isOpen ? '0' : '100%'});
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  box-sizing: border-box;
  font-family: monospace;
`;

const Header = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #27272a;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #0c0c0e;
`;

const Title = styled.h2`
  font-size: 11px;
  color: #ffffff;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: bold;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #71717a;
  font-family: monospace;
  cursor: pointer;
  font-size: 12px;
  
  &:hover {
    color: #ffffff;
  }
`;

const Content = styled.div`
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
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
  display: block;
`;

const ReadOnlyInput = styled.div`
  background-color: #0c0c0e;
  border: 1px solid #27272a;
  color: #a1a1aa;
  padding: 10px;
  font-size: 12px;
  word-break: break-all;
`;

const EditorWrapper = styled.div`
  border: 1px solid #27272a;
  height: 220px;
  background-color: #1e1e1e;
  overflow: hidden;
`;

const ErrorMsg = styled.div`
  font-size: 10px;
  color: #ff003c;
  background-color: rgba(255, 0, 60, 0.05);
  border: 1px solid rgba(255, 0, 60, 0.15);
  padding: 8px 12px;
  text-transform: uppercase;
`;

const flash = keyframes`
  0%, 100% { opacity: 1; color: #ffb300; background-color: rgba(255, 179, 0, 0.15); border-color: #ffb300; }
  50% { opacity: 0.4; color: #ffffff; background-color: #09090b; border-color: #27272a; }
`;

const ExecuteButton = styled.button<{ $isLoading: boolean }>`
  width: 100%;
  padding: 14px;
  background-color: #ffffff;
  color: #000000;
  border: 1px solid transparent;
  border-radius: 2px;
  font-family: monospace;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: auto;

  &:hover:not(:disabled) {
    background-color: #e4e4e7;
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
  }

  &:disabled {
    cursor: not-allowed;
  }

  ${props => props.$isLoading && css`
    animation: ${flash} 0.8s infinite;
    pointer-events: none;
  `}
`;

const ToggleDrawerButton = styled.button`
  position: absolute;
  bottom: 24px;
  right: 24px;
  background-color: #050505;
  color: #ffffff;
  border: 1px solid #27272a;
  padding: 10px 20px;
  font-family: monospace;
  font-size: 11px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  cursor: pointer;
  z-index: 45;
  box-shadow: 0 4px 15px rgba(0,0,0,0.6);
  transition: all 0.2s;

  &:hover {
    background-color: #ffffff;
    color: #000000;
    border-color: #ffffff;
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
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

export function RealityForkModal() {
  const { activeTxId, thoughts, setIsForking } = useSwarmStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [forkConfigJson, setForkConfigJson] = useState(initialJson);
  const [error, setError] = useState<string | null>(null);

  const activeThought = activeTxId ? thoughts[activeTxId] : null;

  const handleExecute = () => {
    if (!activeThought) return;
    setError(null);

    let parsedConfig = {};
    try {
      if (forkConfigJson.trim()) {
        parsedConfig = JSON.parse(forkConfigJson);
      }
    } catch (err) {
      setError('INVALID CONFIG JSON STRUCTURE');
      return;
    }

    startTransition(async () => {
      try {
        const res = await executeTimeTravel({
          agent_hex: activeThought.agent_hex,
          target_tx_id: activeThought.tx_id,
          fork_config: parsedConfig,
        });
        
        if (res.success) {
          setIsForking(true);
          setIsOpen(false);
        } else {
          setError(res.error || 'TEMPORAL ROUTER REJECTED FORK');
        }
      } catch (err: any) {
        console.error("Fork failed", err);
        setError(err.message || 'FATAL ROUTING EXCEPTION');
      }
    });
  };

  return (
    <>
      {!isOpen && (
        <ToggleDrawerButton onClick={() => setIsOpen(true)}>
          <span className="material-symbols-outlined align-middle mr-2 text-[14px]">alt_route</span>
          Configure Reality Fork
        </ToggleDrawerButton>
      )}

      <DrawerContainer $isOpen={isOpen}>
        <Header>
          <Title>Reality Fork Deck</Title>
          <CloseButton onClick={() => setIsOpen(false)}>[X]</CloseButton>
        </Header>

        <Content>
          <FieldGroup>
            <Label>Target Transaction Anchor</Label>
            <ReadOnlyInput>
              {activeThought ? `TX_${activeThought.tx_id} (${activeThought.status})` : 'AWAITING SELECTION'}
            </ReadOnlyInput>
          </FieldGroup>

          <FieldGroup>
            <Label>Target Agent Enclave ID</Label>
            <ReadOnlyInput>
              {activeThought ? activeThought.agent_hex : 'AWAITING SELECTION'}
            </ReadOnlyInput>
          </FieldGroup>

          <FieldGroup>
            <Label>Network Injection Payload (JSON)</Label>
            <EditorWrapper>
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
            </EditorWrapper>
          </FieldGroup>

          {error && <ErrorMsg>{error}</ErrorMsg>}

          <ExecuteButton 
            $isLoading={isPending} 
            onClick={handleExecute}
            disabled={!activeThought || isPending}
          >
            {isPending ? '[ REBUILDING WASI CONTEXT... ]' : 'Execute Fork (XOR)'}
          </ExecuteButton>
        </Content>
      </DrawerContainer>
    </>
  );
}
