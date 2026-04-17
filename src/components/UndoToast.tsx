import { useEffect, useState } from 'react';
import { Undo2, X } from 'lucide-react';
import { useStore } from '../store';

const DURATION = 6000;

export default function UndoToast() {
  const lastUndo = useStore(s => s.lastUndo);
  const undo = useStore(s => s.undo);
  const clearUndo = useStore(s => s.clearUndo);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!lastUndo) return;
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(pct);
      if (elapsed >= DURATION) {
        clearInterval(interval);
        clearUndo();
      }
    }, 80);
    return () => clearInterval(interval);
  }, [lastUndo, clearUndo]);

  if (!lastUndo) return null;

  return (
    <div className="toast-wrap">
      <div className="toast">
        <div className="toast-body">
          <span style={{ fontSize: 13, fontWeight: 500 }}>{lastUndo.message}</span>
          <button className="toast-action" onClick={undo}>
            <Undo2 size={13} /> Undo
          </button>
          <button className="toast-close" onClick={clearUndo} aria-label="Dismiss">
            <X size={13} />
          </button>
        </div>
        <div className="toast-progress" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
