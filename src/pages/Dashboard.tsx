import { useState, useRef, useEffect } from 'react';
import { CheckSquare, Users, Calendar, Handshake, Target, AlertTriangle, Clock, TrendingUp, Send, Bot, User, Plus, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { id as makeId } from '../lib/utils';

interface ChatMsg { id: string; role: 'user' | 'assistant'; content: string; }

export default function Dashboard() {
  const store = useStore();
  const { tasks, team, events, partnerships, contacts, content, outreach, memberTasks, settings, currentUser, add } = store;
  const navigate = useNavigate();
  const todo = tasks.filter(t => t.status === 'todo').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const done = tasks.filter(t => t.status === 'done').length;
  const urgent = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length;
  const activeTeam = team.filter(t => (t.name && (!t.status || t.status === 'active' || t.status === 'new'))).length;
  const now = new Date();
  const overdue = tasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < now);

  // My tasks (assigned to current user)
  const myName = currentUser?.name || '';
  const myTasks = tasks.filter(t => t.status !== 'done' && t.assignees.some(a => a.toLowerCase() === myName.toLowerCase())).slice(0, 6);
  const myMemberTasks = memberTasks.filter(mt => mt.assigneeName.toLowerCase() === myName.toLowerCase() && mt.status !== 'completed').slice(0, 4);

  // Upcoming events
  const upcomingEvents = events.filter(e => e.status !== 'completed' && e.status !== 'cancelled').slice(0, 4);

  // Stats
  const stats = [
    { label: 'To Do', value: todo, color: 'var(--accent)', link: '/tasks' },
    { label: 'In Progress', value: inProgress, color: 'var(--orange)', link: '/tasks' },
    { label: 'Done', value: done, color: 'var(--green)', link: '/tasks' },
    { label: 'Team', value: activeTeam, color: 'var(--blue)', link: '/team' },
    { label: 'Events', value: events.length, color: '#7c3aed', link: '/events' },
    { label: 'Contacts', value: contacts.length, color: 'var(--gold)', link: '/crm' },
  ];

  // Quick add
  const [quickTask, setQuickTask] = useState('');

  // Mini chat
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([{ id: '0', role: 'assistant', content: 'How can I help with CETAC today?' }]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMsgs]);

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput('');
    const userMsg: ChatMsg = { id: makeId(), role: 'user', content: text };
    setChatMsgs(prev => [...prev, userMsg]);
    setChatLoading(true);

    // Local NLP — handle common commands
    const lower = text.toLowerCase();
    let reply = '';

    if (lower.match(/add\s+(a\s+)?task/)) {
      const title = text.replace(/add\s+(a\s+)?task\s*/i, '').trim() || 'New task';
      add('tasks', { title, description: '', status: 'todo', priority: 'medium', assignees: [myName], dueDate: '', week: 1, category: '', completedAt: '' });
      reply = `Added task: "${title}"`;
    } else if (lower.match(/add\s+(a\s+)?contact/)) {
      const name = text.replace(/add\s+(a\s+)?contact\s*/i, '').trim() || 'New contact';
      add('contacts', { name, email: '', phone: '', linkedin: '', type: 'prospect', organisation: '', role: '', notes: '', tags: [] });
      reply = `Added contact: "${name}"`;
    } else if (lower.match(/how many|count|total/)) {
      reply = `📊 CETAC Stats:\n• ${tasks.length} tasks (${done} done, ${todo} to do)\n• ${team.length} team members (${activeTeam} active)\n• ${events.length} events\n• ${contacts.length} contacts\n• ${partnerships.length} partnerships`;
    } else if (lower.match(/overdue|late|behind/)) {
      reply = overdue.length ? `⚠️ ${overdue.length} overdue tasks:\n${overdue.slice(0, 5).map(t => `• ${t.title}`).join('\n')}` : '✅ No overdue tasks!';
    } else if (lower.match(/urgent/)) {
      const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done');
      reply = urgentTasks.length ? `🔴 ${urgentTasks.length} urgent tasks:\n${urgentTasks.map(t => `• ${t.title}`).join('\n')}` : '✅ No urgent tasks!';
    } else {
      // Try AI
      try {
        const res = await fetch('/api/ai', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `You are the CETAC AI assistant. The club has ${tasks.length} tasks, ${team.length} team members, ${events.length} events, ${contacts.length} contacts. Current user: ${myName}. Answer helpfully:\n\n${text}`,
            apiKey: settings.openaiKey || '',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          reply = data.choices?.[0]?.message?.content || data.content || 'I can help you manage tasks, contacts, and events. Try "add task..." or "how many contacts?"';
        }
      } catch {}
      if (!reply) reply = 'I can help with: "add task...", "add contact...", "how many...", "overdue tasks", "urgent tasks"';
    }

    setChatMsgs(prev => [...prev, { id: makeId(), role: 'assistant', content: reply }]);
    setChatLoading(false);
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200 }} className="page-content">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, {myName}</p>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8, marginBottom: 20 }}>
        {stats.map(s => (
          <Link key={s.label} to={s.link} className="card" style={{ padding: '12px 10px', textDecoration: 'none', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick add task */}
      <form onSubmit={e => { e.preventDefault(); if (quickTask.trim()) { add('tasks', { title: quickTask, description: '', status: 'todo', priority: 'medium', assignees: [myName], dueDate: '', week: 1, category: '', completedAt: '' }); setQuickTask(''); } }} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input value={quickTask} onChange={e => setQuickTask(e.target.value)} placeholder="Quick add task..."
          style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 3, fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none', fontFamily: 'var(--sans)' }} />
        <button type="submit" className="btn-primary" style={{ padding: '8px 14px' }}>
          <Plus size={14} /> Add
        </button>
      </form>

      {/* Two column: content + chat */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }} className="dashboard-grid">
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* My tasks */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="kicker">My Tasks</div>
              <Link to="/tasks" style={{ fontSize: 11, color: 'var(--text-3)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>View all <ChevronRight size={12} /></Link>
            </div>
            {myTasks.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '8px 0' }}>No tasks assigned to you</div>}
            {myTasks.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.priority === 'urgent' ? 'var(--red)' : t.priority === 'high' ? 'var(--orange)' : 'var(--text-3)', flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 12, color: 'var(--text)' }}>{t.title}</div>
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>W{t.week}</span>
              </div>
            ))}
          </div>

          {/* Alerts */}
          {(overdue.length > 0 || urgent > 0) && (
            <div className="card" style={{ padding: 16 }}>
              <div className="kicker" style={{ marginBottom: 12 }}>Alerts</div>
              {overdue.length > 0 && (
                <div style={{ padding: '8px 10px', background: 'var(--red-light)', borderRadius: 3, marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--red)', marginBottom: 4 }}>⚠️ {overdue.length} Overdue</div>
                  {overdue.slice(0, 3).map(t => <div key={t.id} style={{ fontSize: 11, color: 'var(--text-2)' }}>• {t.title}</div>)}
                </div>
              )}
              {urgent > 0 && (
                <div style={{ padding: '8px 10px', background: 'var(--orange-light)', borderRadius: 3 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--orange)' }}>🔴 {urgent} Urgent</div>
                </div>
              )}
            </div>
          )}

          {/* Upcoming events */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="kicker">Upcoming Events</div>
              <Link to="/events" style={{ fontSize: 11, color: 'var(--text-3)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>View all <ChevronRight size={12} /></Link>
            </div>
            {upcomingEvents.map(e => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ width: 28, height: 28, borderRadius: 3, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', flexShrink: 0 }}>W{e.week}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{e.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{e.format}{e.venue ? ` — ${e.venue}` : ''}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
            {[
              { label: 'Add Contact', icon: Users, to: '/crm' },
              { label: 'New Task', icon: CheckSquare, to: '/tasks' },
              { label: 'Partnerships', icon: Handshake, to: '/partnerships' },
              { label: 'Team Portal', icon: Target, to: '/team-portal' },
            ].map(q => (
              <Link key={q.label} to={q.to} className="card" style={{ padding: '12px 14px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>
                <q.icon size={14} /> {q.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right column: Chat */}
        <div className="card dashboard-chat" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', minHeight: 400, position: 'sticky', top: 24 }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Bot size={14} />
            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--serif)' }}>CETAC AI</span>
            <Link to="/chat" style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-3)', textDecoration: 'none' }}>Full Chat →</Link>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {chatMsgs.map(m => (
              <div key={m.id} style={{ display: 'flex', gap: 8, alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: m.role === 'user' ? 'var(--accent-light)' : 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {m.role === 'user' ? <User size={10} /> : <Bot size={10} />}
                </div>
                <div style={{ maxWidth: '80%', padding: '8px 10px', borderRadius: 6, background: m.role === 'user' ? 'var(--accent-light)' : 'var(--bg-2)', fontSize: 12, lineHeight: 1.5, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                  {m.content}
                </div>
              </div>
            ))}
            {chatLoading && <div style={{ fontSize: 11, color: 'var(--text-3)', padding: 4 }}>Thinking...</div>}
            <div ref={chatEnd} />
          </div>
          <form onSubmit={e => { e.preventDefault(); sendChat(); }} style={{ display: 'flex', gap: 6, padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask anything..."
              style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 3, fontSize: 12, background: 'var(--bg)', color: 'var(--text)', outline: 'none', fontFamily: 'var(--sans)' }} />
            <button type="submit" disabled={chatLoading} style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 3, background: 'var(--bg)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Send size={12} color="var(--text-2)" />
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .dashboard-grid { grid-template-columns: 1fr !important; }
          .dashboard-chat { position: static !important; height: 350px !important; min-height: unset !important; }
        }
      `}</style>
    </div>
  );
}
