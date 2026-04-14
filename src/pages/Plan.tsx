import { useStore } from '../store';
import { CheckCircle2, Circle, Clock, AlertTriangle } from 'lucide-react';

const PRIORITY_DOT = { urgent: '#dc2626', high: '#ea580c', medium: '#ca8a04', low: '#a3a3a3' };
const STATUS_ICON = { todo: Circle, in_progress: Clock, done: CheckCircle2, blocked: AlertTriangle };

export default function Plan() {
  const { tasks, events, update } = useStore();

  const weeks = [1,2,3,4,5,6,7,8,9];

  const toggleTask = (t: any) => {
    const next = t.status === 'done' ? 'todo' : 'done';
    update('tasks', t.id, { status: next, completedAt: next === 'done' ? new Date().toISOString() : '' });
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>9-Week Execution Plan</h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 2 }}>CETAC 2025–2026 · Click tasks to mark complete</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {weeks.map(w => {
          const wTasks = tasks.filter(t => t.week === w);
          const wEvent = events.find(e => e.week === w);
          const done = wTasks.filter(t => t.status === 'done').length;
          const pct = wTasks.length ? Math.round((done / wTasks.length) * 100) : 0;

          return (
            <div key={w} style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              {/* Week header */}
              <div style={{ padding: '14px 18px', background: 'var(--bg-2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-light)', padding: '2px 10px', borderRadius: 12 }}>Week {w}</span>
                  {wEvent && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{wEvent.name}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 80, height: 4, background: 'var(--bg-3)', borderRadius: 2 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? 'var(--green)' : 'var(--accent)', borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{done}/{wTasks.length}</span>
                </div>
              </div>

              {/* Event description */}
              {wEvent && wEvent.description && (
                <div style={{ padding: '8px 18px', fontSize: 12, color: 'var(--text-2)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg)' }}>
                  {wEvent.format && <span style={{ fontWeight: 600, color: 'var(--accent)', marginRight: 8 }}>{wEvent.format}</span>}
                  {wEvent.description}
                </div>
              )}

              {/* Tasks */}
              <div style={{ padding: '4px 0' }}>
                {wTasks.map(t => {
                  const Icon = STATUS_ICON[t.status];
                  return (
                    <div key={t.id} onClick={() => toggleTask(t)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY_DOT[t.priority], flexShrink: 0 }} />
                      <Icon size={15} color={t.status === 'done' ? 'var(--green)' : 'var(--text-3)'} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: t.status === 'done' ? 'var(--text-3)' : 'var(--text)', textDecoration: t.status === 'done' ? 'line-through' : 'none', flex: 1 }}>
                        {t.title}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.assignees.join(', ')}</span>
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: 'var(--bg-3)', color: 'var(--text-3)', fontWeight: 500 }}>{t.category}</span>
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
    </div>
  );
}
