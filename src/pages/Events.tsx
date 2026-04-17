import { useStore } from '../store';
import DataTable from '../components/DataTable';

const STATUS_OPTS = [
  { value: 'planned', label: 'Planned' }, { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' },
];
const WEEK_OPTS = [1,2,3,4,5,6,7,8,9].map(w => ({ value: String(w), label: `Week ${w}` }));
const FORMAT_OPTS = [
  { value: 'Talk + Q&A', label: 'Talk + Q&A' }, { value: 'Workshop', label: 'Workshop' },
  { value: 'Dinner + Networking', label: 'Dinner + Networking' }, { value: 'Conference', label: 'Conference' },
  { value: 'Social', label: 'Social' }, { value: 'Internal', label: 'Internal' },
  { value: 'Joint Session', label: 'Joint Session' }, { value: 'Other', label: 'Other' },
];

const COLUMNS = [
  { key: 'name', label: 'Event', width: 240 },
  { key: 'week', label: 'Week', width: 80, type: 'select' as const, options: WEEK_OPTS },
  { key: 'status', label: 'Status', width: 110, type: 'select' as const, options: STATUS_OPTS },
  { key: 'format', label: 'Format', width: 130, type: 'select' as const, options: FORMAT_OPTS },
  { key: 'date', label: 'Date', width: 110, type: 'date' as const },
  { key: 'time', label: 'Time', width: 80 },
  { key: 'venue', label: 'Venue', width: 120 },
  { key: 'speakers', label: 'Speakers', width: 160, type: 'tags' as const },
  { key: 'sponsors', label: 'Sponsors', width: 140, type: 'tags' as const, hidden: true },
  { key: 'attendeeCount', label: 'Attendees', width: 80, hidden: true },
  { key: 'description', label: 'Description', hidden: true },
  { key: 'postEventNotes', label: 'Post-Event Notes', hidden: true },
];

export default function Events() {
  const { events, update, add, remove, removeMany, updateMany, reorder } = useStore();

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Events</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>{events.length} events across 9 weeks · drag to reorder</p>
        </div>
        <button className="btn btn-primary" onClick={() => add('events', { name: '', description: '', date: '', time: '', venue: '', week: 1, status: 'planned', speakers: [], sponsors: [], attendeeCount: 0, format: '', postEventNotes: '', checklist: [] })}>
          + Add Event
        </button>
      </div>
      <DataTable
        columns={COLUMNS}
        data={events}
        onUpdate={(id, updates) => update('events', id, updates)}
        onDelete={(id) => remove('events', id)}
        onReorder={(ids) => reorder('events', ids)}
        onBulkDelete={(ids) => removeMany('events', ids)}
        onBulkUpdate={(ids, updates) => updateMany('events', ids, updates)}
        entityName="events"
      />
    </div>
  );
}
