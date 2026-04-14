import { Plus, Trash2 } from 'lucide-react';
import EditableCell from '../components/EditableCell';
import { useStore } from '../store';

const TYPE_OPTS = [
  { value: 'case_study', label: 'Case Study' }, { value: 'newsletter', label: 'Newsletter' },
  { value: 'linkedin_post', label: 'LinkedIn Post' }, { value: 'playbook', label: 'Playbook' },
  { value: 'event_recap', label: 'Event Recap' },
];
const STATUS_OPTS = [
  { value: 'idea', label: 'Idea' }, { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' }, { value: 'published', label: 'Published' },
];

export default function Content() {
  const { content, update, add, remove } = useStore();

  const addContent = () => {
    add('content', { title: '', type: 'linkedin_post', status: 'idea', author: '', subject: '', publishDate: '', platform: 'LinkedIn', notes: '' });
  };

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Content</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 2 }}>Case studies, newsletters, LinkedIn posts, playbook</p>
        </div>
        <button onClick={addContent} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: 'none', borderRadius: 6, background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={14} /> Add Content
        </button>
      </div>

      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th style={{ width: 110 }}>Type</th>
              <th style={{ width: 100 }}>Status</th>
              <th style={{ width: 100 }}>Author</th>
              <th>Subject</th>
              <th style={{ width: 100 }}>Publish Date</th>
              <th>Notes</th>
              <th style={{ width: 30 }}></th>
            </tr>
          </thead>
          <tbody>
            {content.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                No content yet — start with case studies and LinkedIn posts
              </td></tr>
            ) : content.map(c => (
              <tr key={c.id}>
                <td><EditableCell value={c.title} onChange={v => update('content', c.id, { title: v })} placeholder="Title" /></td>
                <td><EditableCell value={c.type} onChange={v => update('content', c.id, { type: v })} type="select" options={TYPE_OPTS} /></td>
                <td><EditableCell value={c.status} onChange={v => update('content', c.id, { status: v })} type="select" options={STATUS_OPTS} /></td>
                <td><EditableCell value={c.author} onChange={v => update('content', c.id, { author: v })} placeholder="Author" /></td>
                <td><EditableCell value={c.subject} onChange={v => update('content', c.id, { subject: v })} placeholder="Subject/topic" /></td>
                <td><EditableCell value={c.publishDate} onChange={v => update('content', c.id, { publishDate: v })} type="date" /></td>
                <td><EditableCell value={c.notes} onChange={v => update('content', c.id, { notes: v })} placeholder="Notes" /></td>
                <td><button onClick={() => remove('content', c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.3 }}><Trash2 size={13} color="var(--red)" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
