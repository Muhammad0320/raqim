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
    <div className="h-28 bg-surface-container-highest shrink-0 flex flex-col px-8 py-4 justify-center relative z-20 shadow-[0_-20px_40px_rgba(0,0,0,0.4)]">
      <div className="flex justify-between items-end mb-3">
        <h3 className="text-xs font-label uppercase tracking-[0.05rem] text-on-surface-variant flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">history</span> Temporal Navigation
        </h3>
        <div className="font-mono text-sm text-white flex items-center gap-3">
          <span className="text-on-surface-variant">CURRENT TX:</span> {displayId}
          <div className="flex gap-1 ml-4">
            <button className="bg-surface-container hover:bg-surface-container-low text-on-surface p-1 rounded transition-colors"><span className="material-symbols-outlined text-sm">skip_previous</span></button>
            <button onClick={jumpToLive} className="bg-surface-container hover:bg-surface-container-low text-on-surface p-1 rounded transition-colors"><span className="material-symbols-outlined text-sm">play_arrow</span></button>
            <button className="bg-surface-container hover:bg-surface-container-low text-on-surface p-1 rounded transition-colors"><span className="material-symbols-outlined text-sm">skip_next</span></button>
          </div>
        </div>
      </div>
      
      <div className="relative w-full py-2">
        <div className="absolute w-full h-full flex justify-between px-1 pointer-events-none top-0 pt-3">
          {Array.from({ length: 10 }).map((_, i) => (
             <div key={i} className={`w-[1px] ${i === Math.floor(progressPercent / 10) ? 'h-3 bg-primary-container/50' : 'h-2 bg-outline-variant/30'}`}></div>
          ))}
        </div>
        
        {/* Custom slider using standard input range mapped to css variables in globals.css */}
        <input 
          className="w-full relative z-10" 
          type="range" 
          min="0" 
          max={total > 0 ? total - 1 : 0} 
          value={currentIndex >= 0 ? currentIndex : 0}
          onChange={handleScrub}
        />
        
        <div className="flex justify-between mt-2 font-mono text-[9px] text-on-surface-variant opacity-50">
          <span>Genesis (0x0000)</span>
          <span>Future Extrapolation</span>
        </div>
      </div>
    </div>
  );
}
