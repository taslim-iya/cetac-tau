import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, SlidersHorizontal, X, Trash2, Plus } from 'lucide-react';
import EditableCell from './EditableCell';

interface Column {
  key: string;
  label: string;
  width?: number;
  type?: 'text' | 'date' | 'select' | 'tags';
  options?: { value: string; label: string }[];
  render?: (val: any, row: any) => React.ReactNode;
  hidden?: boolean;
}

interface Props {
  columns: Column[];
  data: any[];
  onUpdate: (id: string, updates: Record<string, any>) => void;
  onDelete: (id: string) => void;
  onAdd?: () => void;
  addLabel?: string;
  entityName?: string;
  defaultSort?: { key: string; dir: 'asc' | 'desc' };
}

export default function DataTable({ columns, data, onUpdate, onDelete, onAdd, addLabel, entityName, defaultSort }: Props) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(defaultSort?.key || '');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultSort?.dir || 'asc');
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set(columns.filter(c => c.hidden).map(c => c.key)));
  const [showColPicker, setShowColPicker] = useState(false);
  const [filterCol, setFilterCol] = useState('');
  const [filterVal, setFilterVal] = useState('');

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const toggleCol = (key: string) => {
    setHiddenCols(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const visibleCols = columns.filter(c => !hiddenCols.has(c.key));

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r => visibleCols.some(c => {
        const v = r[c.key];
        return v && String(Array.isArray(v) ? v.join(' ') : v).toLowerCase().includes(q);
      }));
    }
    if (filterCol && filterVal) {
      rows = rows.filter(r => {
        const v = r[filterCol];
        return v && String(Array.isArray(v) ? v.join(' ') : v).toLowerCase().includes(filterVal.toLowerCase());
      });
    }
    if (sortKey) {
      rows.sort((a, b) => {
        const av = a[sortKey], bv = b[sortKey];
        const cmp = String(av || '').localeCompare(String(bv || ''), undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return rows;
  }, [data, search, sortKey, sortDir, filterCol, filterVal, visibleCols]);

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${entityName || 'data'}...`}
            style={{ width: '100%', padding: '7px 10px 7px 30px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, outline: 'none', background: 'var(--bg)', color: 'var(--text)', boxSizing: 'border-box' }} />
        </div>

        {/* Column filter */}
        <select value={filterCol} onChange={e => { setFilterCol(e.target.value); setFilterVal(''); }}
          style={{ padding: '7px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, background: 'var(--bg)', color: 'var(--text)' }}>
          <option value="">Filter by...</option>
          {visibleCols.filter(c => c.type === 'select').map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        {filterCol && (
          <>
            <select value={filterVal} onChange={e => setFilterVal(e.target.value)}
              style={{ padding: '7px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, background: 'var(--bg)', color: 'var(--text)' }}>
              <option value="">All</option>
              {columns.find(c => c.key === filterCol)?.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={() => { setFilterCol(''); setFilterVal(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <X size={14} color="var(--text-3)" />
            </button>
          </>
        )}

        {/* Column visibility */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowColPicker(!showColPicker)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, background: 'var(--bg)', color: 'var(--text-2)', cursor: 'pointer', fontWeight: 500 }}>
            <SlidersHorizontal size={12} /> Columns
          </button>
          {showColPicker && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, zIndex: 50, minWidth: 160, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              {columns.map(c => (
                <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', fontSize: 11, cursor: 'pointer', borderRadius: 4 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <input type="checkbox" checked={!hiddenCols.has(c.key)} onChange={() => toggleCol(c.key)} style={{ accentColor: 'var(--accent)' }} />
                  {c.label}
                </label>
              ))}
            </div>
          )}
        </div>

        {onAdd && (
          <button onClick={onAdd} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', border: 'none', borderRadius: 6, background: 'var(--accent)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <Plus size={13} /> {addLabel || 'Add'}
          </button>
        )}
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)' }}>{filtered.length} of {data.length}</div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              {visibleCols.map(c => (
                <th key={c.key} onClick={() => toggleSort(c.key)} style={{ cursor: 'pointer', userSelect: 'none', width: c.width, whiteSpace: 'nowrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {c.label}
                    {sortKey === c.key ? (sortDir === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />) : <ArrowUpDown size={10} style={{ opacity: 0.3 }} />}
                  </span>
                </th>
              ))}
              <th style={{ width: 30 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={visibleCols.length + 1} style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                {data.length === 0 ? `No ${entityName || 'data'} yet` : 'No matches'}
              </td></tr>
            ) : filtered.map(row => (
              <tr key={row.id}>
                {visibleCols.map(c => (
                  <td key={c.key}>
                    {c.render ? c.render(row[c.key], row) : (
                      <EditableCell
                        value={Array.isArray(row[c.key]) ? row[c.key].join(', ') : String(row[c.key] || '')}
                        onChange={v => {
                          if (c.type === 'tags' || c.key === 'assignees' || c.key === 'speakers' || c.key === 'sponsors') {
                            onUpdate(row.id, { [c.key]: v.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean) });
                          } else if (c.key === 'week' || c.key === 'attendeeCount') {
                            onUpdate(row.id, { [c.key]: Number(v) || 0 });
                          } else {
                            onUpdate(row.id, { [c.key]: v });
                          }
                        }}
                        type={c.type === 'select' ? 'select' : c.type === 'date' ? 'date' : 'text'}
                        options={c.options}
                        placeholder={c.label}
                      />
                    )}
                  </td>
                ))}
                <td>
                  <button onClick={() => onDelete(row.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.3 }} title="Delete">
                    <Trash2 size={13} color="var(--red)" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
