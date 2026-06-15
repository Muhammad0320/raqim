'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { liftQuarantine } from '../actions/admin';
import { useSwarmStore } from '../lib/store/useSwarmStore';

const PanelContainer = styled.div`
  background-color: #050505;
  border: 1px solid #ff003c;
  box-shadow: 0 0 20px rgba(255, 0, 60, 0.15);
  font-family: monospace;
  color: #ff003c;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

const PanelHeader = styled.div`
  background-color: #100507;
  border-bottom: 1px solid #ff003c;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  shrink-0: true;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #ff003c;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RefreshBtn = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 0, 60, 0.5);
  color: #ff003c;
  padding: 4px 8px;
  font-size: 9px;
  text-transform: uppercase;
  cursor: pointer;

  &:hover {
    background-color: rgba(255, 0, 60, 0.1);
    border-color: #ff003c;
  }
`;

const TableWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const GridHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1.5fr auto;
  padding: 10px 16px;
  background-color: #0a0103;
  border-bottom: 1px solid rgba(255, 0, 60, 0.3);
  font-size: 9px;
  color: rgba(255, 0, 60, 0.6);
  text-transform: uppercase;
  letter-spacing: 1.5px;
`;

const GridRow = styled(motion.div)`
  display: grid;
  grid-template-columns: 1fr 1fr 1.5fr auto;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 0, 60, 0.1);
  align-items: center;
  background-color: #020202;

  &:hover {
    background-color: rgba(255, 0, 60, 0.05);
  }
`;

const AgentHex = styled.span`
  color: #ffffff;
  font-size: 11px;
`;

const ViolationType = styled.span<{ $type: string }>`
  color: ${props => props.$type === 'CRYPTO_SPOOF' ? '#ff003c' : '#ffb300'};
  font-size: 10px;
  font-weight: bold;
`;

