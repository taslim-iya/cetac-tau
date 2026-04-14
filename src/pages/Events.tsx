import { Plus, Trash2 } from 'lucide-react';
import EditableCell from '../components/EditableCell';
import { useStore } from '../store';

const STATUS_OPTS = [
  { value: 'planned', label: 'Planned' }, { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' },
];
const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  planned: { bg: '#dbeafe', text: '#1d4ed8' }, confirmed: { bg: '#dcfce7', text: '#166534' },
  completed: { bg: '#e8eaed', text: '#525252' }, cancelled: { bg: '#fef2f2', text: '#dc2626' },
};
const WEEK_OPTS = [1,2,3,4,5,6,7,8,9].map(w => ({ value: String(w), label: `Week ${w}` }));

export default function Events() {
  const { events, update, add, remove } = useStore();

  const addEvent = () => {
    add('events', { name: '', description: '', date: '', time: '', venue: '', week: 1, status: 'planned', speakers: [], sponsors: [], attendeeCount: 0, format: '', postEventNotes: '' });
  };

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Events</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 2 }}>{events.length} events — 9-week calendar</p>
        </div>
        <button onClick={addEvent} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: 'none', borderRadius: 6, background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={14} /> Add Event
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {events.map(e => {
          const sc = STATUS_COLOR[e.status] || STATUS_COLOR.planned;
          return (
            <div key={e.id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-light)', padding: '2px 8px', borderRadius: 10 }}>Week {e.week}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: sc.bg, color: sc.text }}>{e.status}</span>
                  </div>
                  <EditableCell value={e.name} onChange={v => update('events', e.id, { name: v })} placeholder="Event name" className="font-semibold text-base" />
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <EditableCell value={e.status} onChange={v => update('events', e.id, { status: v })} type="select" options={STATUS_OPTS} />
                  <button onClick={() => remove('events', e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.3 }}><Trash2 size={14} color="var(--red)" /></button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 8 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>Date</label>
                  <EditableCell value={e.date} onChange={v => update('events', e.id, { date: v })} type="date" />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>Time</label>
                  <EditableCell value={e.time} onChange={v => update('events', e.id, { time: v })} placeholder="18:00" />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>Venue</label>
                  <EditableCell value={e.venue} onChange={v => update('events', e.id, { venue: v })} placeholder="CJBS" />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>Format</label>
                  <EditableCell value={e.format} onChange={v => update('events', e.id, { format: v })} placeholder="Workshop" />
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>Description</label>
                <EditableCell value={e.description} onChange={v => update('events', e.id, { description: v })} placeholder="Event description..." />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>Speakers</label>
                  <EditableCell value={e.speakers.join(', ')} onChange={v => update('events', e.id, { speakers: v.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Speaker names" />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>Sponsors</label>
                  <EditableCell value={e.sponsors.join(', ')} onChange={v => update('events', e.id, { sponsors: v.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Sponsor names" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
