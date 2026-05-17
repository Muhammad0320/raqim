'use client';

import React, { useTransition } from 'react';
import styled from 'styled-components';
import { resurrectAgent } from '../../app/firewall/actions';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
`;

const ModalBox = styled.div`
  background: #09090b;
  border: 1px solid #ef4444;
  width: 500px;
  padding: 24px;
  box-shadow: 0 0 30px rgba(239, 68, 68, 0.1);
`;

const Header = styled.h2`
  color: #ef4444;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 24px;
  border-bottom: 1px solid #27272a;
  padding-bottom: 12px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Label = styled.label`
  font-size: 10px;
  color: #a1a1aa;
  text-transform: uppercase;
`;

const ReadOnlyInput = styled.input`
  background: #18181b;
  border: 1px solid #27272a;
  color: #ef4444;
  padding: 8px 12px;
  font-family: monospace;
  outline: none;
`;

const TextArea = styled.textarea`
  background: #000;
  border: 1px solid #27272a;
  color: #fff;
  padding: 12px;
  font-family: monospace;
  font-size: 12px;
  height: 120px;
  resize: none;
  &:focus {
    border-color: #ef4444;
    outline: none;
  }
`;

const ActionRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
`;

const Btn = styled.button<{ $variant?: 'primary' }>`
  background: ${p => p.$variant === 'primary' ? '#ef4444' : 'transparent'};
  color: ${p => p.$variant === 'primary' ? '#fff' : '#a1a1aa'};
  border: 1px solid ${p => p.$variant === 'primary' ? '#ef4444' : '#27272a'};
  padding: 8px 16px;
  font-size: 12px;
  text-transform: uppercase;
  cursor: pointer;
  &:hover {
    background: ${p => p.$variant === 'primary' ? '#dc2626' : '#18181b'};
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default function ReseedModal({ agentHex, onClose }: { agentHex: string, onClose: () => void }) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await resurrectAgent(formData);
      onClose();
    });
  };

  return (
    <Overlay>
      <ModalBox>
        <Header>Reality Reseeding / Out-of-Band Eviction</Header>
        <Form onSubmit={handleSubmit}>
          <div>
            <Label>Agent Identity (Hex)</Label>
            <ReadOnlyInput type="text" name="agent_hex" value={agentHex} readOnly />
          </div>
          <div>
            <Label>System Prompt Override</Label>
            <TextArea 
              name="system_prompt_override" 
              placeholder="Inject new system prompt to overwrite corrupted agent memory..."
              required
            />
          </div>
          <ActionRow>
            <Btn type="button" onClick={onClose} disabled={isPending}>Cancel</Btn>
            <Btn type="submit" $variant="primary" disabled={isPending}>
              {isPending ? 'EXECUTING WASM REBOOT...' : 'Execute Eviction'}
            </Btn>
          </ActionRow>
        </Form>
      </ModalBox>
    </Overlay>
  );
}
