import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import EditableCell from '../components/EditableCell';
import { useStore } from '../store';
import { useRowDrag } from '../lib/useRowDrag';

const STATUS_OPTS = [
  { value: 'todo', label: 'To Do' }, { value: 'in_progress', label: 'In Progress' }, { value: 'done', label: 'Done' }, { value: 'blocked', label: 'Blocked' },
];
const PRIORITY_OPTS = [
  { value: 'urgent', label: '🔴 Urgent' }, { value: 'high', label: '🟠 High' }, { value: 'medium', label: '🟡 Medium' }, { value: 'low', label: '⚪ Low' },
];
const WEEK_OPTS = [1,2,3,4,5,6,7,8,9].map(w => ({ value: String(w), label: `Week ${w}` }));
const PRIORITY_DOT: Record<string, string> = { urgent: '#dc2626', high: '#ea580c', medium: '#ca8a04', low: '#a3a3a3' };

export default function Tasks() {
  const { tasks, update, add, remove, reorder } = useStore();
  const [statusFilter, setStatusFilter] = useState('all');
  const [weekFilter, setWeekFilter] = useState('all');

  const filtered = tasks.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (weekFilter !== 'all' && String(t.week) !== weekFilter) return false;
    return true;
  });

  const isFiltered = statusFilter !== 'all' || weekFilter !== 'all';
  const { handleProps, rowProps } = useRowDrag(
    tasks.map(t => t.id),
    (ids) => reorder('tasks', ids)
  );

  const addTask = () => {
    add('tasks', { title: '', description: '', status: 'todo', priority: 'medium', assignees: [], dueDate: '', week: 1, category: '', completedAt: '' });
  };

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Tasks</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>{tasks.length} tasks · edit any cell · drag to reorder</p>
        </div>
        <button onClick={addTask} className="btn btn-primary">
          <Plus size={14} /> Add Task
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ fontSize: 12, padding: '7px 12px' }}>
          <option value="all">All statuses</option>
          {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="input" value={weekFilter} onChange={e => setWeekFilter(e.target.value)} style={{ fontSize: 12, padding: '7px 12px' }}>
          <option value="all">All weeks</option>
          {WEEK_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

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
            {filtered.map(t => (
              <tr key={t.id} {...(isFiltered ? {} : rowProps(t.id))}>
                <td>
                  {!isFiltered && (
                    <span className="drag-handle" {...handleProps(t.id)} title="Drag to reorder">
                      <GripVertical size={13} />
                    </span>
                  )}
                </td>
                <td><div style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY_DOT[t.priority] }} /></td>
                <td><EditableCell value={t.title} onChange={v => update('tasks', t.id, { title: v })} placeholder="Task title" /></td>
                <td><EditableCell value={t.status} onChange={v => update('tasks', t.id, { status: v, completedAt: v === 'done' ? new Date().toISOString() : '' })} type="select" options={STATUS_OPTS} /></td>
                <td><EditableCell value={t.priority} onChange={v => update('tasks', t.id, { priority: v })} type="select" options={PRIORITY_OPTS} /></td>
                <td><EditableCell value={String(t.week)} onChange={v => update('tasks', t.id, { week: Number(v) })} type="select" options={WEEK_OPTS} /></td>
                <td><EditableCell value={t.assignees.join(', ')} onChange={v => update('tasks', t.id, { assignees: v.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Names" /></td>
                <td><EditableCell value={t.category} onChange={v => update('tasks', t.id, { category: v })} placeholder="Category" /></td>
                <td><EditableCell value={t.dueDate} onChange={v => update('tasks', t.id, { dueDate: v })} type="date" /></td>
                <td><button onClick={() => remove('tasks', t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.3 }}><Trash2 size={13} color="var(--red)" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isFiltered && (
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8, textAlign: 'center' }}>
          Row reordering disabled while filters are active. Clear filters to drag rows.
        </div>
      )}
    </div>
  );
}
