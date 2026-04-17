import { CheckSquare, Users, Calendar, Handshake, AlertTriangle, Clock, TrendingUp, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';

export default function Dashboard() {
  const { tasks, team, events, partnerships, contacts } = useStore();
  const todo = tasks.filter(t => t.status === 'todo').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const done = tasks.filter(t => t.status === 'done').length;
  const urgent = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length;
  const activeTeam = team.filter(t => t.status === 'active').length;
  const now = new Date();

  const overdue = tasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < now);

  const cold = partnerships.filter(p => {
    if (p.status === 'active') return false;
    if (!p.lastContactDate) return true;
    return (now.getTime() - new Date(p.lastContactDate).getTime()) > 14 * 86400000;
  });

  const searchDayEvent = events.find(e => e.week === 8);
  const searchDayDate = searchDayEvent?.date ? new Date(searchDayEvent.date) : null;
  const daysUntilSearchDay = searchDayDate ? Math.ceil((searchDayDate.getTime() - now.getTime()) / 86400000) : null;

  const totalTasks = tasks.length || 1;
  const pctDone = Math.round((done / totalTasks) * 100);

  const stats = [
    { label: 'To Do',       value: todo,         icon: CheckSquare, tint: 'var(--accent)',  link: '/tasks' },
    { label: 'In Progress', value: inProgress,   icon: Clock,       tint: 'var(--orange)',  link: '/tasks' },
    { label: 'Done',        value: done,         icon: CheckSquare, tint: 'var(--green)',   link: '/tasks' },
    { label: 'Team',        value: activeTeam,   icon: Users,       tint: 'var(--blue)',    link: '/team' },
    { label: 'Events',      value: events.length,icon: Calendar,    tint: '#7c5cd8',        link: '/events' },
    { label: 'Contacts',    value: contacts.length, icon: Users,    tint: 'var(--yellow)',  link: '/crm' },
  ];

  const weekData = [1,2,3,4,5,6,7,8,9].map(w => {
    const wt = tasks.filter(t => t.week === w);
    return { week: w, total: wt.length, done: wt.filter(t => t.status === 'done').length };
  });
  const maxTasks = Math.max(...weekData.map(w => w.total), 1);

  return (
    <div style={{ padding: '36px 44px', maxWidth: 1180, margin: '0 auto' }}>
      {/* Hero */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, marginBottom: 28 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 999, background: 'var(--accent-soft)', color: 'var(--accent-pressed)', fontSize: 11, fontWeight: 600, marginBottom: 10, border: '1px solid var(--accent-ring)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
            9-Week Term · {pctDone}% complete
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1 }}>CETAC Dashboard</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 6 }}>Cambridge ETA &amp; Acquisition Club — execution at a glance.</p>
        </div>
        {daysUntilSearchDay !== null && daysUntilSearchDay > 0 && (
          <div className="hero-pill" style={{ minWidth: 180, textAlign: 'right' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.85 }}>Search Day</div>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.05, marginTop: 2 }}>{daysUntilSearchDay}<span style={{ fontSize: 14, fontWeight: 600, opacity: 0.85, marginLeft: 4 }}>days</span></div>
            <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>until flagship event</div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
        {stats.map(s => (
          <Link key={s.label} to={s.link} className="stat-tile">
            <div className="stat-icon" style={{ background: `color-mix(in srgb, ${s.tint} 14%, transparent)`, color: s.tint }}>
              <s.icon size={15} strokeWidth={2} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
              <ArrowUpRight size={14} color="var(--text-4)" />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6, fontWeight: 500 }}>{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Burn-down chart */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--brand-gradient-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={14} color="var(--accent)" strokeWidth={2} />
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 650 }}>9-Week Progress</h3>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>{done} of {totalTasks} tasks done</div>
          </div>
          <svg width="100%" height="180" viewBox="0 0 400 180" preserveAspectRatio="none">
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.95" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.55" />
              </linearGradient>
            </defs>
            {weekData.map((w, i) => {
              const x = i * 42 + 12;
              const totalH = (w.total / maxTasks) * 130;
              const doneH = (w.done / maxTasks) * 130;
              return (
                <g key={w.week}>
                  <rect x={x} y={150 - totalH} width={30} height={totalH} rx={4} fill="var(--bg-3)" />
                  <rect x={x} y={150 - doneH} width={30} height={doneH} rx={4} fill="url(#barGradient)" />
                  <text x={x + 15} y={168} textAnchor="middle" style={{ fontSize: 10, fill: 'var(--text-3)', fontWeight: 500 }}>W{w.week}</text>
                  <text x={x + 15} y={150 - totalH - 6} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--text-3)' }}>{w.done}/{w.total}</text>
                </g>
              );
            })}
          </svg>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-3)' }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--accent)' }} /> Done
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-3)' }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--bg-3)' }} /> Total
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {overdue.length > 0 && (
            <div className="alert-card" style={{ ['--rail' as any]: 'var(--red)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--red-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={13} color="var(--red)" strokeWidth={2} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 650, color: 'var(--text)' }}>Overdue Tasks</span>
                <span className="badge" style={{ background: 'var(--red-light)', color: 'var(--red)' }}>{overdue.length}</span>
              </div>
              {overdue.slice(0, 4).map(t => (
                <div key={t.id} style={{ fontSize: 12, color: 'var(--text-2)', padding: '3px 0' }}>· {t.title}</div>
              ))}
            </div>
          )}

          {cold.length > 0 && (
            <div className="alert-card" style={{ ['--rail' as any]: 'var(--yellow)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--yellow-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Handshake size={13} color="var(--yellow)" strokeWidth={2} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 650, color: 'var(--text)' }}>Going Cold</span>
                <span className="badge" style={{ background: 'var(--yellow-light)', color: 'var(--yellow)' }}>{cold.length}</span>
              </div>
              {cold.slice(0, 4).map(p => (
                <div key={p.id} style={{ fontSize: 12, color: 'var(--text-2)', padding: '3px 0' }}>· {p.name} — {p.nextAction || 'No action set'}</div>
              ))}
            </div>
          )}

          {urgent > 0 && (
            <div className="alert-card" style={{ ['--rail' as any]: 'var(--orange)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--orange-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={13} color="var(--orange)" strokeWidth={2} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 650, color: 'var(--text)' }}>Urgent</span>
                <span className="badge" style={{ background: 'var(--orange-light)', color: 'var(--orange)' }}>{urgent}</span>
              </div>
              {tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').slice(0, 4).map(t => (
                <div key={t.id} style={{ fontSize: 12, color: 'var(--text-2)', padding: '3px 0' }}>· {t.title}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Vacant roles banner */}
      <div className="alert-card" style={{ ['--rail' as any]: 'var(--yellow)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--yellow-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={15} color="var(--yellow)" strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 650, color: 'var(--text)' }}>11 Vacant Roles</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>Assign leads for event ops, partnerships and marketing.</div>
          </div>
        </div>
        <Link to="/roles" className="btn btn-secondary">
          Assign <ArrowUpRight size={14} />
        </Link>
      </div>
    </div>
  );
}
