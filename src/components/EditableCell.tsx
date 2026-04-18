import { useState, useRef, useEffect } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  type?: 'text' | 'date' | 'select' | 'textarea';
  options?: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

const URL_RE = /^https?:\/\/.+/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LINKEDIN_RE = /linkedin\.com/i;

function isLink(v: string): boolean {
  return URL_RE.test(v) || EMAIL_RE.test(v) || LINKEDIN_RE.test(v);
}

function toHref(v: string): string {
  if (EMAIL_RE.test(v)) return `mailto:${v}`;
  if (URL_RE.test(v)) return v;
  // Bare domain-like strings (linkedin.com/in/...)
  return `https://${v}`;
}

function displayText(v: string): string {
  // Shorten URLs for display
  try {
    if (URL_RE.test(v)) {
      const u = new URL(v);
      const path = u.pathname === '/' ? '' : u.pathname;
      return (u.hostname.replace('www.', '') + path).replace(/\/$/, '');
    }
  } catch {}
  return v;
}

export default function EditableCell({ value, onChange, type = 'text', options, placeholder, className }: Props) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  if (type === 'select' && options) {
    return (
      <select value={value} onChange={e => onChange(e.target.value)} className="edit-cell" style={{ cursor: 'pointer', appearance: 'auto' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }

  if (type === 'textarea') {
    return (
      <textarea value={value} onChange={e => onChange(e.target.value)} className="edit-cell" placeholder={placeholder}
        rows={2} style={{ resize: 'vertical', minHeight: 32 }} />
    );
  }

  // Editing mode — always show raw input
  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={() => setEditing(false)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditing(false); }}
        className={`edit-cell ${className || ''}`}
        placeholder={placeholder}
      />
    );
  }

  // Display mode — render links as clickable hyperlinks
  if (value && isLink(value)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, minHeight: 28 }}>
        <a
          href={toHref(value)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{
            color: 'var(--accent)',
            textDecoration: 'none',
            fontSize: 12,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '85%',
          }}
          title={value}
        >
          {displayText(value)}
        </a>
        <button
          onClick={(e) => { e.stopPropagation(); setEditing(true); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.3, padding: '0 2px', fontSize: 10, lineHeight: 1 }}
          title="Edit"
        >
          ✎
        </button>
      </div>
    );
  }

  // Display mode — plain text, click to edit
  return (
    <div
      onClick={() => setEditing(true)}
      className={`edit-cell ${className || ''}`}
      style={{ cursor: 'text', minHeight: 28, display: 'flex', alignItems: 'center' }}
      title="Click to edit"
    >
      {value || <span style={{ color: 'var(--text-3)', opacity: 0.5 }}>{placeholder}</span>}
    </div>
  );
}
