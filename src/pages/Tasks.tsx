import { useState } from 'react';
import { useStore } from '../store';
import DataTable from '../components/DataTable';
import { Sparkles, Wand2 } from 'lucide-react';

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

// Role-based keyword matching for auto-assignment
const ROLE_TASK_KEYWORDS: Record<string, string[]> = {
  'partnership': ['partnership', 'partner', 'sponsor', 'outreach', 'business school', 'bs ', 'investor', 'fundrais'],
  'communication': ['content', 'newsletter', 'social media', 'marketing', 'press', 'blog', 'linkedin', 'email campaign', 'brand', 'design'],
  'event': ['event', 'venue', 'speaker', 'workshop', 'search day', 'competition', 'logistics', 'catering', 'registration'],
  'education': ['education', 'case study', 'curriculum', 'session', 'learning', 'programme', 'training', 'co-founder'],
  'operations': ['operations', 'budget', 'finance', 'admin', 'secretary', 'minutes', 'governance', 'compliance'],
  'community': ['community', 'alumni', 'member', 'networking', 'database', 'crm', 'searchfund'],
  'digital': ['website', 'digital', 'tech', 'platform', 'web', 'online', 'analytics'],
  'research': ['research', 'database', 'data', 'pipeline', 'sourcing', 'screening'],
};

function matchTaskToMembers(taskTitle: string, taskCategory: string, members: { name: string; role: string }[]): string[] {
  const text = `${taskTitle} ${taskCategory}`.toLowerCase();
  const matched: string[] = [];
  
  for (const member of members) {
    const memberRole = (member.role || '').toLowerCase();
    
    for (const [category, keywords] of Object.entries(ROLE_TASK_KEYWORDS)) {
      // Check if task matches this category
      const taskMatches = keywords.some(kw => text.includes(kw));
      if (!taskMatches) continue;
      
      // Check if member's role matches this category
      const roleMatchesCategory = 
        (category === 'partnership' && (memberRole.includes('partner') || memberRole.includes('sponsor') || memberRole.includes('investor'))) ||
        (category === 'communication' && (memberRole.includes('comm') || memberRole.includes('marketing') || memberRole.includes('press') || memberRole.includes('newsletter') || memberRole.includes('content'))) ||
        (category === 'event' && (memberRole.includes('event') || memberRole.includes('search day'))) ||
        (category === 'education' && (memberRole.includes('education') || memberRole.includes('case') || memberRole.includes('co-founder'))) ||
        (category === 'operations' && (memberRole.includes('operat') || memberRole.includes('secretary') || memberRole.includes('finance') || memberRole.includes('admin'))) ||
        (category === 'community' && (memberRole.includes('community') || memberRole.includes('alumni') || memberRole.includes('searchfund'))) ||
        (category === 'digital' && (memberRole.includes('website') || memberRole.includes('digital') || memberRole.includes('tech'))) ||
        (category === 'research' && (memberRole.includes('research') || memberRole.includes('database') || memberRole.includes('data')));
      
      if (roleMatchesCategory && !matched.includes(member.name)) {
        matched.push(member.name);
      }
    }
  }
  
  return matched;
}

async function aiAutoAssign(tasks: any[], members: { name: string; role: string }[]): Promise<Record<string, string[]>> {
  const memberList = members.map(m => `${m.name} (${m.role})`).join(', ');
  const taskList = tasks.filter(t => !t.assignees?.length && t.status !== 'done').map(t => `ID:${t.id} "${t.title}" [${t.category || 'uncategorised'}]`).join('\n');
  
  if (!taskList) return {};
  
  const prompt = `You are assigning tasks to CETAC (Cambridge ETA Club) committee members based on their roles.

Team members: ${memberList}

Unassigned tasks:
${taskList}

For each task, assign 1-2 most relevant members based on role fit. Return JSON only:
{"assignments": [{"taskId": "...", "assignees": ["Name1", "Name2"]}]}`;

  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const result: Record<string, string[]> = {};
      for (const a of parsed.assignments || []) {
        result[a.taskId] = a.assignees;
      }
      return result;
    }
  } catch (e) {
    console.error('AI auto-assign failed:', e);
  }
  return {};
}

export default function Tasks() {
  const { tasks, team, update, add, remove, addMemberTask } = useStore();
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [aiAssigning, setAiAssigning] = useState(false);
  const activeMembers = team.filter(m => (m.name && (!m.status || m.status === 'active' || m.status === 'new')));
  const unassignedCount = tasks.filter(t => !t.assignees?.length && t.status !== 'done').length;

  const handleAutoAssign = () => {
    setAutoAssigning(true);
    let assigned = 0;
    const members = activeMembers.map(m => ({ name: m.name, role: m.role }));
    
    for (const task of tasks) {
      if (task.assignees?.length || task.status === 'done') continue;
      const matches = matchTaskToMembers(task.title, task.category || '', members);
      if (matches.length) {
        update('tasks', task.id, { assignees: matches });
        // Also create member tasks
        for (const name of matches) {
          const member = activeMembers.find(m => m.name === name);
          if (member) {
            addMemberTask({ title: task.title, description: task.description || '', assigneeId: member.id, assigneeName: name, type: 'one-off', dueDate: task.dueDate || '', status: 'pending' });
          }
        }
        assigned++;
      }
    }
    
    setAutoAssigning(false);
    alert(`Auto-assigned ${assigned} tasks based on role matching.${unassignedCount - assigned > 0 ? ` ${unassignedCount - assigned} tasks couldn't be matched — try AI assign.` : ''}`);
  };

  const handleAiAssign = async () => {
    setAiAssigning(true);
    const members = activeMembers.map(m => ({ name: m.name, role: m.role }));
    const assignments = await aiAutoAssign(tasks, members);
    
    let assigned = 0;
    for (const [taskId, assignees] of Object.entries(assignments)) {
      const validAssignees = assignees.filter(n => activeMembers.some(m => m.name === n));
      if (validAssignees.length) {
        update('tasks', taskId, { assignees: validAssignees });
        for (const name of validAssignees) {
          const member = activeMembers.find(m => m.name === name);
          const task = tasks.find(t => t.id === taskId);
          if (member && task) {
            addMemberTask({ title: task.title, description: task.description || '', assigneeId: member.id, assigneeName: name, type: 'one-off', dueDate: task.dueDate || '', status: 'pending' });
          }
        }
        assigned++;
      }
    }
    
    setAiAssigning(false);
    alert(`AI assigned ${assigned} tasks.`);
  };

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Tasks</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 2 }}>{tasks.length} tasks · {unassignedCount} unassigned</p>
        </div>
        {unassignedCount > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleAutoAssign}
              disabled={autoAssigning}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'var(--bg)', color: 'var(--accent)', fontFamily: 'var(--sans)' }}
            >
              <Wand2 size={14} /> {autoAssigning ? 'Assigning...' : 'Auto-Assign by Role'}
            </button>
            <button
              onClick={handleAiAssign}
              disabled={aiAssigning}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'var(--accent)', color: 'white', fontFamily: 'var(--sans)' }}
            >
              <Sparkles size={14} /> {aiAssigning ? 'AI Thinking...' : 'AI Auto-Assign'}
            </button>
          </div>
        )}
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
