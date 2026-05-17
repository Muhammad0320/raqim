import { create } from 'zustand';

export interface AegisAlert {
  id: string;
  timestamp: number;
  agent_hex: string;
  agent_alias: string;
  attempted_path: string;
  violation_type: string;
}

interface FirewallState {
  alerts: AegisAlert[];
  addAlert: (alert: Omit<AegisAlert, 'id' | 'timestamp'>) => void;
  removeAlert: (id: string) => void;
}

export const useFirewallStore = create<FirewallState>((set) => ({
  alerts: [],
  addAlert: (alertPayload) => {
    const id = Math.random().toString(36).substring(2, 9);
    const alert: AegisAlert = {
      ...alertPayload,
      id,
      timestamp: Date.now(),
    };
    
    set((state) => {
      // Manage ring buffer of 50 logs conceptually
      const newAlerts = [...state.alerts, alert];
      return { alerts: newAlerts.slice(-50) };
    });

    // Auto remove for Radar fading trail after 15s
    setTimeout(() => {
      set((s) => ({
        alerts: s.alerts.filter((a) => a.id !== id),
      }));
    }, 15000);
  },
  removeAlert: (id) => set((state) => ({ alerts: state.alerts.filter(a => a.id !== id) })),
}));

// Setup global Simulation/SSE hook logic here or in ClientLayout
if (typeof window !== 'undefined') {
  // Simulated event firing to verify radar visualization
  setInterval(() => {
    if (Math.random() > 0.7) {
      useFirewallStore.getState().addAlert({
        agent_hex: `0x${Math.floor(Math.random()*16777215).toString(16).toUpperCase()}`,
        agent_alias: `RogueAgent-${Math.floor(Math.random()*100)}`,
        attempted_path: `/v1/sys/core/mem_${Math.floor(Math.random()*1000)}`,
        violation_type: Math.random() > 0.5 ? 'CRITICAL_ACCESS_VIOLATION' : 'RATE_LIMIT_EXCEEDED'
      });
    }
  }, 3000);
}
