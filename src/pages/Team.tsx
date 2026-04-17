import { useStore } from '../store';
import DataTable from '../components/DataTable';

const STATUS_OPTS = [
  { value: 'active', label: 'Active' }, { value: 'potential', label: 'Potential' }, { value: 'new', label: 'New' },
];

const COLUMNS = [
  { key: 'name', label: 'Name', width: 140 },
  { key: 'role', label: 'Role', width: 180 },
  { key: 'responsibilities', label: 'Responsibilities' },
  { key: 'status', label: 'Status', width: 100, type: 'select' as const, options: STATUS_OPTS },
  { key: 'email', label: 'Email', width: 160 },
  { key: 'phone', label: 'Phone', width: 120, hidden: true },
  { key: 'linkedin', label: 'LinkedIn', width: 140, hidden: true },
  { key: 'vertical', label: 'Vertical', width: 120 },
];

export default function Team() {
  const { team, update, add, remove } = useStore();

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Team</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 2 }}>{team.length} members</p>
        </div>
      </div>
      <DataTable
        columns={COLUMNS}
        data={team}
        onUpdate={(id, updates) => update('team', id, updates)}
        onDelete={(id) => remove('team', id)}
        onAdd={() => add('team', { name: '', role: '', responsibilities: '', email: '', phone: '', linkedin: '', status: 'new', vertical: '' })}
        addLabel="Add Member"
        entityName="members"
        defaultSort={{ key: 'name', dir: 'asc' }}
      />
    </div>
  );
}
