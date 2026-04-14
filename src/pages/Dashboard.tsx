import { CheckSquare, Users, Calendar, Handshake, Target, BookOpen, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';

export default function Dashboard() {
  const { tasks, team, events, partnerships, content } = useStore();
  const todo = tasks.filter(t => t.status === 'todo').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const done = tasks.filter(t => t.status === 'done').length;
  const urgent = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length;
  const activeTeam = team.filter(t => t.status === 'active').length;
  const confirmedEvents = events.filter(e => e.status === 'confirmed').length;
  const activePartnerships = partnerships.filter(p => p.status === 'active' || p.status === 'agreed').length;

  const stats = [
    { label: 'Tasks To Do', value: todo, icon: CheckSquare, color: '#5E6AD2', link: '/tasks' },
    { label: 'In Progress', value: inProgress, icon: Target, color: '#ea580c', link: '/tasks' },
    { label: 'Completed', value: done, icon: CheckSquare, color: '#16a34a', link: '/tasks' },
    { label: 'Team Members', value: activeTeam, icon: Users, color: '#2563eb', link: '/team' },
    { label: 'Events Planned', value: events.length, icon: Calendar, color: '#7c3aed', link: '/events' },
    { label: 'Partnerships', value: partnerships.length, icon: Handshake, color: '#ca8a04', link: '/partnerships' },
  ];

  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').slice(0, 6);
  const weekTasks = (w: number) => tasks.filter(t => t.week === w);
  const currentWeek = 1; // Could be calculated from dates

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>CETAC Dashboard</h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 2 }}>Cambridge ETA & Acquisition Club — 9-Week Execution Plan</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 28 }}>
        {stats.map(s => (
          <Link key={s.label} to={s.link} style={{ textDecoration: 'none', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 14px', transition: 'border-color 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = s.color} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <s.icon size={16} color={s.color} style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Urgent tasks */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <AlertTriangle size={15} color="var(--red)" />
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>Urgent Tasks ({urgent})</h3>
          </div>
          {urgentTasks.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-3)', padding: '12px 0' }}>No urgent tasks — nice work</div>
          ) : (
            urgentTasks.map(t => (
              <div key={t.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Week {t.week} · {t.assignees.join(', ')}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Week overview */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>9-Week Progress</h3>
          {[1,2,3,4,5,6,7,8,9].map(w => {
            const wTasks = weekTasks(w);
            const wDone = wTasks.filter(t => t.status === 'done').length;
            const wEvent = events.find(e => e.week === w);
            const pct = wTasks.length ? Math.round((wDone / wTasks.length) * 100) : 0;
            return (
              <div key={w} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
                <span style={{ width: 52, fontSize: 11, fontWeight: 600, color: w === currentWeek ? 'var(--accent)' : 'var(--text-3)' }}>Week {w}</span>
                <div style={{ flex: 1, height: 6, background: 'var(--bg-3)', borderRadius: 3 }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: 3, transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-3)', width: 36, textAlign: 'right' }}>{wDone}/{wTasks.length}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vacant roles alert */}
      <div style={{ marginTop: 16, padding: '14px 18px', background: 'var(--yellow-light)', border: '1px solid #fde68a', borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <AlertTriangle size={16} color="var(--yellow)" style={{ marginTop: 1, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>Vacant Roles — Critical Gap</div>
          <div style={{ fontSize: 12, color: '#a16207', marginTop: 2 }}>
            Event Manager (Internal) · Event Manager (External) · Partnerships Lead (Business Schools) · Marketing Officer (External) · Alumni Relations Lead · Content & Case Studies Lead · Searchfunder & Community Lead · Co-Founder Networking Lead · Website & Digital Lead · Database & Research Manager · Treasurer/Admin Lead
          </div>
        </div>
      </div>
    </div>
  );
}
