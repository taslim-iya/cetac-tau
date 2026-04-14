import { Plus, Trash2 } from 'lucide-react';
import EditableCell from '../components/EditableCell';
import { useStore } from '../store';

const STATUS_OPTS = [
  { value: 'prospect', label: 'Prospect' }, { value: 'contacted', label: 'Contacted' },
  { value: 'in_discussion', label: 'In Discussion' }, { value: 'agreed', label: 'Agreed' }, { value: 'active', label: 'Active' },
];
const TYPE_OPTS = [
  { value: 'business_school', label: 'Business School' }, { value: 'cambridge_internal', label: 'Cambridge Internal' },
  { value: 'investor', label: 'Investor' }, { value: 'sponsor', label: 'Sponsor' },
  { value: 'advisor', label: 'Advisor' }, { value: 'other', label: 'Other' },
];
const STATUS_COLOR: Record<string, string> = {
  prospect: '#a3a3a3', contacted: '#2563eb', in_discussion: '#ca8a04', agreed: '#16a34a', active: '#16a34a',
};

export default function Partnerships() {
  const { partnerships, update, add, remove } = useStore();

  const addPartnership = () => {
    add('partnerships', { name: '', type: 'other', contactPerson: '', contactEmail: '', status: 'prospect', notes: '', lastContactDate: '', nextAction: '' });
  };

  const grouped = TYPE_OPTS.map(t => ({
    ...t,
    items: partnerships.filter(p => p.type === t.value),
  })).filter(g => g.items.length > 0);

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Partnerships</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 2 }}>{partnerships.length} partnerships — CRM view</p>
        </div>
        <button onClick={addPartnership} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: 'none', borderRadius: 6, background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={14} /> Add Partnership
        </button>
      </div>

      {grouped.map(g => (
        <div key={g.value} style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{g.label} ({g.items.length})</h3>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Organisation</th>
                  <th style={{ width: 100 }}>Status</th>
                  <th style={{ width: 120 }}>Contact</th>
                  <th style={{ width: 120 }}>Email</th>
                  <th>Next Action</th>
                  <th>Notes</th>
                  <th style={{ width: 90 }}>Last Contact</th>
                  <th style={{ width: 30 }}></th>
                </tr>
              </thead>
              <tbody>
                {g.items.map(p => (
                  <tr key={p.id}>
                    <td><EditableCell value={p.name} onChange={v => update('partnerships', p.id, { name: v })} placeholder="Name" /></td>
                    <td><EditableCell value={p.status} onChange={v => update('partnerships', p.id, { status: v })} type="select" options={STATUS_OPTS} /></td>
                    <td><EditableCell value={p.contactPerson} onChange={v => update('partnerships', p.id, { contactPerson: v })} placeholder="Name" /></td>
                    <td><EditableCell value={p.contactEmail} onChange={v => update('partnerships', p.id, { contactEmail: v })} placeholder="Email" /></td>
                    <td><EditableCell value={p.nextAction} onChange={v => update('partnerships', p.id, { nextAction: v })} placeholder="Next step" /></td>
                    <td><EditableCell value={p.notes} onChange={v => update('partnerships', p.id, { notes: v })} placeholder="Notes" /></td>
                    <td><EditableCell value={p.lastContactDate} onChange={v => update('partnerships', p.id, { lastContactDate: v })} type="date" /></td>
                    <td><button onClick={() => remove('partnerships', p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.3 }}><Trash2 size={13} color="var(--red)" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
