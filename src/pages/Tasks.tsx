import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  Plus, Trash2, GripVertical, X, Table as TableIcon, Columns3,
  ChevronDown, ChevronRight, Copy, Flame, Clock, AlertTriangle, Check,
} from 'lucide-react';
import EditableCell from '../components/EditableCell';
import MentionInput from '../components/MentionInput';
import { useStore } from '../store';
import { useRowDrag } from '../lib/useRowDrag';
import { fmt } from '../lib/utils';
import type { Task, TaskStatus } from '../types';

const STATUS_OPTS: { value: TaskStatus; label: string; color: string; dot: string }[] = [
  { value: 'todo',        label: 'To Do',       color: 'var(--text-2)', dot: '#8a8d98' },
  { value: 'in_progress', label: 'In Progress', color: 'var(--blue)',   dot: '#2768e8' },
  { value: 'done',        label: 'Done',        color: 'var(--green)',  dot: '#10a066' },
  { value: 'blocked',     label: 'Blocked',     color: 'var(--red)',    dot: '#d13b3b' },
];
const PRIORITY_OPTS = [
  { value: 'urgent', label: '🔴 Urgent' }, { value: 'high', label: '🟠 High' },
  { value: 'medium', label: '🟡 Medium' }, { value: 'low', label: '⚪ Low' },
];
const WEEK_OPTS = [1,2,3,4,5,6,7,8,9].map(w => ({ value: String(w), label: `Week ${w}` }));
const PRIORITY_DOT: Record<string, string> = { urgent: '#dc2626', high: '#ea580c', medium: '#ca8a04', low: '#a3a3a3' };

type View = 'table' | 'kanban';
type GroupBy = 'none' | 'status' | 'week' | 'priority' | 'category';
type Chip = 'all' | 'urgent' | 'overdue' | 'week' | 'done';