const PathText = styled.span`
  color: #a1a1aa;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ActionBtn = styled.button`
  background-color: transparent;
  border: 1px solid #ff003c;
  color: #ff003c;
  font-family: monospace;
  font-size: 9px;
  padding: 6px 12px;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.2s;

  &:hover {
    background-color: #ff003c;
    color: #000000;
    box-shadow: 0 0 10px rgba(255, 0, 60, 0.5);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  color: rgba(255, 0, 60, 0.4);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 2px;
  padding: 40px;
  text-align: center;
`;

// Toast Notification System
const ToastContainer = styled.div`
  position: fixed;
  bottom: 24px;
  left: 24px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: monospace;
`;

const ToastMessage = styled(motion.div)<{ $type: 'success' | 'error' }>`
  background-color: #050505;
  border: 1px solid ${props => props.$type === 'success' ? '#00f3ff' : '#ff003c'};
  color: ${props => props.$type === 'success' ? '#00f3ff' : '#ff003c'};
  box-shadow: 0 0 15px ${props => props.$type === 'success' ? 'rgba(0, 243, 255, 0.2)' : 'rgba(255, 0, 60, 0.2)'};
  padding: 12px 20px;
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 10px;
`;

interface QuarantineRecord {
  agent_hex: string;
  violation_type: string;
  attempted_path: string;
  payload_preview: string;
  timestamp: number;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

export function AegisPanel() {
  const [quarantined, setQuarantined] = useState<QuarantineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { quarantinedAgents, setQuarantinedAgents, liftQuarantine: liftStoreQuarantine } = useSwarmStore();

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const fetchQuarantineList = async () => {
    setLoading(true);
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('raqim_license='))?.split('=')[1] || '';
      const res = await fetch('http://127.0.0.1:8081/v1/aegis/quarantine_list', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });
      if (res.ok) {
        const data: QuarantineRecord[] = await res.json();
        setQuarantined(data);
        setQuarantinedAgents(data.map(d => d.agent_hex));
      }
    } catch (e) {
      console.error('Failed to load quarantine list', e);
      showToast('FAILED TO FETCH ACTIVE FIREWALL BLOCKS', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuarantineList();
    
    // Auto sync from state store (threat radar pushes live)
    const interval = setInterval(async () => {
      // Periodic check
      const token = document.cookie.split('; ').find(row => row.startsWith('raqim_license='))?.split('=')[1] || '';
      try {
        const res = await fetch('http://127.0.0.1:8081/v1/aegis/quarantine_list', {
          headers: { 'Authorization': `Bearer ${token}` },
          cache: 'no-store',
        });
        if (res.ok) {
          const data: QuarantineRecord[] = await res.json();
          setQuarantined(data);
        }
      } catch (e) {}
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleLift = async (agentHex: string) => {
    // 1. Optimistic UI updates
    const backup = [...quarantined];
    setQuarantined(prev => prev.filter(item => item.agent_hex !== agentHex));
    liftStoreQuarantine(agentHex);

    showToast(`DISPATCHING OVERRIDE KEY FOR ENCLAVE ${agentHex.slice(0, 8)}`, 'success');

    // 2. Perform server action
    try {
      const res = await liftQuarantine(agentHex);
      if (res.success) {
        showToast(`FIREWALL UNLOCKED: ENCLAVE ${agentHex} RESTORED`, 'success');
      } else {
        // Revert on failure
        setQuarantined(backup);
        setQuarantinedAgents(backup.map(b => b.agent_hex));
        showToast(`MUTATION REJECTED: ${res.error || 'UNAUTHORIZED'}`, 'error');
      }
    } catch (error: any) {
      setQuarantined(backup);
      setQuarantinedAgents(backup.map(b => b.agent_hex));
      showToast('NETWORK EXCEPTION: FAILED TO RESURRECT WASM CONTEXT', 'error');
    }
  };

  return (
    <>
      <PanelContainer>
        <PanelHeader>
          <Title>
            <span className="material-symbols-outlined text-[14px]">gshield</span>
            Aegis Threat Mitigation Core
          </Title>
          <RefreshBtn onClick={fetchQuarantineList}>Sync ACL</RefreshBtn>
        </PanelHeader>

        <TableWrapper>
          <GridHeader>
            <div>Agent Hex</div>
            <div>Violation</div>
            <div>Target Path</div>
            <div style={{ textAlign: 'right' }}>Lineage Firewall</div>
          </GridHeader>

          {loading && quarantined.length === 0 ? (
            <EmptyState>Scanning firewall enclaves...</EmptyState>
          ) : quarantined.length === 0 ? (
            <EmptyState>Zero Threat Incidents Logged. Aegis Nominal.</EmptyState>
          ) : (
            <AnimatePresence>
              {quarantined.map(record => (
                <GridRow
                  key={record.agent_hex}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.2 }}
                >
                  <AgentHex>{record.agent_hex}</AgentHex>
                  <div>
                    <ViolationType $type={record.violation_type}>
                      {record.violation_type}
                    </ViolationType>
                  </div>
                  <PathText title={record.attempted_path}>{record.attempted_path}</PathText>
                  <div style={{ textAlign: 'right' }}>
                    <ActionBtn onClick={() => handleLift(record.agent_hex)}>
                      Lift Quarantine
                    </ActionBtn>
                  </div>
                </GridRow>
              ))}
            </AnimatePresence>
          )}
        </TableWrapper>
      </PanelContainer>

      {/* Custom cyberpunk micro-toasts */}
      <ToastContainer>
        <AnimatePresence>
          {toasts.map(toast => (
            <ToastMessage
              key={toast.id}
              $type={toast.type}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <span className="material-symbols-outlined text-sm">
                {toast.type === 'success' ? 'check_circle' : 'warning'}
              </span>
              {toast.message}
            </ToastMessage>
          ))}
        </AnimatePresence>
      </ToastContainer>
    </>
  );
}
