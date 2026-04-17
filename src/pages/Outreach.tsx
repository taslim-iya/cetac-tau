import { useStore } from '../store';
import DataTable from '../components/DataTable';

const STATUS_OPTS = [
  { value: 'draft', label: 'Draft' }, { value: 'sent', label: 'Sent' },
  { value: 'replied', label: 'Replied' }, { value: 'meeting_booked', label: 'Meeting Booked' },
  { value: 'no_response', label: 'No Response' },
];

const COLUMNS = [
  { key: 'contactName', label: 'Contact', width: 150 },
  { key: 'contactEmail', label: 'Email', width: 180 },
  { key: 'subject', label: 'Subject', width: 200 },
  { key: 'status', label: 'Status', width: 120, type: 'select' as const, options: STATUS_OPTS },
  { key: 'category', label: 'Category', width: 110 },
  { key: 'sentDate', label: 'Sent', width: 100, type: 'date' as const },
  { key: 'followUpDate', label: 'Follow Up', width: 100, type: 'date' as const },
  { key: 'message', label: 'Message', hidden: true },
  { key: 'notes', label: 'Notes', hidden: true },
];

export default function Outreach() {
  const { outreach, update, add, remove } = useStore();

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Outreach</h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 2 }}>{outreach.length} messages</p>
      </div>
      <DataTable
        columns={COLUMNS}
        data={outreach}
        onUpdate={(id, updates) => update('outreach', id, updates)}
        onDelete={(id) => remove('outreach', id)}
        onAdd={() => add('outreach', { contactName: '', contactEmail: '', subject: '', message: '', status: 'draft', sentDate: '', followUpDate: '', category: '', notes: '' })}
        addLabel="Add Outreach"
        entityName="outreach"
        defaultSort={{ key: 'sentDate', dir: 'desc' }}
      />
    </div>
  );
}
