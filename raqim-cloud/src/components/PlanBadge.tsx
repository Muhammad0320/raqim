import React from 'react';

type Tier = 'OPEN CORE' | 'STARTUP' | 'ENTERPRISE';

export function PlanBadge({ tier }: { tier: Tier }) {
  const baseClasses = "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase border";
  
  const styles = {
    'OPEN CORE': "bg-zinc-900 border-zinc-800 text-zinc-400",
    'STARTUP': "bg-zinc-900 border-zinc-700 text-zinc-200",
    'ENTERPRISE': "bg-zinc-950 border-cyan-900/50 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
  };

  return (
    <span className={`${baseClasses} ${styles[tier]}`}>
      {tier}
    </span>
  );
}
