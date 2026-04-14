import { useState } from 'react';
import { Bell, X, CheckSquare, Calendar, Send, Handshake } from 'lucide-react';
import { useStore } from '../store';
import { fmt } from '../lib/utils';

interface Notification { id: string; type: 'overdue' | 'upcoming' | 'followup' | 'cold'; title: string; detail: string; icon: any; color: string; }

export default function Notifications() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const { tasks, events, outreach, partnerships } = useStore();
  const now = new Date();
  const in7 = new Date(now.getTime() + 7 * 86400000);

  const notifs: Notification[] = [];

  // Overdue tasks
  tasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < now).forEach(t => {
    notifs.push({ id: `task-${t.id}`, type: 'overdue', title: 'Overdue task', detail: t.title, icon: CheckSquare, color: 'var(--red)' });
  });

  // Upcoming events (next 7 days)
  events.filter(e => e.date && new Date(e.date) >= now && new Date(e.date) <= in7).forEach(e => {
    notifs.push({ id: `event-${e.id}`, type: 'upcoming', title: `Event in ${Math.ceil((new Date(e.date).getTime() - now.getTime()) / 86400000)}d`, detail: e.name, icon: Calendar, color: 'var(--blue)' });
  });

  // Follow-ups due
  outreach.filter(o => o.followUpDate && new Date(o.followUpDate) <= now && o.status !== 'replied' && o.status !== 'meeting_booked').forEach(o => {
    notifs.push({ id: `follow-${o.id}`, type: 'followup', title: 'Follow-up due', detail: o.contactName, icon: Send, color: 'var(--orange)' });
  });

  // Cold partnerships (no contact in 14+ days)
  partnerships.filter(p => {
    if (p.status === 'active') return false;
    if (!p.lastContactDate) return true; // never contacted
    return (now.getTime() - new Date(p.lastContactDate).getTime()) > 14 * 86400000;
  }).slice(0, 5).forEach(p => {
    notifs.push({ id: `cold-${p.id}`, type: 'cold', title: 'Going cold', detail: p.name, icon: Handshake, color: 'var(--yellow)' });
  });

  const visible = notifs.filter(n => !dismissed.has(n.id));
  const count = visible.length;

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
        <Bell size={18} color="var(--text-2)" />
        {count > 0 && (
          <span style={{ position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderRadius: '50%', background: 'var(--red)', color: 'white', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
          <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 320, maxHeight: 400, overflow: 'auto', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 99 }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Notifications</span>
              {count > 0 && <button onClick={() => setDismissed(new Set(notifs.map(n => n.id)))} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Clear all</button>}
            </div>
            {visible.length === 0 ? (
              <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>All caught up</div>
            ) : (
              visible.map(n => (
                <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <n.icon size={14} color={n.color} style={{ marginTop: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: n.color }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.detail}</div>
                  </div>
                  <button onClick={() => setDismissed(prev => new Set([...prev, n.id]))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                    <X size={12} color="var(--text-3)" />
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
