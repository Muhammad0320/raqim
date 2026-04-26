'use client';
import { useSwarmStore } from '../../lib/store/useSwarmStore';
import { SkipBack, SkipForward, Play } from 'lucide-react';
import styles from './TimeMachine.module.css';

export function NLEScrubber() {
  const { thoughtOrder, activeTxId, setActiveTxId } = useSwarmStore();

  const total = thoughtOrder.length;
  // If activeTxId is null, we are at the "Live" edge (100%)
  const currentIndex = activeTxId ? thoughtOrder.indexOf(activeTxId) : total - 1;
  
  // Calculate percentage for styling the custom scrubber track
  const progressPercent = total <= 1 ? 100 : (currentIndex / (total - 1)) * 100;

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (val >= total - 1) {
      setActiveTxId(null); // Back to live
    } else {
      setActiveTxId(thoughtOrder[val]);
    }
  };

  const jumpToLive = () => setActiveTxId(null);

  const displayId = activeTxId 
    ? activeTxId.substring(0, 10) + '...' + activeTxId.substring(activeTxId.length - 4)
    : 'LIVE';

  return (
    <div className={styles.scrubberContainer}>
      <div className={styles.scrubberHeader}>
        <div className={styles.title}>
          <SkipBack size={14} className="text-muted" />
          <span>TEMPORAL NAVIGATION</span>
        </div>
        <div className={styles.currentTx}>
          CURRENT TX: <span className="text-mono glow-cyan">{displayId}</span>
        </div>
        <div className={styles.controls}>
          <button className={styles.iconBtn}><SkipBack size={16} /></button>
          <button className={styles.iconBtn} onClick={jumpToLive}><Play size={16} /></button>
          <button className={styles.iconBtn}><SkipForward size={16} /></button>
        </div>
      </div>

      <div className={styles.trackArea}>
        <div 
          className={styles.trackFill} 
          style={{ width: `${progressPercent}%` }} 
        />
        <input 
          type="range" 
          min="0" 
          max={total > 0 ? total - 1 : 0} 
          value={currentIndex >= 0 ? currentIndex : 0}
          onChange={handleScrub}
          className={styles.rangeInput}
        />
        
        <div className={styles.axisLabels}>
           <span>Genesis (0x0000)</span>
           <span>Future Extrapolation</span>
        </div>
      </div>
    </div>
  );
}
