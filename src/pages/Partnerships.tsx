import { useStore } from '../store';
import DataTable from '../components/DataTable';

const TYPE_OPTS = [
  { value: 'business_school', label: 'Business School' }, { value: 'cambridge_internal', label: 'Cambridge Internal' },
  { value: 'investor', label: 'Investor' }, { value: 'sponsor', label: 'Sponsor' },
  { value: 'advisor', label: 'Advisor' }, { value: 'other', label: 'Other' },
];
const STATUS_OPTS = [
  { value: 'prospect', label: 'Prospect' }, { value: 'contacted', label: 'Contacted' },
  { value: 'in_discussion', label: 'In Discussion' }, { value: 'agreed', label: 'Agreed' },
  { value: 'active', label: 'Active' },
];

const COLUMNS = [
  { key: 'name', label: 'Partner', width: 180 },
  { key: 'type', label: 'Type', width: 140, type: 'select' as const, options: TYPE_OPTS },
  { key: 'status', label: 'Status', width: 120, type: 'select' as const, options: STATUS_OPTS },
  { key: 'contactPerson', label: 'Contact', width: 140 },
  { key: 'contactEmail', label: 'Email', width: 180 },
  { key: 'lastContactDate', label: 'Last Contact', width: 110, type: 'date' as const },
  { key: 'nextAction', label: 'Next Action', width: 180 },
  { key: 'notes', label: 'Notes', hidden: true },
];

export default function Partnerships() {
  const { partnerships, update, add, remove, removeMany, updateMany, reorder } = useStore();

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Partnerships</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>{partnerships.length} partnerships · drag to reorder</p>
        </div>
        <button className="btn btn-primary" onClick={() => add('partnerships', { name: '', type: 'other', contactPerson: '', contactEmail: '', status: 'prospect', notes: '', lastContactDate: '', nextAction: '' })}>
          + Add Partnership
        </button>
      </div>
      <DataTable
        columns={COLUMNS}
        data={partnerships}
        onUpdate={(id, updates) => update('partnerships', id, updates)}
        onDelete={(id) => remove('partnerships', id)}
        onReorder={(ids) => reorder('partnerships', ids)}
        onBulkDelete={(ids) => removeMany('partnerships', ids)}
        onBulkUpdate={(ids, updates) => updateMany('partnerships', ids, updates)}
        entityName="partnerships"
      />
    </div>
  );
}
