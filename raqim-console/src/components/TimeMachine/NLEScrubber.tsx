'use client';
import { useSwarmStore } from '../../lib/store/useSwarmStore';

export function NLEScrubber() {
  const { thoughtOrder, activeTxId, setActiveTxId } = useSwarmStore();

  const total = thoughtOrder.length;
  const currentIndex = activeTxId ? thoughtOrder.indexOf(activeTxId) : total - 1;
  const progressPercent = total <= 1 ? 100 : (currentIndex / (total - 1)) * 100;

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (val >= total - 1) {
      setActiveTxId(null); 
    } else {
      setActiveTxId(thoughtOrder[val]);
    }
  };

  const jumpToLive = () => setActiveTxId(null);

  const displayId = activeTxId 
    ? "0x" + activeTxId.toString().padStart(8, '0').toUpperCase()
    : 'LIVE EDGE';

  return (
    <div className="h-32 bg-surface-container-highest shrink-0 flex flex-col px-8 py-5 justify-center relative z-20 shadow-[0_-20px_40px_rgba(0,0,0,0.6)] border-t border-outline-variant/10">
      <div className="flex justify-between items-end mb-4">
        <h3 className="text-xs font-label uppercase tracking-[0.05rem] text-on-surface-variant flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-secondary">history</span> Temporal Navigation
        </h3>
        <div className="font-mono text-sm text-white flex items-center gap-3">
          <span className="text-on-surface-variant">CURRENT TX:</span> 
          <span className="bg-surface-container-low px-3 py-1 rounded text-primary-fixed-dim border border-outline-variant/15 font-bold shadow-inner">
            {displayId}
          </span>
          <div className="flex gap-2 ml-4">
            <button className="bg-surface-container-low hover:bg-surface-container hover:text-white text-on-surface-variant p-1.5 rounded transition-colors border border-outline-variant/10"><span className="material-symbols-outlined text-sm">skip_previous</span></button>
            <button onClick={jumpToLive} className="bg-primary-container/20 text-primary-fixed-dim hover:bg-primary-container/40 p-1.5 rounded transition-colors border border-primary-container/50"><span className="material-symbols-outlined text-sm">play_arrow</span></button>
            <button className="bg-surface-container-low hover:bg-surface-container hover:text-white text-on-surface-variant p-1.5 rounded transition-colors border border-outline-variant/10"><span className="material-symbols-outlined text-sm">skip_next</span></button>
          </div>
        </div>
      </div>
      
      <div className="relative w-full h-8 mt-1 group">
        {/* Background density graph track */}
        <div className="absolute inset-0 flex items-end gap-[2px] opacity-40 px-1 pointer-events-none">
          {Array.from({ length: 60 }).map((_, i) => {
            const isActive = (i / 60) * 100 <= progressPercent;
            const height = 20 + Math.sin(i * 0.5) * 15 + Math.cos(i * 2.1) * 10;
            return (
              <div 
                key={i} 
                className={`flex-1 rounded-t-sm transition-colors duration-300 ${isActive ? 'bg-secondary' : 'bg-outline-variant'}`}
                style={{ height: `${Math.max(10, height)}%` }}
              ></div>
            );
          })}
        </div>
        
        {/* The glowing track fill behind the thumb */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-secondary/30 pointer-events-none" 
          style={{ width: `${progressPercent}%` }}
        ></div>

        {/* The invisible slider that provides the native interaction but uses our custom thumb */}
        <input 
          className="industrial-slider" 
          type="range" 
          min="0" 
          max={total > 0 ? total - 1 : 0} 
          value={currentIndex >= 0 ? currentIndex : 0}
          onChange={handleScrub}
        />
      </div>
      
      <div className="flex justify-between mt-3 font-mono text-[10px] text-on-surface-variant opacity-70 uppercase tracking-widest font-bold">
        <span>Genesis (0x0000)</span>
        <span className="flex items-center gap-1 text-secondary"><span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse"></span> Live Edge</span>
      </div>
    </div>
  );
}
