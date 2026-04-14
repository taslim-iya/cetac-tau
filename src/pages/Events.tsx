import { useState } from 'react';
import { Plus, Trash2, Check, ChevronDown, ChevronUp } from 'lucide-react';
import EditableCell from '../components/EditableCell';
import { useStore } from '../store';

const STATUS_OPTS = [
  { value: 'planned', label: 'Planned' }, { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' },
];
const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  planned: { bg: 'var(--blue-light)', text: 'var(--blue)' }, confirmed: { bg: 'var(--green-light)', text: 'var(--green)' },
  completed: { bg: 'var(--bg-3)', text: 'var(--text-3)' }, cancelled: { bg: 'var(--red-light)', text: 'var(--red)' },
};
const WEEK_OPTS = [1,2,3,4,5,6,7,8,9].map(w => ({ value: String(w), label: `Week ${w}` }));

const PLAYBOOKS: Record<string, string[]> = {
  'Talk + Q&A': ['Book room / venue', 'Confirm speaker', 'Create event slide deck', 'Send invitations to members', 'AV check (projector, mic)', 'Prepare intro & moderator notes', 'Send thank-you to speaker', 'Post-event write-up on LinkedIn'],
  'Workshop': ['Book room / venue', 'Confirm facilitator', 'Prepare workshop materials', 'Send invitations', 'Room setup (tables, whiteboard)', 'Print handouts if needed', 'Facilitator briefing call', 'Collect feedback forms', 'Post-event summary'],
  'Dinner + Networking': ['Choose restaurant / venue', 'Send formal invitations (8-12 people)', 'Collect dietary requirements', 'Confirm headcount with venue', 'Prepare seating plan', 'Print name cards', 'Arrange payment/budget', 'Post-event follow-up emails'],
  'Joint Session': ['Coordinate with co-host', 'Book room / venue', 'Confirm all speakers', 'AV setup (dual screens?)', 'Send invitations', 'Pre-session briefing', 'Post-event write-up'],
  'Conference': ['Lock venue & date (3+ weeks ahead)', 'Confirm all speakers & panellists', 'Confirm judges for competition', 'Sponsor logos & deliverables collected', 'Catering booked (lunch + coffee)', 'AV booked (projector, mics, recording)', 'Print name badges & welcome packs', 'Competition brief sent to teams', 'RSVP tracking & reminders', 'Day-of runsheet finalised', 'Photography / recording arranged', 'Networking drinks organised', 'Post-event LinkedIn write-up', 'Thank-you emails to speakers & sponsors', 'Feedback survey sent'],
  'Social': ['Choose venue', 'Send invitations', 'Arrange refreshments/drinks', 'Prepare icebreaker or activity', 'Post-event follow-up'],
  'Internal': ['Finalise agenda', 'Share docs/materials ahead of time', 'Book room or set up video call', 'Take meeting notes', 'Share action items'],
};

