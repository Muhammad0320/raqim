'use client';

import { useState, useMemo } from 'react';
import { useSwarmStore } from '../../lib/store/useSwarmStore';

export function NLEScrubber() {
  const { thoughtOrder, activeTxId, setActiveTxId, isPaused, setIsPaused } = useSwarmStore();

  const maxIdx = Math.max(0, thoughtOrder.length - 1);
  const activeIdx = activeTxId ? thoughtOrder.indexOf(activeTxId) : maxIdx;
  
  const currentTxDisplay = useMemo(() => {
    if (thoughtOrder.length === 0) return 'WAITING...';
    const tx = activeTxId || thoughtOrder[maxIdx];
    return '#' + tx;
  }, [activeTxId, thoughtOrder, maxIdx]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIdx = parseInt(e.target.value, 10);
    if (newIdx === maxIdx) {
      setActiveTxId(null);
      setIsPaused(false);
    } else {
      setActiveTxId(thoughtOrder[newIdx]);
      setIsPaused(true);
    }
  };

  const handlePlayPause = () => {
    if (!isPaused) {
      // Pause at current position
      setActiveTxId(thoughtOrder[maxIdx]);
      setIsPaused(true);
    } else {
      // Resume live stream
      setActiveTxId(null);
      setIsPaused(false);
    }
  };

  const goPrevious = () => {
    const current = activeTxId || thoughtOrder[maxIdx];
    if (current && current > 0) {
      setActiveTxId(current - 1);
      setIsPaused(true);
    }
  };

  const goNext = () => {
    const current = activeTxId || thoughtOrder[maxIdx];
    if (current) {
      const nextTxId = current + 1;
      if (thoughtOrder.length > 0 && nextTxId >= thoughtOrder[maxIdx]) {
        setActiveTxId(null);
        setIsPaused(false);
      } else {
        setActiveTxId(nextTxId);
      }
    }
  };

  return (
    <div className="h-full w-full flex flex-col justify-center px-8 relative bg-zinc-950 border-t border-zinc-900">
      
      {/* Top Header: Controls and State Display */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-3">
          <button 
            onClick={goPrevious} 
            className="w-10 h-10 bg-zinc-900 border border-zinc-800 hover:border-[#00f3ff] hover:text-[#00f3ff] text-zinc-400 rounded-sm transition-colors flex items-center justify-center shadow-[0_2px_5px_rgba(0,0,0,0.5)]"
          >
            <span className="material-symbols-outlined text-xl">skip_previous</span>
          </button>
          <button 
            onClick={handlePlayPause} 
            className={`w-12 h-10 border rounded-sm transition-all flex items-center justify-center shadow-[0_2px_5px_rgba(0,0,0,0.5)] font-bold font-mono text-xs ${isPaused ? 'bg-[#ffb300]/20 border-[#ffb300] text-[#ffb300]' : 'bg-[#00f3ff]/20 border-[#00f3ff] text-[#00f3ff]'}`}
          >
            <span className="material-symbols-outlined text-xl">{isPaused ? 'play_arrow' : 'pause'}</span>
          </button>
          <button 
            onClick={goNext} 
            className="w-10 h-10 bg-zinc-900 border border-zinc-800 hover:border-[#00f3ff] hover:text-[#00f3ff] text-zinc-400 rounded-sm transition-colors flex items-center justify-center shadow-[0_2px_5px_rgba(0,0,0,0.5)]"
          >
            <span className="material-symbols-outlined text-xl">skip_next</span>
          </button>
        </div>

        <div className="flex flex-col items-end">
          <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest mb-1">Cursor Position</span>
          <div className="font-mono text-2xl font-bold text-white tracking-widest bg-zinc-900/50 px-3 py-0.5 rounded-sm border border-zinc-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
            {currentTxDisplay}
          </div>
        </div>
      </div>
      
      {/* Sleek Scrubber */}
      <div className="relative w-full py-4 group">
        {/* Subtle Decorative Grid Lines */}
        <div className="absolute inset-0 flex justify-between pointer-events-none px-2 items-center">
          {Array.from({ length: 100 }).map((_, i) => (
             <div key={i} className={`w-[1px] ${i % 10 === 0 ? 'h-4 bg-zinc-700' : 'h-1.5 bg-zinc-800'} transition-colors group-hover:bg-zinc-700/80`}></div>
          ))}
        </div>

        <input 
          className="w-full relative z-10 appearance-none bg-zinc-900 border border-zinc-800 rounded-full outline-none cursor-ew-resize h-[8px] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]" 
          max={maxIdx} 
          min={0} 
          type="range" 
          value={activeIdx}
          onChange={handleSliderChange}
          style={{
            background: `linear-gradient(to right, ${isPaused ? 'rgba(255, 179, 0, 0.5)' : 'rgba(0, 243, 255, 0.4)'} ${(activeIdx / Math.max(1, maxIdx)) * 100}%, transparent 0)`
          }}
        />
        <style jsx>{`
          input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 4px;
            height: 24px;
            background: ${isPaused ? '#ffb300' : '#00f3ff'};
            cursor: pointer;
            border-radius: 1px;
            box-shadow: 0 0 10px ${isPaused ? '#ffb300' : '#00f3ff'};
            transition: background 0.2s, box-shadow 0.2s;
          }
          input[type=range]::-moz-range-thumb {
            width: 4px;
            height: 24px;
            background: ${isPaused ? '#ffb300' : '#00f3ff'};
            cursor: pointer;
            border-radius: 1px;
            border: none;
            box-shadow: 0 0 10px ${isPaused ? '#ffb300' : '#00f3ff'};
          }
        `}</style>
      </div>

    </div>
  );
}
