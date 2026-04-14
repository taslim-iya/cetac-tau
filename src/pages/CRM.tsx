import { useState } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import EditableCell from '../components/EditableCell';
import { useStore } from '../store';

const TYPE_OPTS = [
  { value: 'investor', label: 'Investor' }, { value: 'advisor', label: 'Advisor' },
  { value: 'alumni', label: 'Alumni' }, { value: 'partner', label: 'Partner' },
  { value: 'sponsor', label: 'Sponsor' }, { value: 'speaker', label: 'Speaker' },
  { value: 'prospect', label: 'Prospect' }, { value: 'team', label: 'Team' },
];

export default function CRM() {
  const { contacts, update, add, remove } = useStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = contacts.filter(c => {
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return [c.name, c.email, c.organisation, c.role, c.notes].some(f => f?.toLowerCase().includes(q));
    }
    return true;
  });

  const addContact = () => {
    add('contacts', { name: '', email: '', phone: '', linkedin: '', type: 'prospect', organisation: '', role: '', notes: '', tags: [] });
  };

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>CRM</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 2 }}>ETA Ecosystem Database — investors, alumni, advisors, sponsors</p>
        </div>
        <button onClick={addContact} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: 'none', borderRadius: 6, background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={14} /> Add Contact
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts..."
            style={{ width: '100%', padding: '6px 10px 6px 30px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, background: 'var(--bg)' }}>
          <option value="all">All types</option>
          {TYPE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th style={{ width: 90 }}>Type</th>
              <th>Organisation</th>
              <th>Role</th>
              <th>Email</th>
              <th>LinkedIn</th>
              <th>Notes</th>
              <th style={{ width: 30 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                {contacts.length === 0 ? 'No contacts yet — add investors, alumni, and advisors' : 'No matches'}
              </td></tr>
            ) : filtered.map(c => (
              <tr key={c.id}>
                <td><EditableCell value={c.name} onChange={v => update('contacts', c.id, { name: v })} placeholder="Name" /></td>
                <td><EditableCell value={c.type} onChange={v => update('contacts', c.id, { type: v })} type="select" options={TYPE_OPTS} /></td>
                <td><EditableCell value={c.organisation} onChange={v => update('contacts', c.id, { organisation: v })} placeholder="Org" /></td>
                <td><EditableCell value={c.role} onChange={v => update('contacts', c.id, { role: v })} placeholder="Role" /></td>
                <td><EditableCell value={c.email} onChange={v => update('contacts', c.id, { email: v })} placeholder="Email" /></td>
                <td><EditableCell value={c.linkedin} onChange={v => update('contacts', c.id, { linkedin: v })} placeholder="URL" /></td>
                <td><EditableCell value={c.notes} onChange={v => update('contacts', c.id, { notes: v })} placeholder="Notes" /></td>
                <td><button onClick={() => remove('contacts', c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.3 }}><Trash2 size={13} color="var(--red)" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
