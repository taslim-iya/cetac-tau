import { Plus, Trash2 } from 'lucide-react';
import EditableCell from '../components/EditableCell';
import { useStore } from '../store';

const STATUS_OPTS = [
  { value: 'draft', label: 'Draft' }, { value: 'sent', label: 'Sent' },
  { value: 'replied', label: 'Replied' }, { value: 'meeting_booked', label: 'Meeting Booked' },
  { value: 'no_response', label: 'No Response' },
];

export default function Outreach() {
  const { outreach, update, add, remove } = useStore();

  const addOutreach = () => {
    add('outreach', { contactName: '', contactEmail: '', subject: '', message: '', status: 'draft', sentDate: '', followUpDate: '', category: '', notes: '' });
  };

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Outreach</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 2 }}>Track all outbound emails and follow-ups</p>
        </div>
        <button onClick={addOutreach} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: 'none', borderRadius: 6, background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={14} /> Add Outreach
        </button>
      </div>

      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Contact</th>
              <th>Email</th>
              <th>Subject</th>
              <th style={{ width: 110 }}>Status</th>
              <th style={{ width: 90 }}>Sent</th>
              <th style={{ width: 90 }}>Follow Up</th>
              <th>Category</th>
              <th>Notes</th>
              <th style={{ width: 30 }}></th>
            </tr>
          </thead>
          <tbody>
            {outreach.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                No outreach tracked yet — add emails to investors, business schools, and partners
              </td></tr>
            ) : outreach.map(o => (
              <tr key={o.id}>
                <td><EditableCell value={o.contactName} onChange={v => update('outreach', o.id, { contactName: v })} placeholder="Name" /></td>
                <td><EditableCell value={o.contactEmail} onChange={v => update('outreach', o.id, { contactEmail: v })} placeholder="Email" /></td>
                <td><EditableCell value={o.subject} onChange={v => update('outreach', o.id, { subject: v })} placeholder="Subject" /></td>
                <td><EditableCell value={o.status} onChange={v => update('outreach', o.id, { status: v })} type="select" options={STATUS_OPTS} /></td>
                <td><EditableCell value={o.sentDate} onChange={v => update('outreach', o.id, { sentDate: v })} type="date" /></td>
                <td><EditableCell value={o.followUpDate} onChange={v => update('outreach', o.id, { followUpDate: v })} type="date" /></td>
                <td><EditableCell value={o.category} onChange={v => update('outreach', o.id, { category: v })} placeholder="Category" /></td>
                <td><EditableCell value={o.notes} onChange={v => update('outreach', o.id, { notes: v })} placeholder="Notes" /></td>
                <td><button onClick={() => remove('outreach', o.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.3 }}><Trash2 size={13} color="var(--red)" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
