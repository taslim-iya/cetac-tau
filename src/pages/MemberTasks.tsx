import { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, Clock } from 'lucide-react';
import { useStore } from '../store';
import EditableCell from '../components/EditableCell';
import type { MemberTask } from '../types';

const TYPE_OPTS = [{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'one-off', label: 'One-off' }];
const STATUS_OPTS = [{ value: 'pending', label: 'Pending' }, { value: 'in-progress', label: 'In Progress' }, { value: 'done', label: 'Done' }];
const STATUS_ICON = { pending: Circle, 'in-progress': Clock, done: CheckCircle2 };
const STATUS_COLOR = { pending: 'var(--text-3)', 'in-progress': 'var(--yellow)', done: 'var(--green)' };
const TYPE_COLOR: Record<string, string> = { daily: 'var(--blue)', weekly: 'var(--gold)', 'one-off': 'var(--text-3)' };
const TYPE_BG: Record<string, string> = { daily: 'var(--blue-light)', weekly: 'var(--gold-light)', 'one-off': 'var(--bg-3)' };

export default function MemberTasks() {
  const { team, memberTasks, addMemberTask, updateMemberTask, removeMemberTask } = useStore();
  const [selectedMember, setSelectedMember] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', assigneeId: '', assigneeName: '', type: 'one-off' as MemberTask['type'], dueDate: '' });

  const activeMembers = team.filter(m => (!m.status || m.status === 'active'));
  const filtered = selectedMember === 'all' ? memberTasks : memberTasks.filter(t => t.assigneeName === selectedMember);

  const handleAdd = () => {
    if (!newTask.title || !newTask.assigneeName) return;
    const member = activeMembers.find(m => m.name === newTask.assigneeName);
    addMemberTask({ ...newTask, assigneeId: member?.id || '', status: 'pending' });
    setNewTask({ title: '', description: '', assigneeId: '', assigneeName: '', type: 'one-off', dueDate: '' });
    setShowAdd(false);
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Member Tasks</h1>
          <p>Daily, weekly, and one-off tasks per team member</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary">
          <Plus size={14} /> Assign Task
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="card" style={{ padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>Title</label>
              <input value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} placeholder="Task title"
                style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13, outline: 'none', background: 'var(--bg)', color: 'var(--text)' }} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>Assign To</label>
              <select value={newTask.assigneeName} onChange={e => setNewTask(p => ({ ...p, assigneeName: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13, background: 'var(--bg)', color: 'var(--text)' }}>
                <option value="">Select member...</option>
                {activeMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>Type</label>
              <select value={newTask.type} onChange={e => setNewTask(p => ({ ...p, type: e.target.value as any }))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13, background: 'var(--bg)', color: 'var(--text)' }}>
                {TYPE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>Due Date</label>
              <input type="date" value={newTask.dueDate} onChange={e => setNewTask(p => ({ ...p, dueDate: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13, background: 'var(--bg)', color: 'var(--text)' }} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>Description</label>
            <textarea value={newTask.description} onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))} placeholder="Optional details..."
              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13, outline: 'none', background: 'var(--bg)', color: 'var(--text)', minHeight: 60, resize: 'vertical', fontFamily: 'var(--sans)' }} />
          </div>
          <button onClick={handleAdd} className="btn-primary">Add Task</button>
        </div>
      )}

      {/* Filter by member */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => setSelectedMember('all')} style={{ padding: '5px 12px', border: '1px solid var(--border)', borderRadius: 3, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: selectedMember === 'all' ? 'var(--accent)' : 'var(--bg)', color: selectedMember === 'all' ? 'white' : 'var(--text-2)', fontFamily: 'var(--sans)' }}>
          All ({memberTasks.length})
        </button>
        {activeMembers.map(m => {
          const count = memberTasks.filter(t => t.assigneeName === m.name).length;
          return (
            <button key={m.id} onClick={() => setSelectedMember(m.name)} style={{ padding: '5px 12px', border: '1px solid var(--border)', borderRadius: 3, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: selectedMember === m.name ? 'var(--accent)' : 'var(--bg)', color: selectedMember === m.name ? 'white' : 'var(--text-2)', fontFamily: 'var(--sans)' }}>
              {m.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No tasks yet. Click "Assign Task" to create one.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(t => {
            const Icon = STATUS_ICON[t.status];
            return (
              <div key={t.id} className="card" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ cursor: 'pointer' }} onClick={() => updateMemberTask(t.id, { status: t.status === 'done' ? 'pending' : t.status === 'pending' ? 'in-progress' : 'done' })}>
                  <Icon size={16} color={STATUS_COLOR[t.status]} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.status === 'done' ? 'var(--text-3)' : 'var(--text)', textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</div>
                  {t.description && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{t.description}</div>}
                </div>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 3, background: TYPE_BG[t.type], color: TYPE_COLOR[t.type], fontWeight: 600, whiteSpace: 'nowrap' }}>{t.type}</span>
                <span style={{ fontSize: 11, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{t.assigneeName}</span>
                {t.dueDate && <span style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{t.dueDate}</span>}
                <EditableCell value={t.status} onChange={v => updateMemberTask(t.id, { status: v as any })} type="select" options={STATUS_OPTS} />
                <button onClick={() => removeMemberTask(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.3, padding: 2 }}>
                  <Trash2 size={13} color="var(--red)" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