export default function Tasks() {
  const { tasks, team, update, add, remove, reorder } = useStore();
  const [view, setView] = useState<View>(() => (localStorage.getItem('tasks-view') as View) || 'table');
  const [chip, setChip] = useState<Chip>('all');
  const [groupBy, setGroupBy] = useState<GroupBy>(() => (localStorage.getItem('tasks-groupBy') as GroupBy) || 'none');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem('tasks-view', view); }, [view]);
  useEffect(() => { localStorage.setItem('tasks-groupBy', groupBy); }, [groupBy]);

  const now = new Date();
  const chipDefs: { id: Chip; label: string; icon: any; test: (t: Task) => boolean }[] = [
    { id: 'all',     label: 'All',       icon: TableIcon,     test: () => true },
    { id: 'urgent',  label: 'Urgent',    icon: Flame,         test: t => t.priority === 'urgent' && t.status !== 'done' },
    { id: 'overdue', label: 'Overdue',   icon: AlertTriangle, test: t => !!t.dueDate && new Date(t.dueDate) < now && t.status !== 'done' },
    { id: 'week',    label: 'This week', icon: Clock,         test: t => !!t.dueDate && (new Date(t.dueDate).getTime() - now.getTime()) < 7 * 86400000 && t.status !== 'done' },
    { id: 'done',    label: 'Done',      icon: Check,         test: t => t.status === 'done' },
  ];

  const filtered = useMemo(() => {
    const test = chipDefs.find(c => c.id === chip)?.test ?? (() => true);
    return tasks.filter(test);
  }, [tasks, chip]);

  // ─── Grouping ──────────────────────────────────────────
  const groups = useMemo(() => {
    if (groupBy === 'none') return [{ key: '__all__', label: '', items: filtered }];
    const map = new Map<string, Task[]>();
    for (const t of filtered) {
      let k: string;
      if (groupBy === 'status') k = STATUS_OPTS.find(s => s.value === t.status)?.label || t.status;
      else if (groupBy === 'week') k = `Week ${t.week}`;
      else if (groupBy === 'priority') k = t.priority.charAt(0).toUpperCase() + t.priority.slice(1);
      else k = t.category || '— uncategorised —';
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    }
    return Array.from(map.entries()).map(([key, items]) => ({ key, label: key, items }));
  }, [filtered, groupBy]);

  // ─── Row drag ──────────────────────────────────────────
  const canDrag = chip === 'all' && groupBy === 'none';
  const { handleProps, rowProps } = useRowDrag(
    tasks.map(t => t.id),
    (ids) => reorder('tasks', ids)
  );

  // ─── Keyboard nav ──────────────────────────────────────
  useEffect(() => {
    if (view !== 'table') return;
    const onKey = (e: KeyboardEvent) => {
      if (drawerId) return;
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) return;

      const flatIds = groups.flatMap(g => g.items.map(t => t.id));
      const idx = focusId ? flatIds.indexOf(focusId) : -1;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusId(flatIds[Math.min(flatIds.length - 1, idx + 1)] || flatIds[0] || null);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusId(flatIds[Math.max(0, idx - 1)] || flatIds[0] || null);
      } else if (e.key === 'Enter' && focusId) {
        e.preventDefault();
        setDrawerId(focusId);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd' && focusId) {
        e.preventDefault();
        const t = tasks.find(x => x.id === focusId);
        if (t) add('tasks', { ...t, title: `${t.title} (copy)`, status: 'todo', completedAt: '' });
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace' && focusId) {
        e.preventDefault();
        remove('tasks', focusId);
        setFocusId(null);
      } else if (e.key === 'Escape') {
        setFocusId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, drawerId, focusId, groups, tasks, add, remove]);

  const addTask = () => {
    add('tasks', { title: '', description: '', status: 'todo', priority: 'medium', assignees: [], dueDate: '', week: 1, category: '', completedAt: '' });
  };

  const toggleGroup = (k: string) =>
    setCollapsed(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });

  const drawerTask = drawerId ? tasks.find(t => t.id === drawerId) : null;

  return (
    <div style={{ padding: '32px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Tasks</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>
            {tasks.length} tasks · {view === 'table' ? '↑↓ to move · Enter to open · ⌘D duplicate · ⌘⌫ delete' : 'Drag cards between columns'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* View switcher */}
          <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 8, padding: 2, background: 'var(--surface)' }}>
            <button onClick={() => setView('table')} className="btn" style={{ padding: '5px 10px', fontSize: 12, background: view === 'table' ? 'var(--accent-soft)' : 'transparent', color: view === 'table' ? 'var(--accent-pressed)' : 'var(--text-2)', border: 'none' }}>
              <TableIcon size={13} /> Table
            </button>
            <button onClick={() => setView('kanban')} className="btn" style={{ padding: '5px 10px', fontSize: 12, background: view === 'kanban' ? 'var(--accent-soft)' : 'transparent', color: view === 'kanban' ? 'var(--accent-pressed)' : 'var(--text-2)', border: 'none' }}>
              <Columns3 size={13} /> Kanban
            </button>
          </div>
          <button onClick={addTask} className="btn btn-primary">
            <Plus size={14} /> Add Task
          </button>
        </div>
      </div>

      {/* Filter chips + group by */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 16 }}>
        {chipDefs.map(c => {
          const count = tasks.filter(c.test).length;
          return (
            <button key={c.id} className="chip" data-active={chip === c.id} onClick={() => setChip(c.id)}>
              <c.icon size={12} /> {c.label}
              <span className="chip-count">{count}</span>
            </button>
          );
        })}

        {view === 'table' && (
          <>
            <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />
            <label style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Group</label>
            <select className="input" value={groupBy} onChange={e => setGroupBy(e.target.value as GroupBy)} style={{ fontSize: 12, padding: '5px 10px' }}>
              <option value="none">None</option>
              <option value="status">Status</option>
              <option value="week">Week</option>
              <option value="priority">Priority</option>
              <option value="category">Category</option>
            </select>
          </>
        )}
      </div>

      {view === 'table' ? (
        <div className="card" style={{ overflow: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 22 }}></th>
                <th style={{ width: 8 }}></th>
                <th>Task</th>
                <th style={{ width: 110 }}>Status</th>
                <th style={{ width: 100 }}>Priority</th>
                <th style={{ width: 70 }}>Week</th>
                <th style={{ width: 150 }}>Assignees</th>
                <th style={{ width: 110 }}>Category</th>
                <th style={{ width: 110 }}>Due Date</th>
                <th style={{ width: 30 }}></th>
              </tr>
            </thead>
            <tbody>
              {groups.map(g => {
                const isCollapsed = collapsed.has(g.key);
                return (
                  <Fragment key={g.key}>
                    {groupBy !== 'none' && (
                      <tr className="group-row" onClick={() => toggleGroup(g.key)}>
                        <td colSpan={10}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                            {g.label}
                            <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>· {g.items.length}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                    {!isCollapsed && g.items.map(t => {
                      const extra = canDrag ? rowProps(t.id) : {};
                      const isFocus = focusId === t.id;
                      return (
                        <tr
                          key={t.id}
                          {...extra}
                          onClick={() => setFocusId(t.id)}
                          style={isFocus ? { background: 'var(--accent-soft)' } : undefined}
                        >
                          <td>
                            {canDrag && (
                              <span className="drag-handle" {...handleProps(t.id)} title="Drag to reorder">
                                <GripVertical size={13} />
                              </span>
                            )}
                          </td>
                          <td><div style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY_DOT[t.priority] }} /></td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <EditableCell value={t.title} onChange={v => update('tasks', t.id, { title: v })} placeholder="Task title" />
                              <button onClick={e => { e.stopPropagation(); setDrawerId(t.id); }} title="Open details"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 2 }}>
                                <ChevronRight size={14} />
                              </button>
                            </div>
                          </td>
                          <td><EditableCell value={t.status} onChange={v => update('tasks', t.id, { status: v, completedAt: v === 'done' ? new Date().toISOString() : '' })} type="select" options={STATUS_OPTS} /></td>
                          <td><EditableCell value={t.priority} onChange={v => update('tasks', t.id, { priority: v })} type="select" options={PRIORITY_OPTS} /></td>
                          <td><EditableCell value={String(t.week)} onChange={v => update('tasks', t.id, { week: Number(v) })} type="select" options={WEEK_OPTS} /></td>
                          <td><EditableCell value={t.assignees.join(', ')} onChange={v => update('tasks', t.id, { assignees: v.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Names" /></td>
                          <td><EditableCell value={t.category} onChange={v => update('tasks', t.id, { category: v })} placeholder="Category" /></td>
                          <td><EditableCell value={t.dueDate} onChange={v => update('tasks', t.id, { dueDate: v })} type="date" /></td>
                          <td><button onClick={e => { e.stopPropagation(); remove('tasks', t.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.3 }}><Trash2 size={13} color="var(--red)" /></button></td>
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No tasks match this filter.</div>
          )}
        </div>
      ) : (
        <Kanban tasks={filtered} team={team} onOpen={id => setDrawerId(id)} />
      )}

      {(!canDrag && view === 'table') && (
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8, textAlign: 'center' }}>
          Row reordering disabled while filters or grouping are active.
        </div>
      )}

      {drawerTask && (
        <TaskDrawer task={drawerTask} onClose={() => setDrawerId(null)} />
      )}
    </div>
  );
}

// ─── Kanban ────────────────────────────────────────────────
function Kanban({ tasks, team: _team, onOpen }: { tasks: Task[]; team: any[]; onOpen: (id: string) => void }) {
  const update = useStore(s => s.update);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropCol, setDropCol] = useState<TaskStatus | null>(null);

  return (
    <div className="kanban">
      {STATUS_OPTS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.value);
        const isDropping = dropCol === col.value;
        return (
          <div
            key={col.value}
            className={`kanban-col ${isDropping ? 'dropping' : ''}`}
            onDragOver={e => { if (dragging) { e.preventDefault(); setDropCol(col.value); } }}
            onDragLeave={() => setDropCol(d => d === col.value ? null : d)}
            onDrop={e => {
              e.preventDefault();
              if (dragging) {
                update('tasks', dragging, { status: col.value, completedAt: col.value === 'done' ? new Date().toISOString() : '' });
              }
              setDragging(null); setDropCol(null);
            }}
          >
            <div className="kanban-col-head">
              <span className="kanban-col-dot" style={{ background: col.dot }} />
              {col.label}
              <span style={{ marginLeft: 'auto', color: 'var(--text-3)', fontWeight: 500 }}>{colTasks.length}</span>
            </div>
            {colTasks.map(t => (
              <div
                key={t.id}
                className={`kanban-card ${dragging === t.id ? 'dragging' : ''}`}
                draggable
                onDragStart={e => { setDragging(t.id); e.dataTransfer.effectAllowed = 'move'; }}
                onDragEnd={() => { setDragging(null); setDropCol(null); }}
                onClick={() => onOpen(t.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY_DOT[t.priority] }} />
                  <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>W{t.week}</span>
                  {t.category && <span style={{ fontSize: 10, color: 'var(--text-3)' }}>· {t.category}</span>}
                </div>
                <div style={{ fontWeight: 500, lineHeight: 1.35 }}>{t.title || <span style={{ color: 'var(--text-3)' }}>Untitled</span>}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11, color: 'var(--text-3)' }}>
                  {t.assignees.slice(0, 3).map(a => (
                    <span key={a} className="mention-avatar" style={{ width: 18, height: 18, fontSize: 9 }}>{a[0]}</span>
                  ))}
                  {t.assignees.length > 3 && <span>+{t.assignees.length - 3}</span>}
                  {t.dueDate && <span style={{ marginLeft: 'auto' }}>Due {fmt(t.dueDate)}</span>}
                </div>
              </div>
            ))}
            {colTasks.length === 0 && <div style={{ fontSize: 11, color: 'var(--text-4)', padding: '12px 6px', textAlign: 'center' }}>No tasks</div>}
          </div>
        );
      })}
    </div>
  );
}

