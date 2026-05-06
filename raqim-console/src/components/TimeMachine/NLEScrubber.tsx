'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSwarmStore } from '../../lib/store/useSwarmStore';

export function NLEScrubber() {
  const { thoughtOrder, activeTxId, setActiveTxId } = useSwarmStore();
  const [isPlaying, setIsPlaying] = useState(true);

  // If we have no thoughts, just show empty track
  const maxIdx = Math.max(0, thoughtOrder.length - 1);
  const activeIdx = activeTxId ? thoughtOrder.indexOf(activeTxId) : maxIdx;
  
  // Format current TX for display
  const currentTxDisplay = useMemo(() => {
    if (thoughtOrder.length === 0) return 'WAITING...';
    const tx = activeTxId || thoughtOrder[maxIdx];
    return '0x' + tx.toString().padStart(8, '0').toUpperCase();
  }, [activeTxId, thoughtOrder, maxIdx]);
   
  // Handle slider changes natively
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIdx = parseInt(e.target.value, 10);
    if (newIdx === maxIdx) {
      setActiveTxId(null);
      setIsPlaying(true);
    } else {
      setActiveTxId(thoughtOrder[newIdx]);
      setIsPlaying(false);
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      // Pause at current position
      setActiveTxId(thoughtOrder[maxIdx]);
      setIsPlaying(false);
    } else {
      // Resume live stream
      setActiveTxId(null);
      setIsPlaying(true);
    }
  };

  const goPrevious = () => {
    if (activeIdx > 0) {
      setActiveTxId(thoughtOrder[activeIdx - 1]);
      setIsPlaying(false);
    }
  };

  const goNext = () => {
    if (activeIdx < maxIdx) {
      const nextIdx = activeIdx + 1;
      if (nextIdx === maxIdx) {
        setActiveTxId(null);
        setIsPlaying(true);
      } else {
        setActiveTxId(thoughtOrder[nextIdx]);
      }
    }
  };

  return (
    <div className="h-28 bg-surface-container-highest shrink-0 flex flex-col px-8 py-4 justify-center relative z-20 shadow-[0_-20px_40px_rgba(0,0,0,0.4)]">
      <div className="flex justify-between items-end mb-3">
        <h3 className="text-xs font-label uppercase tracking-[0.05rem] text-on-surface-variant flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">history</span> Temporal Navigation
        </h3>
        <div className="font-mono text-sm text-white flex items-center gap-3">
          <span className="text-on-surface-variant">CURRENT TX:</span> {currentTxDisplay}
          <div className="flex gap-1 ml-4">
            <button onClick={goPrevious} className="bg-surface-container hover:bg-surface-container-low text-on-surface p-1 rounded transition-colors">
              <span className="material-symbols-outlined text-sm">skip_previous</span>
            </button>
            <button onClick={handlePlayPause} className="bg-surface-container hover:bg-surface-container-low text-on-surface p-1 rounded transition-colors w-8 flex justify-center">
              <span className="material-symbols-outlined text-sm">{isPlaying ? 'pause' : 'play_arrow'}</span>
            </button>
            <button onClick={goNext} className="bg-surface-container hover:bg-surface-container-low text-on-surface p-1 rounded transition-colors">
              <span className="material-symbols-outlined text-sm">skip_next</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="relative w-full py-2">
        {/* Timeline markers (Decorative) */}
        <div className="absolute w-full h-full flex justify-between px-1 pointer-events-none top-0 pt-3">
          <div className="w-[1px] h-2 bg-outline-variant/30"></div>
          <div className="w-[1px] h-2 bg-outline-variant/30"></div>
          <div className="w-[1px] h-2 bg-outline-variant/30"></div>
          <div className="w-[1px] h-2 bg-outline-variant/30"></div>
          <div className="w-[1px] h-3 bg-primary-container/50"></div>
          <div className="w-[1px] h-2 bg-outline-variant/30"></div>
          <div className="w-[1px] h-2 bg-outline-variant/30"></div>
          <div className="w-[1px] h-2 bg-outline-variant/30"></div>
          <div className="w-[1px] h-2 bg-outline-variant/30"></div>
          <div className="w-[1px] h-2 bg-outline-variant/30"></div>
        </div>
        
        <input 
          className="w-full relative z-10 native-range-scrubber" 
          max={maxIdx} 
          min={0} 
          type="range" 
          value={activeIdx}
          onChange={handleSliderChange}
        />
        
        <div className="flex justify-between mt-2 font-mono text-[9px] text-on-surface-variant opacity-50">
          <span>Genesis (0x0000)</span>
          <span>{thoughtOrder.length > 0 ? "0x" + thoughtOrder[Math.floor(maxIdx / 3)].toString().padStart(4, '0').toUpperCase() : "0x..."}</span>
          <span>{thoughtOrder.length > 0 ? "0x" + thoughtOrder[Math.floor((maxIdx / 3) * 2)].toString().padStart(4, '0').toUpperCase() : "0x..."}</span>
          <span>Live Edge</span>
        </div>
      </div>
    </div>
  );
}
