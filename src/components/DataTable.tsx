import { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, SlidersHorizontal, X, Trash2, GripVertical, Rows3, Rows2, Pin, PinOff, Edit3 } from 'lucide-react';
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
  onReorder?: (orderedIds: string[]) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkUpdate?: (ids: string[], updates: Record<string, any>) => void;
}

type DropPos = 'above' | 'below';

export default function DataTable({ columns, data, onUpdate, onDelete, entityName, defaultSort, onReorder, onBulkDelete, onBulkUpdate }: Props) {
  const storageKey = `dt-${entityName || 'default'}`;
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(defaultSort?.key || '');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultSort?.dir || 'asc');
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set(columns.filter(c => c.hidden).map(c => c.key)));
  const [showColPicker, setShowColPicker] = useState(false);
  const [filterCol, setFilterCol] = useState('');
  const [filterVal, setFilterVal] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dense, setDense] = useState(false);

  // Column order + widths (persisted)
  const [colOrder, setColOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}-order`);
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        // include any new columns at the end
        const keys = columns.map(c => c.key);
        return [...parsed.filter(k => keys.includes(k)), ...keys.filter(k => !parsed.includes(k))];
      }
    } catch {}
    return columns.map(c => c.key);
  });
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem(`${storageKey}-widths`) || '{}'); } catch { return {}; }
  });
  const [pinnedKeys, setPinnedKeys] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(`${storageKey}-pinned`) || '[]'); } catch { return []; }
  });
  const [bulkEdit, setBulkEdit] = useState<{ col: string; val: string } | null>(null);

  useEffect(() => { localStorage.setItem(`${storageKey}-order`, JSON.stringify(colOrder)); }, [colOrder, storageKey]);
  useEffect(() => { localStorage.setItem(`${storageKey}-widths`, JSON.stringify(colWidths)); }, [colWidths, storageKey]);
  useEffect(() => { localStorage.setItem(`${storageKey}-pinned`, JSON.stringify(pinnedKeys)); }, [pinnedKeys, storageKey]);

  const togglePin = (key: string) => {
    setPinnedKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  // Drag state
  const [draggingRowId, setDraggingRowId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; pos: DropPos } | null>(null);
  const [draggingCol, setDraggingCol] = useState<string | null>(null);
  const [colDropTarget, setColDropTarget] = useState<string | null>(null);

  // Resize
  const resizingRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);

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

  // Ordered + visible columns (pinned first)
  const orderedCols = useMemo(() => {
    const map = new Map(columns.map(c => [c.key, c]));
    const inOrder = colOrder.map(k => map.get(k)).filter(Boolean) as Column[];
    const pinned = pinnedKeys.map(k => map.get(k)).filter(Boolean) as Column[];
    const rest = inOrder.filter(c => !pinnedKeys.includes(c.key));
    return [...pinned, ...rest];
  }, [columns, colOrder, pinnedKeys]);
  const visibleCols = orderedCols.filter(c => !hiddenCols.has(c.key));

  // Cumulative left offset for pinned columns (for sticky positioning)
  const pinOffsets = useMemo(() => {
    const offsets: Record<string, number> = {};
    let left = 0;
    const leadingPadding = (onBulkDelete !== undefined ? 28 : 0) + (onReorder ? 22 : 0);
    for (const c of visibleCols) {
      if (!pinnedKeys.includes(c.key)) break;
      offsets[c.key] = leadingPadding + left;
      left += (colWidths[c.key] || c.width || 160);
    }
    return offsets;
  }, [visibleCols, pinnedKeys, colWidths, onBulkDelete, onReorder]);

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

  const canDragRows = !!onReorder && !sortKey && !search && !filterCol;

  // ─── Row drag ────────────────────────────────────────────────
  const onRowDragStart = (e: React.DragEvent, id: string) => {
    if (!canDragRows) return;
    setDraggingRowId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };
  const onRowDragOver = (e: React.DragEvent, id: string) => {
    if (!canDragRows || !draggingRowId || draggingRowId === id) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const pos: DropPos = (e.clientY - rect.top) < rect.height / 2 ? 'above' : 'below';
    setDropTarget({ id, pos });
  };
  const onRowDrop = (e: React.DragEvent, id: string) => {
    if (!canDragRows || !draggingRowId) return;
    e.preventDefault();
    const fromId = draggingRowId;
    const toId = id;
    setDraggingRowId(null);
    setDropTarget(null);
    if (fromId === toId) return;
    const ids = data.map(r => r.id);
    const fromIdx = ids.indexOf(fromId);
    const toIdx = ids.indexOf(toId);
    if (fromIdx < 0 || toIdx < 0) return;
    const pos = dropTarget?.pos;
    ids.splice(fromIdx, 1);
    const newToIdx = ids.indexOf(toId);
    const insertIdx = pos === 'below' ? newToIdx + 1 : newToIdx;
    ids.splice(insertIdx, 0, fromId);
    onReorder?.(ids);
  };
  const onRowDragEnd = () => { setDraggingRowId(null); setDropTarget(null); };

  // ─── Column drag ────────────────────────────────────────────
  const onColDragStart = (e: React.DragEvent, key: string) => {
    setDraggingCol(key);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onColDragOver = (e: React.DragEvent, key: string) => {
    if (!draggingCol || draggingCol === key) return;
    e.preventDefault();
    setColDropTarget(key);
  };
  const onColDrop = (e: React.DragEvent, key: string) => {
    if (!draggingCol) return;
    e.preventDefault();
    setColOrder(prev => {
      const next = [...prev];
      const fromIdx = next.indexOf(draggingCol);
      const toIdx = next.indexOf(key);
      if (fromIdx < 0 || toIdx < 0) return prev;
      const [col] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, col);
      return next;
    });
    setDraggingCol(null);
    setColDropTarget(null);
  };
  const onColDragEnd = () => { setDraggingCol(null); setColDropTarget(null); };

  // ─── Column resize ──────────────────────────────────────────
  const onResizeStart = (e: React.MouseEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    const th = (e.currentTarget as HTMLElement).parentElement as HTMLElement;
    resizingRef.current = { key, startX: e.clientX, startWidth: th.getBoundingClientRect().width };
    const onMove = (ev: MouseEvent) => {
      const r = resizingRef.current; if (!r) return;
      const w = Math.max(60, r.startWidth + (ev.clientX - r.startX));
      setColWidths(prev => ({ ...prev, [r.key]: w }));
    };
    const onUp = () => {
      resizingRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ─── Selection ──────────────────────────────────────────────
  const allVisibleSelected = filtered.length > 0 && filtered.every(r => selected.has(r.id));
  const toggleAll = () => {
    if (allVisibleSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map(r => r.id)));
  };
  const toggleOne = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const bulkDelete = () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    if (onBulkDelete) onBulkDelete(ids);
    else ids.forEach(id => onDelete(id));
    setSelected(new Set());
  };

  const resetLayout = () => {
    setColOrder(columns.map(c => c.key));
    setColWidths({});
    setPinnedKeys([]);
    localStorage.removeItem(`${storageKey}-order`);
    localStorage.removeItem(`${storageKey}-widths`);
    localStorage.removeItem(`${storageKey}-pinned`);
  };

  return (
    <div className={dense ? 'dense' : ''}>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="bulk-bar">
          <span>{selected.size} selected</span>
          {onBulkUpdate && (
            <button onClick={() => setBulkEdit({ col: '', val: '' })}><Edit3 size={12} /> Edit</button>
          )}
          <button onClick={bulkDelete}><Trash2 size={12} /> Delete</button>
          <button onClick={() => setSelected(new Set())} style={{ marginLeft: 'auto' }}>Clear</button>
        </div>
      )}

      {/* Bulk edit popover */}
      {bulkEdit && onBulkUpdate && (
        <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, marginBottom: 10, border: '1px solid var(--border-strong)', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-md)' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Set field:</span>
          <select className="input" value={bulkEdit.col} onChange={e => setBulkEdit(b => b && ({ ...b, col: e.target.value, val: '' }))} style={{ fontSize: 12, padding: '6px 10px' }}>
            <option value="">— choose field —</option>
            {visibleCols.filter(c => !c.render).map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          {bulkEdit.col && (() => {
            const col = columns.find(c => c.key === bulkEdit.col);
            if (col?.type === 'select' && col.options) {
              return (
                <select className="input" value={bulkEdit.val} onChange={e => setBulkEdit(b => b && ({ ...b, val: e.target.value }))} style={{ fontSize: 12, padding: '6px 10px' }}>
                  <option value="">— value —</option>
                  {col.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              );
            }
            return (
              <input className="input" value={bulkEdit.val} onChange={e => setBulkEdit(b => b && ({ ...b, val: e.target.value }))} type={col?.type === 'date' ? 'date' : 'text'} placeholder="new value" style={{ fontSize: 12, padding: '6px 10px' }} />
            );
          })()}
          <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} disabled={!bulkEdit.col || !bulkEdit.val} onClick={() => {
            if (!bulkEdit.col || !bulkEdit.val) return;
            const ids = Array.from(selected);
            onBulkUpdate(ids, { [bulkEdit.col]: bulkEdit.val });
            setBulkEdit(null);
            setSelected(new Set());
          }}>Apply to {selected.size}</button>
          <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: 12, marginLeft: 'auto' }} onClick={() => setBulkEdit(null)}>Cancel</button>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 300 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
          <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${entityName || 'data'}...`}
            style={{ width: '100%', paddingLeft: 34 }} />
        </div>

        <select className="input" value={filterCol} onChange={e => { setFilterCol(e.target.value); setFilterVal(''); }}
          style={{ fontSize: 12, paddingTop: 7, paddingBottom: 7 }}>
          <option value="">Filter by...</option>
          {visibleCols.filter(c => c.type === 'select').map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        {filterCol && (
          <>
            <select className="input" value={filterVal} onChange={e => setFilterVal(e.target.value)}
              style={{ fontSize: 12, paddingTop: 7, paddingBottom: 7 }}>
              <option value="">All</option>
              {columns.find(c => c.key === filterCol)?.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={() => { setFilterCol(''); setFilterVal(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <X size={14} color="var(--text-3)" />
            </button>
          </>
        )}

        <button className="btn btn-secondary" title={dense ? 'Comfortable' : 'Compact'} onClick={() => setDense(d => !d)} style={{ fontSize: 12, padding: '7px 10px' }}>
          {dense ? <Rows3 size={13} /> : <Rows2 size={13} />}
        </button>

        {/* Column visibility + reset */}
        <div style={{ position: 'relative' }}>
          <button className="btn btn-secondary" onClick={() => setShowColPicker(!showColPicker)} style={{ fontSize: 12, padding: '7px 12px' }}>
            <SlidersHorizontal size={12} /> Columns
          </button>
          {showColPicker && (
            <div className="glass" style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 8, zIndex: 50, minWidth: 240, boxShadow: 'var(--shadow-md)' }}>
              {orderedCols.map(c => {
                const isPinned = pinnedKeys.includes(c.key);
                return (
                  <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', fontSize: 12, borderRadius: 6, color: 'var(--text-2)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <input type="checkbox" checked={!hiddenCols.has(c.key)} onChange={() => toggleCol(c.key)} style={{ accentColor: 'var(--accent)' }} />
                    <span style={{ flex: 1 }}>{c.label}</span>
                    <button onClick={() => togglePin(c.key)} title={isPinned ? 'Unpin' : 'Pin left'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: isPinned ? 'var(--accent)' : 'var(--text-4)' }}>
                      {isPinned ? <Pin size={12} /> : <PinOff size={12} />}
                    </button>
                  </div>
                );
              })}
              <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 6, paddingTop: 6 }}>
                <button onClick={resetLayout} style={{ width: '100%', textAlign: 'left', padding: '6px 8px', fontSize: 11, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6 }}>Reset layout</button>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>{filtered.length} of {data.length}</div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              {onBulkDelete !== undefined && (
                <th style={{ width: 28 }}>
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} style={{ accentColor: 'var(--accent)' }} />
                </th>
              )}
              {canDragRows && <th style={{ width: 22 }}></th>}
              {visibleCols.map(c => {
                const w = colWidths[c.key] || c.width;
                const isPinned = pinnedKeys.includes(c.key);
                const pinStyle: React.CSSProperties = isPinned
                  ? { position: 'sticky', left: pinOffsets[c.key] ?? 0, zIndex: 3, boxShadow: '2px 0 0 0 var(--border-subtle)' }
                  : {};
                return (
                  <th
                    key={c.key}
                    draggable
                    onDragStart={e => onColDragStart(e, c.key)}
                    onDragOver={e => onColDragOver(e, c.key)}
                    onDrop={e => onColDrop(e, c.key)}
                    onDragEnd={onColDragEnd}
                    onClick={() => toggleSort(c.key)}
                    className={[draggingCol === c.key ? 'col-dragging' : '', colDropTarget === c.key ? 'col-drop-target' : ''].join(' ')}
                    style={{ cursor: draggingCol ? 'grabbing' : 'pointer', userSelect: 'none', width: w, whiteSpace: 'nowrap', position: 'relative', ...pinStyle }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {isPinned && <Pin size={10} style={{ color: 'var(--accent)' }} />}
                      {c.label}
                      {sortKey === c.key ? (sortDir === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />) : <ArrowUpDown size={10} style={{ opacity: 0.3 }} />}
                    </span>
                    <span className="col-resize-handle" onMouseDown={e => onResizeStart(e, c.key)} onClick={e => e.stopPropagation()} />
                  </th>
                );
              })}
              <th style={{ width: 30 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={visibleCols.length + (canDragRows ? 1 : 0) + (onBulkDelete !== undefined ? 1 : 0) + 1} style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                {data.length === 0 ? `No ${entityName || 'data'} yet` : 'No matches'}
              </td></tr>
            ) : filtered.map(row => {
              const isDragging = draggingRowId === row.id;
              const dropClass = dropTarget && dropTarget.id === row.id
                ? (dropTarget.pos === 'above' ? 'row-drop-above' : 'row-drop-below')
                : '';
              return (
                <tr
                  key={row.id}
                  className={[isDragging ? 'row-dragging' : '', dropClass].filter(Boolean).join(' ')}
                  onDragOver={e => onRowDragOver(e, row.id)}
                  onDrop={e => onRowDrop(e, row.id)}
                >
                  {onBulkDelete !== undefined && (
                    <td>
                      <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleOne(row.id)} style={{ accentColor: 'var(--accent)' }} />
                    </td>
                  )}
                  {canDragRows && (
                    <td>
                      <span
                        className="drag-handle"
                        draggable
                        onDragStart={e => onRowDragStart(e, row.id)}
                        onDragEnd={onRowDragEnd}
                        title="Drag to reorder"
                      >
                        <GripVertical size={13} />
                      </span>
                    </td>
                  )}
                  {visibleCols.map(c => {
                    const isPinned = pinnedKeys.includes(c.key);
                    const pinStyle: React.CSSProperties = isPinned
                      ? { position: 'sticky', left: pinOffsets[c.key] ?? 0, zIndex: 1, background: 'var(--surface)', boxShadow: '2px 0 0 0 var(--border-subtle)' }
                      : {};
                    return (
                    <td key={c.key} style={pinStyle}>
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
                    );
                  })}
                  <td>
                    <button onClick={() => onDelete(row.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.3 }} title="Delete">
                      <Trash2 size={13} color="var(--red)" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {onReorder && (sortKey || search || filterCol) && (
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8, textAlign: 'center' }}>
          Row reordering disabled while sorting or filtering. Clear filters to drag rows.
        </div>
      )}
    </div>
  );
}
