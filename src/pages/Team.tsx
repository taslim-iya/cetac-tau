import { useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import EditableCell from '../components/EditableCell';
import { useStore } from '../store';
import { id } from '../lib/utils';

const STATUS_OPTS = [
  { value: 'active', label: 'Active' }, { value: 'potential', label: 'Potential' }, { value: 'new', label: 'New' },
];

export default function Team() {
  const { team, update, add, remove } = useStore();

  const addMember = () => {
    add('team', { name: '', role: '', responsibilities: '', email: '', phone: '', linkedin: '', status: 'new', vertical: '' });
  };

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Team</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 2 }}>{team.length} members — edit any cell directly</p>
        </div>
        <button onClick={addMember} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: 'none', borderRadius: 6, background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={14} /> Add Member
        </button>
      </div>

      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 140 }}>Name</th>
              <th style={{ width: 180 }}>Role</th>
              <th>Responsibilities</th>
              <th style={{ width: 100 }}>Status</th>
              <th style={{ width: 140 }}>Email</th>
              <th style={{ width: 120 }}>Vertical</th>
              <th style={{ width: 36 }}></th>
            </tr>
          </thead>
          <tbody>
            {team.map(m => (
              <tr key={m.id}>
                <td><EditableCell value={m.name} onChange={v => update('team', m.id, { name: v })} placeholder="Name" /></td>
                <td><EditableCell value={m.role} onChange={v => update('team', m.id, { role: v })} placeholder="Role" /></td>
                <td><EditableCell value={m.responsibilities} onChange={v => update('team', m.id, { responsibilities: v })} placeholder="Responsibilities" /></td>
                <td>
                  <EditableCell value={m.status} onChange={v => update('team', m.id, { status: v })} type="select" options={STATUS_OPTS} />
                </td>
                <td><EditableCell value={m.email} onChange={v => update('team', m.id, { email: v })} placeholder="Email" /></td>
                <td><EditableCell value={m.vertical} onChange={v => update('team', m.id, { vertical: v })} placeholder="Vertical" /></td>
                <td>
                  <button onClick={() => remove('team', m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.3 }} title="Remove">
                    <Trash2 size={13} color="var(--red)" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
