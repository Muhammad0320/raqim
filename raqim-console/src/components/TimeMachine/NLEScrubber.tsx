'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSwarmStore } from '../../lib/store/useSwarmStore';

export function NLEScrubber() {
  const { thoughtOrder, activeTxId, setActiveTxId, isPaused, setIsPaused } = useSwarmStore();

  const maxIdx = Math.max(0, thoughtOrder.length - 1);
  const activeIdx = activeTxId ? thoughtOrder.indexOf(activeTxId) : maxIdx;
  
  const currentTxDisplay = useMemo(() => {
    if (thoughtOrder.length === 0) return 'WAITING...';
    const tx = activeTxId || thoughtOrder[maxIdx];
    return '0x' + tx.toString().padStart(8, '0').toUpperCase();
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
    if (activeIdx > 0) {
      setActiveTxId(thoughtOrder[activeIdx - 1]);
      setIsPaused(true);
    }
  };

  const goNext = () => {
    if (activeIdx < maxIdx) {
      const nextIdx = activeIdx + 1;
      if (nextIdx === maxIdx) {
        setActiveTxId(null);
        setIsPaused(false);
      } else {
        setActiveTxId(thoughtOrder[nextIdx]);
      }
    }
  };

  return (
    <div className="h-full w-full flex flex-col justify-center px-8 relative bg-zinc-950 border-t border-zinc-800">
      
      {/* Top Header: Controls and State Display */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <button 
            onClick={goPrevious} 
            className="w-12 h-12 bg-zinc-900 border border-zinc-700 hover:border-[#00f3ff] hover:text-[#00f3ff] text-zinc-400 rounded transition-colors flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
          >
            <span className="material-symbols-outlined text-2xl">skip_previous</span>
          </button>
          <button 
            onClick={handlePlayPause} 
            className={`w-16 h-12 border rounded transition-all flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.5)] font-bold font-mono text-xs ${isPaused ? 'bg-[#ffb300]/20 border-[#ffb300] text-[#ffb300]' : 'bg-[#00f3ff]/20 border-[#00f3ff] text-[#00f3ff]'}`}
          >
            <span className="material-symbols-outlined text-2xl">{isPaused ? 'play_arrow' : 'pause'}</span>
          </button>
          <button 
            onClick={goNext} 
            className="w-12 h-12 bg-zinc-900 border border-zinc-700 hover:border-[#00f3ff] hover:text-[#00f3ff] text-zinc-400 rounded transition-colors flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
          >
            <span className="material-symbols-outlined text-2xl">skip_next</span>
          </button>
        </div>

        <div className="flex flex-col items-end">
          <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Cursor Position</span>
          <div className="font-mono text-3xl font-bold text-white tracking-widest bg-zinc-900 px-4 py-1 rounded border border-zinc-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
            {currentTxDisplay}
          </div>
        </div>
      </div>
      
      {/* Massive Scrubber */}
      <div className="relative w-full py-4 group">
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 flex justify-between pointer-events-none px-2 items-center">
          {Array.from({ length: 40 }).map((_, i) => (
             <div key={i} className={`w-[1px] ${i % 5 === 0 ? 'h-full bg-zinc-700' : 'h-1/2 bg-zinc-800'} transition-colors group-hover:bg-zinc-600`}></div>
          ))}
        </div>

        <input 
          className="w-full relative z-10 appearance-none bg-transparent h-10 outline-none cursor-ew-resize" 
          max={maxIdx} 
          min={0} 
          type="range" 
          value={activeIdx}
          onChange={handleSliderChange}
          style={{
            background: `linear-gradient(to right, rgba(0, 243, 255, 0.2) ${(activeIdx / Math.max(1, maxIdx)) * 100}%, transparent 0)`
          }}
        />
        <style jsx>{`
          input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 12px;
            height: 48px;
            background: ${isPaused ? '#ffb300' : '#00f3ff'};
            cursor: pointer;
            border-radius: 2px;
            box-shadow: 0 0 15px ${isPaused ? 'rgba(255,179,0,0.8)' : 'rgba(0,243,255,0.8)'};
            transition: background 0.2s, box-shadow 0.2s;
          }
          input[type=range]::-moz-range-thumb {
            width: 12px;
            height: 48px;
            background: ${isPaused ? '#ffb300' : '#00f3ff'};
            cursor: pointer;
            border-radius: 2px;
            border: none;
            box-shadow: 0 0 15px ${isPaused ? 'rgba(255,179,0,0.8)' : 'rgba(0,243,255,0.8)'};
          }
        `}</style>
      </div>

    </div>
  );
}
