'use client';
import { useSwarmStore } from '../../lib/store/useSwarmStore';
import { SkipBack, SkipForward, Play } from 'lucide-react';

export function NLEScrubber() {
  const { thoughtOrder, activeTxId, setActiveTxId } = useSwarmStore();

  const total = thoughtOrder.length;
  // If activeTxId is null, we are at the "Live" edge (100%)
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
    ? "0x" + activeTxId.toString().padStart(8, '0')
    : 'LIVE';

  return (
    <div className="w-full bg-surface border-t border-white/5 px-8 py-4 flex flex-col gap-3 shrink-0">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-[11px] font-semibold tracking-widest text-muted-DEFAULT">
          <SkipBack size={14} />
          <span>TEMPORAL NAVIGATION</span>
        </div>
        <div className="text-xs text-muted-DEFAULT">
          CURRENT TX: <span className="font-mono text-neon-cyan drop-shadow-[0_0_8px_rgba(102,252,241,0.6)] ml-2">{displayId}</span>
        </div>
        <div className="flex gap-2">
          <button className="w-8 h-8 flex items-center justify-center bg-panel border border-white/5 text-white rounded hover:bg-white/5 hover:text-neon-cyan transition-colors">
             <SkipBack size={16} />
          </button>
          <button className="w-8 h-8 flex items-center justify-center bg-panel border border-white/5 text-white rounded hover:bg-white/5 hover:text-neon-cyan transition-colors" onClick={jumpToLive}>
             <Play size={16} />
          </button>
          <button className="w-8 h-8 flex items-center justify-center bg-panel border border-white/5 text-white rounded hover:bg-white/5 hover:text-neon-cyan transition-colors">
             <SkipForward size={16} />
          </button>
        </div>
      </div>

      <div className="relative h-6 flex items-center w-full">
        {/* Track Fill */}
        <div 
          className="absolute left-0 h-1 bg-neon-cyan shadow-[0_0_10px_rgba(102,252,241,0.4)] pointer-events-none rounded-l-full"
          style={{ width: `${progressPercent}%` }} 
        />
        {/* Invisible range for dragging logic but custom styled thumb */}
        <input 
          type="range" 
          min="0" 
          max={total > 0 ? total - 1 : 0} 
          value={currentIndex >= 0 ? currentIndex : 0}
          onChange={handleScrub}
          className="absolute w-full h-1 bg-white/10 outline-none z-10 appearance-none rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-neon-cyan [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(102,252,241,0.8)] [&::-webkit-slider-thumb]:cursor-pointer"
        />
        
        <div className="absolute top-6 w-full flex justify-between text-[10px] text-muted-DEFAULT tracking-wider">
           <span>Genesis (0x0000)</span>
           <span>Future Extrapolation</span>
        </div>
      </div>
    </div>
  );
}
