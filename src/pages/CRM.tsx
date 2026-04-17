import { useStore } from '../store';
import DataTable from '../components/DataTable';

const TYPE_OPTS = [
  { value: 'team', label: 'Team' }, { value: 'investor', label: 'Investor' },
  { value: 'advisor', label: 'Advisor' }, { value: 'alumni', label: 'Alumni' },
  { value: 'partner', label: 'Partner' }, { value: 'sponsor', label: 'Sponsor' },
  { value: 'speaker', label: 'Speaker' }, { value: 'prospect', label: 'Prospect' },
];

const COLUMNS = [
  { key: 'name', label: 'Name', width: 150 },
  { key: 'type', label: 'Type', width: 100, type: 'select' as const, options: TYPE_OPTS },
  { key: 'organisation', label: 'Organisation', width: 160 },
  { key: 'role', label: 'Role', width: 140 },
  { key: 'email', label: 'Email', width: 180 },
  { key: 'phone', label: 'Phone', width: 120, hidden: true },
  { key: 'linkedin', label: 'LinkedIn', width: 140, hidden: true },
  { key: 'tags', label: 'Tags', width: 140, type: 'tags' as const },
  { key: 'notes', label: 'Notes', hidden: true },
];

export default function CRM() {
  const { contacts, update, add, remove, removeMany, updateMany, reorder } = useStore();

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>CRM</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>{contacts.length} contacts · drag to reorder · ⌘K for commands</p>
        </div>
        <button className="btn btn-primary" onClick={() => add('contacts', { name: '', email: '', phone: '', linkedin: '', type: 'prospect', organisation: '', role: '', notes: '', tags: [] })}>
          + Add Contact
        </button>
      </div>
      <DataTable
        columns={COLUMNS}
        data={contacts}
        onUpdate={(id, updates) => update('contacts', id, updates)}
        onDelete={(id) => remove('contacts', id)}
        onReorder={(ids) => reorder('contacts', ids)}
        onBulkDelete={(ids) => removeMany('contacts', ids)}
        onBulkUpdate={(ids, updates) => updateMany('contacts', ids, updates)}
        entityName="contacts"
      />
    </div>
  );
}
