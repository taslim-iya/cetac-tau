import { CheckSquare, Users, Calendar, Handshake, Target, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';

export default function Dashboard() {
  const { tasks, team, events, partnerships, contacts, content, outreach } = useStore();
  const todo = tasks.filter(t => t.status === 'todo').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const done = tasks.filter(t => t.status === 'done').length;
  const urgent = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length;
  const activeTeam = team.filter(t => t.status === 'active').length;
  const now = new Date();

  // Overdue tasks
  const overdue = tasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < now);

  // Cold partnerships (no contact 14+ days)
  const cold = partnerships.filter(p => {
    if (p.status === 'active') return false;
    if (!p.lastContactDate) return true;
    return (now.getTime() - new Date(p.lastContactDate).getTime()) > 14 * 86400000;
  });

  // Search Day countdown
  const searchDayEvent = events.find(e => e.week === 8);
  const searchDayDate = searchDayEvent?.date ? new Date(searchDayEvent.date) : null;
  const daysUntilSearchDay = searchDayDate ? Math.ceil((searchDayDate.getTime() - now.getTime()) / 86400000) : null;

  // Stats
  const stats = [
    { label: 'To Do', value: todo, icon: CheckSquare, color: '#5E6AD2', link: '/tasks' },
    { label: 'In Progress', value: inProgress, icon: Clock, color: '#ea580c', link: '/tasks' },
    { label: 'Done', value: done, icon: CheckSquare, color: '#16a34a', link: '/tasks' },
    { label: 'Team', value: activeTeam, icon: Users, color: '#2563eb', link: '/team' },
    { label: 'Events', value: events.length, icon: Calendar, color: '#7c3aed', link: '/events' },
    { label: 'Contacts', value: contacts.length, icon: Users, color: '#ca8a04', link: '/crm' },
  ];

  // Burn-down by week
  const weekData = [1,2,3,4,5,6,7,8,9].map(w => {
    const wt = tasks.filter(t => t.week === w);
    return { week: w, total: wt.length, done: wt.filter(t => t.status === 'done').length };
  });
  const maxTasks = Math.max(...weekData.map(w => w.total), 1);

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>CETAC Dashboard</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 2 }}>Cambridge ETA & Acquisition Club</p>
        </div>
        {daysUntilSearchDay !== null && daysUntilSearchDay > 0 && (
          <div style={{ textAlign: 'right', padding: '10px 16px', background: 'var(--accent-light)', borderRadius: 8, border: '1px solid rgba(94,106,210,0.15)' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>{daysUntilSearchDay}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Days to Search Day</div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 24 }}>
        {stats.map(s => (
          <Link key={s.label} to={s.link} style={{ textDecoration: 'none', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 12px', transition: 'border-color 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = s.color} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <s.icon size={15} color={s.color} style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.label}</div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Burn-down chart */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <TrendingUp size={15} color="var(--accent)" />
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>9-Week Progress</h3>
          </div>
          <svg width="100%" height="160" viewBox="0 0 360 160">
            {weekData.map((w, i) => {
              const x = i * 40 + 8;
              const totalH = (w.total / maxTasks) * 120;
              const doneH = (w.done / maxTasks) * 120;
              return (
                <g key={w.week}>
                  {/* Total bar */}
                  <rect x={x} y={140 - totalH} width={28} height={totalH} rx={3} fill="var(--bg-3)" />
                  {/* Done bar */}
                  <rect x={x} y={140 - doneH} width={28} height={doneH} rx={3} fill="var(--accent)" opacity={0.8} />
                  {/* Label */}
                  <text x={x + 14} y={155} textAnchor="middle" style={{ fontSize: 10, fill: 'var(--text-3)' }}>W{w.week}</text>
                  {/* Count */}
                  <text x={x + 14} y={140 - totalH - 4} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--text-3)' }}>{w.done}/{w.total}</text>
                </g>
              );
            })}
          </svg>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-3)' }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent)' }} /> Done
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-3)' }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--bg-3)' }} /> Total
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Overdue */}
          {overdue.length > 0 && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 14, borderLeft: '3px solid var(--red)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <AlertTriangle size={14} color="var(--red)" />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)' }}>Overdue Tasks ({overdue.length})</span>
              </div>
              {overdue.slice(0, 4).map(t => (
                <div key={t.id} style={{ fontSize: 12, color: 'var(--text-2)', padding: '3px 0' }}>• {t.title}</div>
              ))}
            </div>
          )}

          {/* Cold partnerships */}
          {cold.length > 0 && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 14, borderLeft: '3px solid var(--yellow)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Handshake size={14} color="var(--yellow)" />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--yellow)' }}>Going Cold ({cold.length})</span>
              </div>
              {cold.slice(0, 4).map(p => (
                <div key={p.id} style={{ fontSize: 12, color: 'var(--text-2)', padding: '3px 0' }}>• {p.name} — {p.nextAction || 'No action set'}</div>
              ))}
            </div>
          )}

          {/* Urgent */}
          {urgent > 0 && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 14, borderLeft: '3px solid var(--orange)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <AlertTriangle size={14} color="var(--orange)" />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--orange)' }}>Urgent Tasks ({urgent})</span>
              </div>
              {tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').slice(0, 4).map(t => (
                <div key={t.id} style={{ fontSize: 12, color: 'var(--text-2)', padding: '3px 0' }}>• {t.title}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Vacant roles */}
      <div style={{ padding: '12px 16px', background: 'var(--yellow-light)', border: '1px solid rgba(202,138,4,0.15)', borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <AlertTriangle size={14} color="var(--yellow)" style={{ marginTop: 2, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--yellow)' }}>11 Vacant Roles</div>
          <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>
            <Link to="/roles" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>View & assign roles →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