export default function Events() {
  const { events, update, add, remove } = useStore();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const addEvent = () => {
    add('events', { name: '', description: '', date: '', time: '', venue: '', week: 1, status: 'planned', speakers: [], sponsors: [], attendeeCount: 0, format: '', postEventNotes: '', checklist: [] });
  };

  const applyPlaybook = (eventId: string, format: string) => {
    const items = PLAYBOOKS[format] || PLAYBOOKS['Internal'] || [];
    update('events', eventId, { checklist: items.map(label => ({ label, done: false })) });
  };

  const toggleChecklist = (eventId: string, idx: number) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    const cl = [...(event.checklist || [])];
    cl[idx] = { ...cl[idx], done: !cl[idx].done };
    update('events', eventId, { checklist: cl });
  };

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Events</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 2 }}>{events.length} events with playbook checklists</p>
        </div>
        <button onClick={addEvent} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: 'none', borderRadius: 6, background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={14} /> Add Event
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {events.map(e => {
          const sc = STATUS_COLOR[e.status] || STATUS_COLOR.planned;
          const isExpanded = expanded.has(e.id);
          const cl = e.checklist || [];
          const clDone = cl.filter(c => c.done).length;

          return (
            <div key={e.id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8 }}>
              {/* Header */}
              <div style={{ padding: '14px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-light)', padding: '2px 8px', borderRadius: 10 }}>Week {e.week}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: sc.bg, color: sc.text }}>{e.status}</span>
                      {e.format && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 8, background: 'var(--bg-3)', color: 'var(--text-3)' }}>{e.format}</span>}
                      {cl.length > 0 && <span style={{ fontSize: 10, color: clDone === cl.length ? 'var(--green)' : 'var(--text-3)', fontWeight: 600 }}>{clDone}/{cl.length} ✓</span>}
                    </div>
                    <EditableCell value={e.name} onChange={v => update('events', e.id, { name: v })} placeholder="Event name" />
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <EditableCell value={e.status} onChange={v => update('events', e.id, { status: v })} type="select" options={STATUS_OPTS} />
                    <button onClick={() => toggle(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                      {isExpanded ? <ChevronUp size={16} color="var(--text-3)" /> : <ChevronDown size={16} color="var(--text-3)" />}
                    </button>
                    <button onClick={() => remove('events', e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.3 }}><Trash2 size={14} color="var(--red)" /></button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 8 }}>
                  <div><label style={labelStyle}>Date</label><EditableCell value={e.date} onChange={v => update('events', e.id, { date: v })} type="date" /></div>
                  <div><label style={labelStyle}>Time</label><EditableCell value={e.time} onChange={v => update('events', e.id, { time: v })} placeholder="18:00" /></div>
                  <div><label style={labelStyle}>Venue</label><EditableCell value={e.venue} onChange={v => update('events', e.id, { venue: v })} placeholder="CJBS" /></div>
                  <div><label style={labelStyle}>Format</label><EditableCell value={e.format} onChange={v => { update('events', e.id, { format: v }); }} placeholder="Talk + Q&A" /></div>
                </div>
              </div>

              {/* Expanded: details + playbook */}
              {isExpanded && (
                <div style={{ padding: '0 18px 16px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ marginTop: 12 }}>
                    <label style={labelStyle}>Description</label>
                    <EditableCell value={e.description} onChange={v => update('events', e.id, { description: v })} placeholder="Event description..." />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                    <div><label style={labelStyle}>Speakers</label><EditableCell value={e.speakers.join(', ')} onChange={v => update('events', e.id, { speakers: v.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Speaker names" /></div>
                    <div><label style={labelStyle}>Sponsors</label><EditableCell value={e.sponsors.join(', ')} onChange={v => update('events', e.id, { sponsors: v.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Sponsor names" /></div>
                  </div>

                  {/* Playbook checklist */}
                  <div style={{ marginTop: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <label style={{ ...labelStyle, marginBottom: 0 }}>Event Playbook</label>
                      {e.format && (
                        <button onClick={() => applyPlaybook(e.id, e.format)}
                          style={{ fontSize: 10, color: 'var(--accent)', background: 'var(--accent-light)', border: 'none', padding: '3px 8px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                          Generate checklist for "{e.format}"
                        </button>
                      )}
                    </div>
                    {cl.length === 0 ? (
                      <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '8px 0' }}>
                        Set a format above, then click "Generate checklist" to get a playbook
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {cl.map((item, idx) => (
                          <div key={idx} onClick={() => toggleChecklist(e.id, idx)}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', cursor: 'pointer' }}>
                            <div style={{ width: 16, height: 16, borderRadius: 3, border: `1.5px solid ${item.done ? 'var(--green)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: item.done ? 'var(--green-light)' : 'transparent', flexShrink: 0 }}>
                              {item.done && <Check size={10} color="var(--green)" />}
                            </div>
                            <span style={{ fontSize: 12, color: item.done ? 'var(--text-3)' : 'var(--text)', textDecoration: item.done ? 'line-through' : 'none' }}>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', display: 'block', marginBottom: 2 };
