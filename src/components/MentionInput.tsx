import { useMemo, useRef, useState } from 'react';
import { useStore } from '../store';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  multiline?: boolean;
}

export default function MentionInput({ value, onChange, placeholder, rows = 3, multiline = true }: Props) {
  const team = useStore(s => s.team);
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);
  const [pop, setPop] = useState<{ query: string; start: number; active: number } | null>(null);

  const matches = useMemo(() => {
    if (!pop) return [];
    const q = pop.query.toLowerCase();
    return team
      .filter(m => m.name)
      .filter(m => m.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [pop, team]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const next = e.target.value;
    const caret = e.target.selectionStart ?? next.length;
    onChange(next);

    // find @ token immediately before caret
    const before = next.slice(0, caret);
    const match = before.match(/(^|\s)@([\w-]{0,30})$/);
    if (match) {
      const start = before.length - match[2].length - 1; // position of '@'
      setPop({ query: match[2], start, active: 0 });
    } else {
      setPop(null);
    }
  };

  const insert = (name: string) => {
    if (!pop || !ref.current) return;
    const el = ref.current;
    const caret = el.selectionStart ?? value.length;
    const before = value.slice(0, pop.start);
    const after = value.slice(caret);
    const inserted = `@${name} `;
    const next = `${before}${inserted}${after}`;
    onChange(next);
    setPop(null);
    setTimeout(() => {
      el.focus();
      const pos = (before + inserted).length;
      el.setSelectionRange(pos, pos);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!pop || matches.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setPop(p => p && ({ ...p, active: Math.min(matches.length - 1, p.active + 1) })); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setPop(p => p && ({ ...p, active: Math.max(0, p.active - 1) })); }
    else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insert(matches[pop.active].name); }
    else if (e.key === 'Escape') { e.preventDefault(); setPop(null); }
  };

  const commonProps = {
    value,
    placeholder,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    className: 'input',
    style: { width: '100%', fontFamily: 'inherit', fontSize: 13, resize: 'vertical' as const },
  };

  return (
    <div style={{ position: 'relative' }}>
      {multiline ? (
        <textarea ref={ref as any} rows={rows} {...commonProps} />
      ) : (
        <input ref={ref as any} type="text" {...commonProps} />
      )}
      {pop && matches.length > 0 && (
        <div className="mention-pop" style={{ left: 0, top: '100%', marginTop: 4 }}>
          {matches.map((m, i) => (
            <div
              key={m.id}
              className="mention-item"
              data-active={i === pop.active}
              onMouseEnter={() => setPop(p => p && ({ ...p, active: i }))}
              onMouseDown={e => { e.preventDefault(); insert(m.name); }}
            >
              <span className="mention-avatar">{m.name[0]}</span>
              <div>
                <div style={{ fontWeight: 500 }}>{m.name}</div>
                {m.role && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{m.role}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
