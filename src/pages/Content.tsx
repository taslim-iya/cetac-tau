import { useStore } from '../store';
import DataTable from '../components/DataTable';

const TYPE_OPTS = [
  { value: 'case_study', label: 'Case Study' }, { value: 'newsletter', label: 'Newsletter' },
  { value: 'linkedin_post', label: 'LinkedIn Post' }, { value: 'playbook', label: 'Playbook' },
  { value: 'event_recap', label: 'Event Recap' },
];
const STATUS_OPTS = [
  { value: 'idea', label: 'Idea' }, { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' }, { value: 'published', label: 'Published' },
];

const COLUMNS = [
  { key: 'title', label: 'Title', width: 220 },
  { key: 'type', label: 'Type', width: 120, type: 'select' as const, options: TYPE_OPTS },
  { key: 'status', label: 'Status', width: 110, type: 'select' as const, options: STATUS_OPTS },
  { key: 'author', label: 'Author', width: 120 },
  { key: 'subject', label: 'Subject', width: 160 },
  { key: 'publishDate', label: 'Publish Date', width: 110, type: 'date' as const },
  { key: 'platform', label: 'Platform', width: 100 },
  { key: 'notes', label: 'Notes', hidden: true },
];

export default function Content() {
  const { content, update, add, remove, removeMany, updateMany, reorder } = useStore();

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Content</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>{content.length} items · drag to reorder</p>
        </div>
        <button className="btn btn-primary" onClick={() => add('content', { title: '', type: 'linkedin_post', status: 'idea', author: '', subject: '', publishDate: '', platform: 'LinkedIn', notes: '' })}>
          + Add Content
        </button>
      </div>
      <DataTable
        columns={COLUMNS}
        data={content}
        onUpdate={(id, updates) => update('content', id, updates)}
        onDelete={(id) => remove('content', id)}
        onReorder={(ids) => reorder('content', ids)}
        onBulkDelete={(ids) => removeMany('content', ids)}
        onBulkUpdate={(ids, updates) => updateMany('content', ids, updates)}
        entityName="content"
      />
    </div>
  );
}
