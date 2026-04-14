import { useState } from 'react';
import { Plus, Trash2, Filter } from 'lucide-react';
import EditableCell from '../components/EditableCell';
import { useStore } from '../store';

const STATUS_OPTS = [
  { value: 'todo', label: 'To Do' }, { value: 'in_progress', label: 'In Progress' }, { value: 'done', label: 'Done' }, { value: 'blocked', label: 'Blocked' },
];
const PRIORITY_OPTS = [
  { value: 'urgent', label: '🔴 Urgent' }, { value: 'high', label: '🟠 High' }, { value: 'medium', label: '🟡 Medium' }, { value: 'low', label: '⚪ Low' },
];
const WEEK_OPTS = [1,2,3,4,5,6,7,8,9].map(w => ({ value: String(w), label: `Week ${w}` }));
const PRIORITY_DOT: Record<string, string> = { urgent: '#dc2626', high: '#ea580c', medium: '#ca8a04', low: '#a3a3a3' };
const STATUS_BG: Record<string, { bg: string; text: string }> = {
  todo: { bg: '#e8eaed', text: '#525252' }, in_progress: { bg: '#dbeafe', text: '#1d4ed8' },
  done: { bg: '#dcfce7', text: '#166534' }, blocked: { bg: '#fef2f2', text: '#dc2626' },
};

export default function Tasks() {
  const { tasks, update, add, remove, team } = useStore();
  const [statusFilter, setStatusFilter] = useState('all');
  const [weekFilter, setWeekFilter] = useState('all');

  const filtered = tasks.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (weekFilter !== 'all' && String(t.week) !== weekFilter) return false;
    return true;
  });

  const addTask = () => {
    add('tasks', { title: '', description: '', status: 'todo', priority: 'medium', assignees: [], dueDate: '', week: 1, category: '', completedAt: '' });
  };

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Tasks</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 2 }}>{tasks.length} tasks — edit any cell</p>
        </div>
        <button onClick={addTask} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: 'none', borderRadius: 6, background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={14} /> Add Task
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, background: 'var(--bg)' }}>
          <option value="all">All statuses</option>
          {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={weekFilter} onChange={e => setWeekFilter(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, background: 'var(--bg)' }}>
          <option value="all">All weeks</option>
          {WEEK_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 8 }}></th>
              <th>Task</th>
              <th style={{ width: 100 }}>Status</th>
              <th style={{ width: 90 }}>Priority</th>
              <th style={{ width: 60 }}>Week</th>
              <th style={{ width: 140 }}>Assignees</th>
              <th style={{ width: 90 }}>Category</th>
              <th style={{ width: 100 }}>Due Date</th>
              <th style={{ width: 30 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => {
              const sb = STATUS_BG[t.status];
              return (
                <tr key={t.id}>
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
