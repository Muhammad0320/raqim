import React, { useState } from 'react';
import styled from 'styled-components';
import { resurrectAgent } from '../../actions/firewall';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const ModalContainer = styled.div`
  background-color: #09090b;
  border: 1px solid #ef4444;
  box-shadow: 0 0 24px rgba(239, 68, 68, 0.2);
  width: 100%;
  max-width: 500px;
  font-family: monospace;
  color: #ffffff;
`;

const Header = styled.div`
  background-color: #18181b;
  border-bottom: 1px solid #27272a;
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
  color: #ef4444;
  font-weight: bold;
`;

const CloseBtn = styled.button`
  background: transparent;
  border: none;
  color: #a1a1aa;
  cursor: pointer;
  font-family: monospace;
  font-size: 14px;
  
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

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 10px;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const ReadOnlyInput = styled.div`
  background-color: #18181b;
  border: 1px solid #27272a;
  color: #ef4444;
  padding: 10px;
  font-size: 12px;
  word-break: break-all;
`;

const TextArea = styled.textarea`
  background-color: #000000;
  border: 1px solid #27272a;
  color: #ffffff;
  padding: 10px;
  font-size: 12px;
  font-family: monospace;
  resize: vertical;
  min-height: 120px;
  outline: none;

  &:focus {
    border-color: #ef4444;
  }
`;

const ErrorMsg = styled.div`
  font-size: 11px;
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 10px;
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
`;

const Button = styled.button<{ $variant?: 'primary' }>`
  background-color: ${props => props.$variant === 'primary' ? '#ef4444' : 'transparent'};
  border: 1px solid ${props => props.$variant === 'primary' ? 'transparent' : '#52525b'};
  color: ${props => props.$variant === 'primary' ? '#000000' : '#ffffff'};
  padding: 8px 16px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: bold;
  font-family: monospace;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.$variant === 'primary' ? '#dc2626' : '#27272a'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface ReseedModalProps {
  agentHex: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReseedModal({ agentHex, onClose, onSuccess }: ReseedModalProps) {
  const [overrideText, setOverrideText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideText.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await resurrectAgent(agentHex, overrideText);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.error || 'Failed to reseed agent.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Overlay onClick={onClose}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <Header>
          <Title>Reality Reseeding / Out-of-Band Eviction</Title>
          <CloseBtn onClick={onClose}>[X]</CloseBtn>
        </Header>
        <Body onSubmit={handleSubmit}>
          <FieldGroup>
            <Label>Target Agent Hex</Label>
            <ReadOnlyInput>{agentHex}</ReadOnlyInput>
          </FieldGroup>
          <FieldGroup>
            <Label>System Prompt Override</Label>
            <TextArea 
              required
              value={overrideText}
              onChange={e => setOverrideText(e.target.value)}
              placeholder="Inject new system prompt to overwrite corrupted agent memory..."
              disabled={loading}
            />
          </FieldGroup>
          {error && <ErrorMsg>{error}</ErrorMsg>}
          <Footer>
            <Button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" $variant="primary" disabled={loading || !overrideText.trim()}>
              {loading ? '[ REBOOTING... ]' : '[ RE-SEED DAEMON ]'}
            </Button>
          </Footer>
        </Body>
      </ModalContainer>
    </Overlay>
  );
}
