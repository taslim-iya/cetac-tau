import { useState, useRef, useEffect } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  type?: 'text' | 'date' | 'select' | 'textarea';
  options?: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

export default function EditableCell({ value, onChange, type = 'text', options, placeholder, className }: Props) {
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

  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      className={`edit-cell ${className || ''}`} placeholder={placeholder} />
  );
}
