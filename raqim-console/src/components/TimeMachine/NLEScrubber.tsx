'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSwarmStore } from '../../lib/store/useSwarmStore';

export function NLEScrubber() {
  const { thoughtOrder, activeTxId, setActiveTxId, isPaused, setIsPaused } = useSwarmStore();

  const maxIdx = Math.max(0, thoughtOrder.length - 1);
  const activeIdx = activeTxId ? thoughtOrder.indexOf(activeTxId) : maxIdx;
  
  const currentTxDisplay = useMemo(() => {
    if (thoughtOrder.length === 0) return 'WAITING';
    const tx = activeTxId || thoughtOrder[maxIdx];
    // Strict padded integer format
    return tx.toString().padStart(8, '0');
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
      setActiveTxId(thoughtOrder[maxIdx]);
      setIsPaused(true);
    } else {
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
    <div className="h-full w-full flex flex-col justify-between px-10 py-6 relative bg-zinc-950 border-t border-zinc-800">
      
      {/* Top Header: Controls and State Display */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button 
            onClick={goPrevious} 
            className="w-10 h-10 bg-zinc-900 border border-zinc-800 hover:border-[#00f3ff] text-zinc-400 hover:text-[#00f3ff] transition-colors flex items-center justify-center shadow-lg rounded-sm"
          >
            <span className="material-symbols-outlined text-lg">skip_previous</span>
          </button>
          <button 
            onClick={handlePlayPause} 
            className={`w-12 h-10 border rounded-sm transition-all flex items-center justify-center shadow-lg font-bold font-mono text-xs ${isPaused ? 'bg-[#ffb300]/10 border-[#ffb300] text-[#ffb300]' : 'bg-[#00f3ff]/10 border-[#00f3ff] text-[#00f3ff]'}`}
          >
            <span className="material-symbols-outlined text-xl">{isPaused ? 'play_arrow' : 'pause'}</span>
          </button>
          <button 
            onClick={goNext} 
            className="w-10 h-10 bg-zinc-900 border border-zinc-800 hover:border-[#00f3ff] text-zinc-400 hover:text-[#00f3ff] transition-colors flex items-center justify-center shadow-lg rounded-sm"
          >
            <span className="material-symbols-outlined text-lg">skip_next</span>
          </button>
        </div>

        <div className="flex flex-col items-end">
          <span className="font-mono text-[9px] text-zinc-600 uppercase tracking-[0.3em] mb-1">Cursor Position</span>
          <div className={`font-mono text-5xl font-black tracking-widest leading-none ${isPaused ? 'text-[#ffb300] drop-shadow-[0_0_15px_rgba(255,179,0,0.6)]' : 'text-[#00f3ff] drop-shadow-[0_0_15px_rgba(0,243,255,0.6)]'}`}>
            {currentTxDisplay}
          </div>
        </div>
      </div>
      
      {/* Precision Granular Scrubber */}
      <div className="relative w-full h-8 flex items-center group">
        {/* Granular Hash Marks */}
        <div className="absolute inset-0 flex justify-between pointer-events-none items-end pb-2 opacity-50">
          {Array.from({ length: 100 }).map((_, i) => {
             const isMajor = i % 10 === 0;
             const isMid = i % 5 === 0 && !isMajor;
             let h = 'h-1.5';
             if (isMajor) h = 'h-4';
             else if (isMid) h = 'h-2.5';
             return <div key={i} className={`w-[1px] ${h} bg-zinc-600`}></div>;
          })}
        </div>

        {/* The Track Line */}
        <div className="absolute left-0 right-0 h-px bg-zinc-700 pointer-events-none"></div>

        <input 
          className="w-full relative z-10 appearance-none bg-transparent h-full outline-none cursor-crosshair" 
          max={maxIdx} 
          min={0} 
          type="range" 
          value={activeIdx}
          onChange={handleSliderChange}
        />
        <style jsx>{`
          input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 4px;
            height: 32px;
            background: ${isPaused ? '#ffb300' : '#00f3ff'};
            cursor: ew-resize;
            border-radius: 0;
            box-shadow: 0 0 10px ${isPaused ? 'rgba(255,179,0,0.8)' : 'rgba(0,243,255,0.8)'};
          }
          input[type=range]::-moz-range-thumb {
            width: 4px;
            height: 32px;
            background: ${isPaused ? '#ffb300' : '#00f3ff'};
            cursor: ew-resize;
            border-radius: 0;
            border: none;
            box-shadow: 0 0 10px ${isPaused ? 'rgba(255,179,0,0.8)' : 'rgba(0,243,255,0.8)'};
          }
        `}</style>
      </div>

    </div>
  );
}
