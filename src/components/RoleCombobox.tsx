import { useState, useRef, useEffect } from 'react';

interface Props {
  value: string;
  roles: string[];
  onChange: (role: string) => void;
}

export default function RoleCombobox({ value, roles, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value);
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setInput(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        if (input !== value) onChange(input);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [input, value, onChange]);

  const filtered = roles.filter(r => r.toLowerCase().includes(input.toLowerCase()));
  const isNew = input.trim() && !roles.includes(input.trim());

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        value={input}
        onChange={e => { setInput(e.target.value); setOpen(true); }}
        onFocus={() => { setFocused(true); setOpen(true); }}
        onBlur={() => setFocused(false)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            setOpen(false);
            onChange(input.trim());
            inputRef.current?.blur();
          }
          if (e.key === 'Escape') { setOpen(false); setInput(value); inputRef.current?.blur(); }
        }}
        placeholder="Type or select role..."
        style={{
          width: '100%',
          padding: '4px 8px',
          border: `1px solid ${focused ? 'var(--accent)' : 'transparent'}`,
          borderRadius: 4,
          fontSize: 12,
          background: focused ? 'var(--bg)' : 'transparent',
          color: 'var(--text)',
          outline: 'none',
          transition: 'all 0.15s',
        }}
      />
      {open && (filtered.length > 0 || isNew) && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)', maxHeight: 200, overflow: 'auto',
          marginTop: 2,
        }}>
          {isNew && (
            <div
              onClick={() => { onChange(input.trim()); setOpen(false); }}
              style={{
                padding: '8px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                color: 'var(--accent)', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              + Create "{input.trim()}"
            </div>
          )}
          {filtered.map(r => (
            <div
              key={r}
              onClick={() => { setInput(r); onChange(r); setOpen(false); }}
              style={{
                padding: '7px 12px', cursor: 'pointer', fontSize: 12,
                color: 'var(--text)',
                background: r === value ? 'var(--accent-light)' : 'transparent',
                fontWeight: r === value ? 600 : 400,
              }}
              onMouseEnter={e => { if (r !== value) e.currentTarget.style.background = 'var(--bg-2)'; }}
              onMouseLeave={e => { if (r !== value) e.currentTarget.style.background = 'transparent'; }}
            >
              {r}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
