import { useState } from 'react';

type DropPos = 'above' | 'below';

export function useRowDrag(ids: string[], onReorder: (orderedIds: string[]) => void) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [target, setTarget] = useState<{ id: string; pos: DropPos } | null>(null);

  const handleProps = (id: string) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      setDragging(id);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
    },
    onDragEnd: () => { setDragging(null); setTarget(null); },
  });

  const rowProps = (id: string) => ({
    onDragOver: (e: React.DragEvent) => {
      if (!dragging || dragging === id) return;
      e.preventDefault();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const pos: DropPos = (e.clientY - rect.top) < rect.height / 2 ? 'above' : 'below';
      setTarget({ id, pos });
    },
    onDrop: (e: React.DragEvent) => {
      if (!dragging) return;
      e.preventDefault();
      const fromId = dragging;
      const toId = id;
      setDragging(null);
      setTarget(null);
      if (fromId === toId) return;
      const next = [...ids];
      const fromIdx = next.indexOf(fromId);
      const toIdx = next.indexOf(toId);
      if (fromIdx < 0 || toIdx < 0) return;
      const [item] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, item);
      onReorder(next);
    },
    className: [
      dragging === id ? 'row-dragging' : '',
      target?.id === id ? (target.pos === 'above' ? 'row-drop-above' : 'row-drop-below') : '',
    ].filter(Boolean).join(' '),
  });

  return { handleProps, rowProps, dragging };
}