// ─── Drawer ────────────────────────────────────────────────
function TaskDrawer({ task, onClose }: { task: Task; onClose: () => void }) {
  const update = useStore(s => s.update);
  const remove = useStore(s => s.remove);
  const add = useStore(s => s.add);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const duplicate = () => {
    add('tasks', { ...task, title: `${task.title} (copy)`, status: 'todo', completedAt: '' });
    onClose();
  };

  const set = (updates: Partial<Task>) => update('tasks', task.id, updates);

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="drawer">
        <div className="drawer-header">
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', fontWeight: 600 }}>Task · Week {task.week}</div>
            <div style={{ fontSize: 17, fontWeight: 650, marginTop: 2 }}>{task.title || 'Untitled task'}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={duplicate} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: 12 }}><Copy size={13} /> Duplicate</button>
            <button onClick={() => { remove('tasks', task.id); onClose(); }} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: 12, color: 'var(--red)' }}><Trash2 size={13} /> Delete</button>
            <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px 10px' }}><X size={14} /></button>
          </div>
        </div>
        <div className="drawer-body">
          <div className="drawer-field">
            <label>Title</label>
            <input className="input" style={{ width: '100%', fontSize: 14 }} value={task.title} onChange={e => set({ title: e.target.value })} placeholder="Task title" />
          </div>

          <div className="drawer-field">
            <label>Description (type @ to mention)</label>
            <MentionInput value={task.description} onChange={v => set({ description: v })} placeholder="Add context, links, decisions..." rows={4} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="drawer-field">
              <label>Status</label>
              <select className="input" style={{ width: '100%' }} value={task.status} onChange={e => set({ status: e.target.value as TaskStatus, completedAt: e.target.value === 'done' ? new Date().toISOString() : '' })}>
                {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="drawer-field">
              <label>Priority</label>
              <select className="input" style={{ width: '100%' }} value={task.priority} onChange={e => set({ priority: e.target.value as Task['priority'] })}>
                {PRIORITY_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="drawer-field">
              <label>Week</label>
              <select className="input" style={{ width: '100%' }} value={String(task.week)} onChange={e => set({ week: Number(e.target.value) })}>
                {WEEK_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="drawer-field">
              <label>Due date</label>
              <input className="input" type="date" style={{ width: '100%' }} value={task.dueDate} onChange={e => set({ dueDate: e.target.value })} />
            </div>
            <div className="drawer-field" style={{ gridColumn: '1 / -1' }}>
              <label>Category</label>
              <input className="input" style={{ width: '100%' }} value={task.category} onChange={e => set({ category: e.target.value })} placeholder="e.g. Outreach, Events" />
            </div>
            <div className="drawer-field" style={{ gridColumn: '1 / -1' }}>
              <label>Assignees (comma-separated)</label>
              <input className="input" style={{ width: '100%' }} value={task.assignees.join(', ')} onChange={e => set({ assignees: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="e.g. Taslim, Isbah" />
            </div>
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 'auto', paddingTop: 12 }}>
            Created {fmt(task.createdAt)}{task.completedAt && ` · Completed ${fmt(task.completedAt)}`}
          </div>
        </div>
      </aside>
    </>
  );
}
