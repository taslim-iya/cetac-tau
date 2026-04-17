import { useStore } from '../store';
import DataTable from '../components/DataTable';

const STATUS_OPTS = [
  { value: 'todo', label: 'To Do' }, { value: 'in_progress', label: 'In Progress' }, { value: 'done', label: 'Done' }, { value: 'blocked', label: 'Blocked' },
];
const PRIORITY_OPTS = [
  { value: 'urgent', label: '🔴 Urgent' }, { value: 'high', label: '🟠 High' }, { value: 'medium', label: '🟡 Medium' }, { value: 'low', label: '⚪ Low' },
];
const WEEK_OPTS = [1,2,3,4,5,6,7,8,9].map(w => ({ value: String(w), label: `Week ${w}` }));

const COLUMNS = [
  { key: 'title', label: 'Task' },
  { key: 'status', label: 'Status', width: 110, type: 'select' as const, options: STATUS_OPTS },
  { key: 'priority', label: 'Priority', width: 100, type: 'select' as const, options: PRIORITY_OPTS },
  { key: 'week', label: 'Week', width: 80, type: 'select' as const, options: WEEK_OPTS },
  { key: 'assignees', label: 'Assignees', width: 160, type: 'tags' as const },
  { key: 'category', label: 'Category', width: 110 },
  { key: 'dueDate', label: 'Due Date', width: 110, type: 'date' as const },
  { key: 'description', label: 'Notes', hidden: true },
];

export default function Tasks() {
  const { tasks, update, add, remove } = useStore();

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Tasks</h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 2 }}>{tasks.length} tasks</p>
      </div>
      <DataTable
        columns={COLUMNS}
        data={tasks}
        onUpdate={(id, updates) => update('tasks', id, updates)}
        onDelete={(id) => remove('tasks', id)}
        onAdd={() => add('tasks', { title: '', description: '', status: 'todo', priority: 'medium', assignees: [], dueDate: '', week: 1, category: '', completedAt: '' })}
        addLabel="Add Task"
        entityName="tasks"
        defaultSort={{ key: 'week', dir: 'asc' }}
      />
    </div>
  );
}
