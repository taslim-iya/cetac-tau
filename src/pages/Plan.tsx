import { useState } from 'react';
import { useStore } from '../store';
import { CheckCircle2, Circle, Clock, AlertTriangle, List, CalendarDays, Pencil } from 'lucide-react';
import EditableCell from '../components/EditableCell';

const PRIORITY_DOT = { urgent: '#dc2626', high: '#ea580c', medium: '#ca8a04', low: '#a3a3a3' };
const STATUS_ICON = { todo: Circle, in_progress: Clock, done: CheckCircle2, blocked: AlertTriangle };

export default function Plan() {
  const { tasks, events, update } = useStore();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [editingTask, setEditingTask] = useState<string | null>(null);

  const weeks = [1,2,3,4,5,6,7,8,9];

  const toggleTask = (t: any) => {
    const next = t.status === 'done' ? 'todo' : 'done';
    update('tasks', t.id, { status: next, completedAt: next === 'done' ? new Date().toISOString() : '' });
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>9-Week Execution Plan</h1>
          <p>CETAC 2025-2026 &middot; Click tasks to complete, pencil to edit</p>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-2)', borderRadius: 4, padding: 2 }}>
          <button onClick={() => setView('list')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', border: 'none', borderRadius: 3, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: view === 'list' ? 'var(--accent)' : 'transparent', color: view === 'list' ? 'white' : 'var(--text-2)', fontFamily: 'var(--sans)' }}>
            <List size={13} /> List
          </button>
          <button onClick={() => setView('calendar')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', border: 'none', borderRadius: 3, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: view === 'calendar' ? 'var(--accent)' : 'transparent', color: view === 'calendar' ? 'white' : 'var(--text-2)', fontFamily: 'var(--sans)' }}>
            <CalendarDays size={13} /> Calendar
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, minmax(120px, 1fr))', gap: 8 }}>
            {weeks.map(w => {
              const wTasks = tasks.filter(t => t.week === w);
              const wEvent = events.find(e => e.week === w);
              const done = wTasks.filter(t => t.status === 'done').length;
              return (
                <div key={w} className="card card-accent" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 12px', background: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--sans)' }}>Week {w}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{done}/{wTasks.length} done</div>
                  </div>
                  {wEvent && (
                    <div style={{ padding: '6px 10px', fontSize: 10, fontWeight: 600, color: 'var(--gold)', background: 'var(--gold-light)', borderBottom: '1px solid var(--border-subtle)' }}>
                      {wEvent.name}
                    </div>
                  )}
                  <div style={{ padding: '4px 0', maxHeight: 240, overflow: 'auto' }}>
                    {wTasks.map(t => (
                      <div key={t.id} onClick={() => toggleTask(t)} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 11, lineHeight: 1.4 }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: PRIORITY_DOT[t.priority], flexShrink: 0, marginTop: 4 }} />
                        <span style={{ color: t.status === 'done' ? 'var(--text-3)' : 'var(--text)', textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>
                          {t.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {weeks.map(w => {
            const wTasks = tasks.filter(t => t.week === w);
            const wEvent = events.find(e => e.week === w);
            const done = wTasks.filter(t => t.status === 'done').length;
            const pct = wTasks.length ? Math.round((done / wTasks.length) * 100) : 0;

            return (
              <div key={w} className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', background: 'var(--bg-2)', borderBottom: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'white', background: 'var(--accent)', padding: '3px 10px', borderRadius: 3, fontFamily: 'var(--sans)' }}>Week {w}</span>
                    {wEvent && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--serif)' }}>{wEvent.name}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 80, height: 4, background: 'var(--bg-3)', borderRadius: 2 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? 'var(--green)' : 'var(--accent)', borderRadius: 2, transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{done}/{wTasks.length}</span>
                  </div>
                </div>

                {wEvent && wEvent.description && (
                  <div style={{ padding: '8px 18px', fontSize: 12, color: 'var(--text-2)', borderBottom: '1px solid var(--border-subtle)' }}>
                    {wEvent.format && <span style={{ fontWeight: 600, color: 'var(--gold)', marginRight: 8 }}>{wEvent.format}</span>}
                    {wEvent.description}
                  </div>
                )}

                <div style={{ padding: '4px 0' }}>
                  {wTasks.map(t => {
                    const Icon = STATUS_ICON[t.status];
                    const isEditing = editingTask === t.id;
                    return (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 18px', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY_DOT[t.priority], flexShrink: 0 }} />
                        <div style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => toggleTask(t)}>
                          <Icon size={15} color={t.status === 'done' ? 'var(--green)' : 'var(--text-3)'} />
                        </div>
                        {isEditing ? (
                          <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
                            <EditableCell value={t.title} onChange={v => update('tasks', t.id, { title: v })} placeholder="Task title" />
                            <EditableCell value={t.assignees.join(', ')} onChange={v => update('tasks', t.id, { assignees: v.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Assignees" />
                            <button onClick={() => setEditingTask(null)} style={{ background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 3, padding: '3px 8px', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Done</button>
                          </div>
                        ) : (
                          <>
                            <span onClick={() => toggleTask(t)} style={{ fontSize: 13, color: t.status === 'done' ? 'var(--text-3)' : 'var(--text)', textDecoration: t.status === 'done' ? 'line-through' : 'none', flex: 1, cursor: 'pointer' }}>
                              {t.title}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.assignees.join(', ')}</span>
                            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: 'var(--bg-3)', color: 'var(--text-3)', fontWeight: 500 }}>{t.category}</span>
                            <button onClick={() => setEditingTask(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.3, padding: 2 }} title="Edit">
                              <Pencil size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                  {wTasks.length === 0 && (
                    <div style={{ padding: '12px 18px', fontSize: 12, color: 'var(--text-3)' }}>No tasks for this week</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
