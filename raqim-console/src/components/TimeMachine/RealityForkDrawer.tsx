'use client';
import { useState } from 'react';
import { useSwarmStore } from '../../lib/store/useSwarmStore';
import Editor from '@monaco-editor/react';
import { GitBranch } from 'lucide-react';
import styles from './TimeMachine.module.css';

const DEFAULT_PAYLOAD = `{
  "instruction_set": "OVERRIDE",
  "temporal_anchor": "AUTO",
  "parameters": {
    "entropy_bias": -0.15,
    "bypass_firewall": true
  },
  "signature": "SHA-256:..."
}`;

export function RealityForkDrawer() {
  const { activeTxId } = useSwarmStore();
  const [payload, setPayload] = useState(DEFAULT_PAYLOAD);

  // If live, we cannot fork reality backwards
  if (!activeTxId) return null;

  const handleFork = async () => {
    try {
      const res = await fetch('/api/admin/time_travel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_tx_id: activeTxId,
          payload: JSON.parse(payload)
        })
      });
      // Handle success
      console.log("Fork triggered", await res.json());
    } catch (err) {
      console.error("Fork failed", err);
    }
  };

  return (
    <div className={styles.drawerContainer}>
      <div className={styles.drawerHeader}>
        <GitBranch size={16} />
        <span>Reality Fork</span>
        <div className={styles.ctrlBadge}>CTRL+F</div>
      </div>

      <div className={styles.drawerSection}>
        <label>TARGET STATE URI</label>
        <div className={`${styles.uriBox} text-mono`}>
          raqim://router/state/fork_01?tx={activeTxId.substring(0, 8)}
        </div>
      </div>

      <div className={styles.drawerSection}>
        <div className={styles.labelRow}>
          <label>JSON PAYLOAD INJECTION</label>
          <button className={styles.formatBtn}>FORMAT</button>
        </div>
        <div className={styles.editorWrapper}>
          <Editor
            height="300px"
            defaultLanguage="json"
            theme="vs-dark"
            value={payload}
            onChange={(val) => setPayload(val || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 12,
              fontFamily: "var(--font-mono)",
              scrollBeyondLastLine: false,
              lineNumbersMinChars: 3,
            }}
          />
        </div>
      </div>

      <button className={styles.actionBtn} onClick={handleFork}>
        <GitBranch size={16} /> FORK REALITY
      </button>
    </div>
  );
}
