import { useState, useMemo, useRef, useCallback } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, SlidersHorizontal, X, Trash2, Plus, GripVertical } from 'lucide-react';
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
  const [colOrder, setColOrder] = useState<string[]>(columns.map(c => c.key));
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    const w: Record<string, number> = {};
    columns.forEach(c => { if (c.width) w[c.key] = c.width; });
    return w;
  });
  const [dragColKey, setDragColKey] = useState<string | null>(null);
  const resizingRef = useRef<{ key: string; startX: number; startW: number } | null>(null);

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

  // Column order management
  const orderedCols = useMemo(() => {
    const ordered: Column[] = [];
    colOrder.forEach(key => {
      const col = columns.find(c => c.key === key);
      if (col && !hiddenCols.has(key)) ordered.push(col);
    });
    // Add any new cols not in order
    columns.forEach(c => {
      if (!colOrder.includes(c.key) && !hiddenCols.has(c.key)) ordered.push(c);
    });
    return ordered;
  }, [columns, colOrder, hiddenCols]);

  // Column drag reorder
  const handleColDragStart = (key: string) => setDragColKey(key);
  const handleColDragOver = (e: React.DragEvent, overKey: string) => {
    e.preventDefault();
    if (!dragColKey || dragColKey === overKey) return;
    setColOrder(prev => {
      const next = [...prev];
      const fromIdx = next.indexOf(dragColKey);
      const toIdx = next.indexOf(overKey);
      if (fromIdx < 0 || toIdx < 0) return prev;
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, dragColKey);
      return next;
    });
  };

  // Column resize
  const handleResizeStart = useCallback((e: React.MouseEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startW = colWidths[key] || 120;
    resizingRef.current = { key, startX: e.clientX, startW };

    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return;
      const diff = ev.clientX - resizingRef.current.startX;
      const newW = Math.max(60, resizingRef.current.startW + diff);
      setColWidths(prev => ({ ...prev, [resizingRef.current!.key]: newW }));
    };
    const onUp = () => {
      resizingRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [colWidths]);

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r => orderedCols.some(c => {
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
  }, [data, search, sortKey, sortDir, filterCol, filterVal, orderedCols]);

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${entityName || 'data'}...`}
            style={{ width: '100%', padding: '7px 10px 7px 30px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12, outline: 'none', background: 'var(--bg)', color: 'var(--text)', boxSizing: 'border-box', fontFamily: 'var(--sans)' }} />
        </div>

        <select value={filterCol} onChange={e => { setFilterCol(e.target.value); setFilterVal(''); }}
          style={{ padding: '7px 8px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11, background: 'var(--bg)', color: 'var(--text)' }}>
          <option value="">Filter by...</option>
          {orderedCols.filter(c => c.type === 'select').map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        {filterCol && (
          <>
            <select value={filterVal} onChange={e => setFilterVal(e.target.value)}
              style={{ padding: '7px 8px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11, background: 'var(--bg)', color: 'var(--text)' }}>
              <option value="">All</option>
              {columns.find(c => c.key === filterCol)?.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={() => { setFilterCol(''); setFilterVal(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <X size={14} color="var(--text-3)" />
            </button>
          </>
        )}

        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowColPicker(!showColPicker)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11, background: 'var(--bg)', color: 'var(--text-2)', cursor: 'pointer', fontWeight: 500 }}>
            <SlidersHorizontal size={12} /> Columns
          </button>
          {showColPicker && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, padding: 8, zIndex: 50, minWidth: 160, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              {columns.map(c => (
                <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', fontSize: 11, cursor: 'pointer', borderRadius: 3 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <input type="checkbox" checked={!hiddenCols.has(c.key)} onChange={() => toggleCol(c.key)} style={{ accentColor: 'var(--accent)' }} />
                  {c.label}
                </label>
              ))}
            </div>
          )}
        </div>

        {onAdd && (
          <button onClick={onAdd} className="btn-primary">
            <Plus size={13} /> {addLabel || 'Add'}
          </button>
        )}
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)' }}>{filtered.length} of {data.length}</div>
      </div>

      {/* Table */}
      <div className="card data-table-wrap" style={{ overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              {orderedCols.map(c => (
                <th key={c.key}
                  draggable
                  onDragStart={() => handleColDragStart(c.key)}
                  onDragOver={e => handleColDragOver(e, c.key)}
                  onDragEnd={() => setDragColKey(null)}
                  style={{ cursor: 'pointer', userSelect: 'none', width: colWidths[c.key] || c.width, whiteSpace: 'nowrap', position: 'relative' }}
                  onClick={() => toggleSort(c.key)}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <GripVertical size={10} style={{ opacity: 0.3 }} />
                    {c.label}
                    {sortKey === c.key ? (sortDir === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />) : <ArrowUpDown size={10} style={{ opacity: 0.3 }} />}
                  </span>
                  {/* Resize handle */}
                  <div onMouseDown={e => handleResizeStart(e, c.key)}
                    style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 4, cursor: 'col-resize', background: 'transparent' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'} />
                </th>
              ))}
              <th style={{ width: 30 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={orderedCols.length + 1} style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                {data.length === 0 ? `No ${entityName || 'data'} yet` : 'No matches'}
              </td></tr>
            ) : filtered.map(row => (
              <tr key={row.id}>
                {orderedCols.map(c => (
                  <td key={c.key} style={{ width: colWidths[c.key] || c.width }}>
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
