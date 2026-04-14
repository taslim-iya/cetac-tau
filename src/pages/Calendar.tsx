import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CheckSquare, Calendar as CalIcon, Send } from 'lucide-react';
import { useStore } from '../store';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const COLORS = { task: '#3b82f6', event: '#7c3aed', outreach: '#ea580c', deadline: '#dc2626' };

interface CalItem { id: string; date: string; title: string; type: 'task' | 'event' | 'outreach'; }

export default function CalendarView() {
  const { tasks, events, outreach } = useStore();
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [selected, setSelected] = useState<string | null>(null);

  const items = useMemo(() => {
    const list: CalItem[] = [];
    tasks.forEach(t => { if (t.dueDate) list.push({ id: t.id, date: t.dueDate, title: t.title, type: 'task' }); });
    events.forEach(e => { if (e.date) list.push({ id: e.id, date: e.date, title: e.name, type: 'event' }); });
    outreach.forEach(o => {
      if (o.sentDate) list.push({ id: o.id + '-s', date: o.sentDate, title: `Email: ${o.contactName}`, type: 'outreach' });
      if (o.followUpDate) list.push({ id: o.id + '-f', date: o.followUpDate, title: `Follow-up: ${o.contactName}`, type: 'outreach' });
    });
    return list;
  }, [tasks, events, outreach]);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = (firstDay.getDay() + 6) % 7; // Monday = 0
  const totalDays = lastDay.getDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(startPad).fill(null);
  for (let d = 1; d <= totalDays; d++) {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week); }

  const dateStr = (d: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const itemsOn = (d: number) => items.filter(i => i.date === dateStr(d));
  const selectedItems = selected ? items.filter(i => i.date === selected) : [];
  const today = new Date();
  const isToday = (d: number) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Calendar</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}
            style={navBtn}><ChevronLeft size={16} /></button>
          <span style={{ fontSize: 14, fontWeight: 600, minWidth: 140, textAlign: 'center' }}>
            {new Date(year, month).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}
            style={navBtn}><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        {[{ label: 'Task', color: COLORS.task }, { label: 'Event', color: COLORS.event }, { label: 'Outreach', color: COLORS.outreach }].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-2)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} /> {l.label}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        {/* Day headers */}
        {DAYS.map(d => (
          <div key={d} style={{ padding: '8px', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textAlign: 'center', background: 'var(--bg-2)' }}>{d}</div>
        ))}
        {/* Days */}
        {weeks.flat().map((d, i) => {
          const dayItems = d ? itemsOn(d) : [];
          const sel = d ? dateStr(d) === selected : false;
          return (
            <div key={i} onClick={() => d && setSelected(dateStr(d))}
              style={{
                minHeight: 80, padding: '6px 8px', background: sel ? 'var(--accent-light)' : 'var(--bg)',
                cursor: d ? 'pointer' : 'default', transition: 'background 0.1s',
                borderLeft: sel ? '2px solid var(--accent)' : '2px solid transparent',
              }}>
              {d && (
                <>
                  <div style={{ fontSize: 12, fontWeight: isToday(d) ? 700 : 400, color: isToday(d) ? 'var(--accent)' : d ? 'var(--text)' : 'var(--text-3)', marginBottom: 4 }}>
                    {isToday(d) ? <span style={{ background: 'var(--accent)', color: 'white', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>{d}</span> : d}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {dayItems.slice(0, 3).map(item => (
                      <div key={item.id} style={{ fontSize: 10, padding: '1px 4px', borderRadius: 3, background: COLORS[item.type] + '18', color: COLORS[item.type], fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title}
                      </div>
                    ))}
                    {dayItems.length > 3 && <div style={{ fontSize: 9, color: 'var(--text-3)' }}>+{dayItems.length - 3} more</div>}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selected && (
        <div style={{ marginTop: 16, border: '1px solid var(--border)', borderRadius: 8, padding: 16, background: 'var(--bg)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
            {new Date(selected + 'T00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          {selectedItems.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Nothing scheduled</div>
          ) : selectedItems.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[item.type], flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--text)', flex: 1 }}>{item.title}</span>
              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: 'var(--bg-3)', color: 'var(--text-3)' }}>{item.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const navBtn: React.CSSProperties = { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' };
