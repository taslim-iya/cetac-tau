import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  value: string; // comma-separated roles e.g. "President, VP Operations"
  roles: string[];
  onChange: (role: string) => void;
}

function parseRoles(value: string): string[] {
  return value.split(',').map(r => r.trim()).filter(Boolean);
}

function joinRoles(roles: string[]): string {
  return roles.join(', ');
}

export default function RoleCombobox({ value, roles, onChange }: Props) {
  const currentRoles = parseRoles(value);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        // If there's text in the input, add it as a role
        if (input.trim()) {
          addRole(input.trim());
          setInput('');
        }
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [input, currentRoles]);

  const addRole = (role: string) => {
    if (!role || currentRoles.includes(role)) return;
    onChange(joinRoles([...currentRoles, role]));
  };

  const removeRole = (role: string) => {
    const updated = currentRoles.filter(r => r !== role);
    onChange(joinRoles(updated));
  };

  const filtered = roles.filter(r =>
    r.toLowerCase().includes(input.toLowerCase()) && !currentRoles.includes(r)
  );
  const isNew = input.trim() && !roles.includes(input.trim()) && !currentRoles.includes(input.trim());

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      {/* Tags + input row */}
      <div
        onClick={() => { setFocused(true); setOpen(true); inputRef.current?.focus(); }}
        style={{
          display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center',
          padding: '3px 6px', minHeight: 28,
          border: `1px solid ${focused ? 'var(--accent)' : 'transparent'}`,
          borderRadius: 4, background: focused ? 'var(--bg)' : 'transparent',
          cursor: 'text', transition: 'all 0.15s',
        }}
      >
        {currentRoles.map(role => (
          <span
            key={role}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '1px 6px', borderRadius: 4, fontSize: 11, fontWeight: 500,
              background: 'var(--accent)', color: '#fff', whiteSpace: 'nowrap',
            }}
          >
            {role}
            <button
              onClick={e => { e.stopPropagation(); removeRole(role); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'rgba(255,255,255,0.7)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={e => { setInput(e.target.value); setOpen(true); }}
          onFocus={() => { setFocused(true); setOpen(true); }}
          onBlur={() => setFocused(false)}
          onKeyDown={e => {
            if (e.key === 'Enter' && input.trim()) {
              addRole(input.trim());
              setInput('');
              e.preventDefault();
            }
            if (e.key === 'Backspace' && !input && currentRoles.length > 0) {
              removeRole(currentRoles[currentRoles.length - 1]);
            }
            if (e.key === 'Escape') { setOpen(false); setInput(''); inputRef.current?.blur(); }
          }}
          placeholder={currentRoles.length === 0 ? 'Type or select roles...' : '+ add role'}
          style={{
            flex: 1, minWidth: 60, border: 'none', outline: 'none',
            fontSize: 11, background: 'transparent', color: 'var(--text)',
            padding: '2px 0',
          }}
        />
      </div>
      {/* Dropdown */}
      {open && (filtered.length > 0 || isNew) && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)', maxHeight: 200, overflow: 'auto',
          marginTop: 2,
        }}>
          {isNew && (
            <div
              onClick={() => { addRole(input.trim()); setInput(''); }}
              style={{
                padding: '8px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                color: 'var(--accent)', borderBottom: '1px solid var(--border)',
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
              onClick={() => { addRole(r); setInput(''); }}
              style={{ padding: '7px 12px', cursor: 'pointer', fontSize: 12, color: 'var(--text)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {r}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
