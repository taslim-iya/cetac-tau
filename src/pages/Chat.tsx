import { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Bot, User, Paperclip } from 'lucide-react';
import { useStore } from '../store';
import * as XLSX from 'xlsx';

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: 'Hi! I\'m the CETAC AI assistant. I can:\n\n• **Add/modify data** — "Add a task", "Create a contact", "Update CRM"\n• **Answer questions** — "How many tasks are done?", "Who\'s on the team?"\n• **Parse uploaded files** — Drop a CSV/Excel/PDF to import data\n• **Manage the app** — "Add a team member", "Change task status"\n\nWhat would you like to do?',
  timestamp: new Date().toISOString(),
};

interface Message { id: string; role: 'user' | 'assistant'; content: string; timestamp: string; authorName?: string; }

// Escape HTML so user-supplied content can't break out of our markup, then
// apply the small set of markdown features the chat actually uses (bold,
// inline code). Doing it in this order is what makes the dangerouslySetInnerHTML
// downstream safe — the only HTML in the result is what we put there.
function renderMarkdown(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code style="background:var(--bg-3);padding:1px 4px;border-radius:3px;font-size:12px">$1</code>');
}

export default function Chat() {
  const stored = useStore(s => s.chatMessages);
  const addChatMessage = useStore(s => s.addChatMessage);
  const clearChatMessages = useStore(s => s.clearChatMessages);
  const currentUser = useStore(s => s.currentUser);
  // Show the welcome message inline when nothing has been said yet, but never
  // persist it — adding it to the synced list would re-broadcast it forever.
  const messages = useMemo<Message[]>(() => stored.length ? stored : [WELCOME], [stored]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const store = useStore();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const getStoreContext = () => {
    const s = store;
    return `Current CETAC data:\n- Team: ${s.team.length} members (${s.team.filter(t => (t.name && (!t.status || t.status === 'active' || t.status === 'new'))).length} active): ${s.team.map(t => `${t.name} (${t.role})`).join(', ')}\n- Tasks: ${s.tasks.length} total, ${s.tasks.filter(t => t.status === 'done').length} done, ${s.tasks.filter(t => t.status === 'todo').length} todo\n- Events: ${s.events.length}\n- Partnerships: ${s.partnerships.length}\n- Contacts: ${s.contacts.length}\n- Member Tasks: ${s.memberTasks.length}`;
  };

  const parseAndExecute = (text: string): string => {
    const lower = text.toLowerCase();

    // Add task
    if (lower.includes('add') && lower.includes('task')) {
      const title = text.replace(/add\s+(a\s+)?task\s+(to\s+)?/i, '').trim();
      const weekMatch = lower.match(/week\s*(\d)/);
      const week = weekMatch ? Number(weekMatch[1]) : 1;
      const assigneeMatch = lower.match(/(?:assign|to)\s+(\w+)/i);
      const assignees = assigneeMatch ? [assigneeMatch[1]] : [];
      store.add('tasks', { title: title || 'New task', description: '', status: 'todo', priority: 'medium', assignees, dueDate: '', week, category: '', completedAt: '' });
      return `✅ Added task: "${title || 'New task'}" to Week ${week}${assignees.length ? ` assigned to ${assignees.join(', ')}` : ''}`;
    }

    // Add contact
    if (lower.includes('add') && (lower.includes('contact') || lower.includes('investor') || lower.includes('advisor') || lower.includes('alumni'))) {
      const type = lower.includes('investor') ? 'investor' : lower.includes('advisor') ? 'advisor' : lower.includes('alumni') ? 'alumni' : 'prospect';
      const nameMatch = text.match(/(?:add|contact)\s+(.+?)(?:\s+(?:from|as|at)\s|$)/i);
      const orgMatch = text.match(/(?:from|at)\s+(.+?)(?:\s+as\s|$)/i);
      store.add('contacts', { name: nameMatch?.[1] || '', email: '', phone: '', linkedin: '', type, organisation: orgMatch?.[1] || '', role: '', notes: '', tags: [] });
      return `✅ Added ${type}: "${nameMatch?.[1] || 'New contact'}"${orgMatch?.[1] ? ` from ${orgMatch[1]}` : ''}`;
    }

    // Add team member
    if (lower.includes('add') && (lower.includes('team') || lower.includes('member'))) {
      const nameMatch = text.match(/(?:add|new)\s+(?:team\s+)?member\s+(.+?)(?:\s+as\s|$)/i);
      const roleMatch = text.match(/as\s+(.+?)$/i);
      store.add('team', { name: nameMatch?.[1] || 'New member', role: roleMatch?.[1] || 'Member', responsibilities: '', email: '', phone: '', linkedin: '', status: 'active', vertical: '' });
      return `✅ Added team member: "${nameMatch?.[1] || 'New member'}" as ${roleMatch?.[1] || 'Member'}`;
    }

    // Add event
    if ((lower.includes('add') || lower.includes('create')) && lower.includes('event')) {
      const weekMatch = lower.match(/week\s*(\d)/);
      const week = weekMatch ? Number(weekMatch[1]) : 1;
      const name = text.replace(/(?:add|create)\s+(an?\s+)?event\s+(?:for\s+)?/i, '').replace(/week\s*\d/i, '').trim();
      store.add('events', { name: name || 'New event', description: '', date: '', time: '', venue: '', week, status: 'planned', speakers: [], sponsors: [], attendeeCount: 0, format: '', postEventNotes: '', checklist: [] });
      return `✅ Created event: "${name || 'New event'}" in Week ${week}`;
    }

    // Add member task
    if (lower.includes('assign') && (lower.includes('daily') || lower.includes('weekly') || lower.includes('one-off') || lower.includes('task to'))) {
      const type = lower.includes('daily') ? 'daily' : lower.includes('weekly') ? 'weekly' : 'one-off';
      const toMatch = lower.match(/(?:to|for)\s+(\w+)/i);
      const titleMatch = text.match(/assign\s+(?:daily|weekly|one-off)?\s*(?:task)?\s*[":]\s*(.+?)(?:\s+to\s|\s+for\s|$)/i);
      const assignee = toMatch?.[1] || '';
      const member = store.team.find(m => m.name.toLowerCase() === assignee.toLowerCase());
      if (member) {
        store.addMemberTask({ title: titleMatch?.[1] || 'New task', description: '', assigneeId: member.id, assigneeName: member.name, type: type as any, status: 'pending', dueDate: '' });
        return `✅ Assigned ${type} task to ${member.name}: "${titleMatch?.[1] || 'New task'}"`;
      }
    }

    // Progress / status
    if (lower.includes('progress') || (lower.includes('how') && lower.includes('doing')) || lower.includes('summary') || lower.includes('status')) {
      const weekMatch = lower.match(/week\s*(\d)/);
      if (weekMatch) {
        const w = Number(weekMatch[1]);
        const wTasks = store.tasks.filter(t => t.week === w);
        const done = wTasks.filter(t => t.status === 'done').length;
        const event = store.events.find(e => e.week === w);
        return `📊 **Week ${w} Progress**\n\n• Tasks: ${done}/${wTasks.length} done\n• Event: ${event ? `${event.name} (${event.status})` : 'None'}\n• Remaining:\n${wTasks.filter(t => t.status !== 'done').slice(0, 5).map(t => `  - ${t.title}`).join('\n') || '  All done!'}`;
      }
      const total = store.tasks.length;
      const done = store.tasks.filter(t => t.status === 'done').length;
      return `📊 **Overall Progress**\n\n• Tasks: ${done}/${total} (${total ? Math.round(done/total*100) : 0}%)\n• Team: ${store.team.filter(t => (t.name && (!t.status || t.status === 'active' || t.status === 'new'))).length} active\n• Events: ${store.events.length} planned\n• Partnerships: ${store.partnerships.length}\n• CRM Contacts: ${store.contacts.length}\n• Member Tasks: ${store.memberTasks.length}`;
    }

    // Team info
    if (lower.includes('who') && (lower.includes('team') || lower.includes('member'))) {
      return `👥 **Team Members**\n\n${store.team.filter(t => (t.name && (!t.status || t.status === 'active' || t.status === 'new'))).map(t => `• **${t.name}** — ${t.role}${t.responsibilities ? ` (${t.responsibilities.slice(0, 60)}...)` : ''}`).join('\n')}`;
    }

    // List tasks for member
    if (lower.match(/what.*tasks?.*(does|has|for)\s+(\w+)/i)) {
      const nameMatch = lower.match(/(?:does|has|for)\s+(\w+)/i);
      if (nameMatch) {
        const name = nameMatch[1];
        const tasks = store.tasks.filter(t => t.assignees.some(a => a.toLowerCase() === name));
        const mTasks = store.memberTasks.filter(t => t.assigneeName.toLowerCase() === name);
        return `📋 **Tasks for ${name}**\n\nPlan Tasks (${tasks.length}):\n${tasks.map(t => `• [${t.status}] ${t.title} (Week ${t.week})`).join('\n') || '  None'}\n\nMember Tasks (${mTasks.length}):\n${mTasks.map(t => `• [${t.status}] ${t.title} (${t.type})`).join('\n') || '  None'}`;
      }
    }

    return `I understood: "${text}"\n\nTry:\n• "Add a task to [description] week 2"\n• "Add contact [name] from [org] as investor"\n• "Add team member [name] as [role]"\n• "Assign daily task: [title] to [name]"\n• "How are we doing?"\n• "What tasks does Taslim have?"\n• Upload a CSV/Excel file to import data`;
  };

  const pushAssistant = (content: string) => addChatMessage({ role: 'assistant', content });
  const pushUser = (content: string) => addChatMessage({ role: 'user', content, authorName: currentUser?.name });

  const handleFile = async (file: File) => {
    pushUser(`📎 Uploaded: ${file.name}`);
    setLoading(true);

    try {
      let data: any[] = [];
      let headers: string[] = [];

      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const lines = text.split('\n').filter(l => l.trim());
        headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        data = lines.slice(1).map(line => {
          const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row: Record<string, string> = {};
          headers.forEach((h, i) => row[h] = vals[i] || '');
          return row;
        });
      } else if (file.name.match(/\.xlsx?$/)) {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        if (json.length > 0) {
          headers = json[0].map(String);
          data = json.slice(1).map(row => {
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => obj[h] = String(row[i] || ''));
            return obj;
          });
        }
      } else {
        const text = await file.text();
        pushAssistant(`📄 File contents (${text.length} chars):\n\n\`\`\`\n${text.slice(0, 1000)}\n\`\`\`\n\nTell me what to do with this data.`);
        setLoading(false);
        return;
      }

      // Auto-detect: CRM contacts vs team roles vs tasks
      const headerLower = headers.map(h => h.toLowerCase());
      let imported = 0;

      if (headerLower.some(h => h.includes('email') || h.includes('phone') || h.includes('organisation') || h.includes('organization') || h.includes('company'))) {
        // CRM contacts
        data.forEach(row => {
          const name = row[headers.find(h => h.toLowerCase().includes('name')) || ''] || '';
          if (!name) return;
          store.add('contacts', {
            name,
            email: row[headers.find(h => h.toLowerCase().includes('email')) || ''] || '',
            phone: row[headers.find(h => h.toLowerCase().includes('phone')) || ''] || '',
            linkedin: row[headers.find(h => h.toLowerCase().includes('linkedin')) || ''] || '',
            type: 'prospect',
            organisation: row[headers.find(h => h.toLowerCase().match(/organ|company|firm/)) || ''] || '',
            role: row[headers.find(h => h.toLowerCase().includes('role') || h.toLowerCase().includes('title')) || ''] || '',
            notes: row[headers.find(h => h.toLowerCase().includes('note')) || ''] || '',
            tags: [],
          });
          imported++;
        });
        pushAssistant(`✅ Imported **${imported} contacts** into CRM from ${file.name}.\n\nHeaders detected: ${headers.join(', ')}`);
      } else if (headerLower.some(h => h.includes('role') || h.includes('responsibility') || h.includes('vertical'))) {
        // Team roles update
        data.forEach(row => {
          const name = row[headers.find(h => h.toLowerCase().includes('name')) || ''] || '';
          if (!name) return;
          const existing = store.team.find(m => m.name.toLowerCase() === name.toLowerCase());
          if (existing) {
            const updates: Record<string, any> = {};
            const roleCol = headers.find(h => h.toLowerCase().includes('role'));
            const respCol = headers.find(h => h.toLowerCase().match(/responsib|duties/));
            const vertCol = headers.find(h => h.toLowerCase().includes('vertical'));
            if (roleCol && row[roleCol]) updates.role = row[roleCol];
            if (respCol && row[respCol]) updates.responsibilities = row[respCol];
            if (vertCol && row[vertCol]) updates.vertical = row[vertCol];
            store.update('team', existing.id, updates);
            imported++;
          }
        });
        pushAssistant(`✅ Updated **${imported} team members** from ${file.name}.\n\nHeaders: ${headers.join(', ')}`);
      } else {
        pushAssistant(`📊 Parsed **${data.length} rows** from ${file.name}.\n\nHeaders: ${headers.join(', ')}\n\nI could not auto-detect the data type. Tell me: should I import these as **contacts**, **tasks**, or **team updates**?`);
      }
    } catch (err) {
      pushAssistant(`❌ Error parsing file: ${err}`);
    }
    setLoading(false);
  };

  const send = () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    pushUser(text);
    setInput('');
    setLoading(true);
    setTimeout(() => {
      const response = parseAndExecute(text);
      pushAssistant(response);
      setLoading(false);
    }, 300);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: '20px 40px', borderBottom: '2px solid var(--accent)' }}>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700 }}>AI Chat</h1>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>Natural language interface — manage data, upload files, get insights</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 40px 0' }}>
        <button onClick={() => { if (confirm('Clear chat history for everyone?')) clearChatMessages(); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--text-3)', textDecoration: 'underline' }}>
          Clear chat
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 40px' }}>
        {messages.map(m => (
          <div key={m.id} style={{ display: 'flex', gap: 10, marginBottom: 16, maxWidth: 700 }}>
            <div style={{ width: 28, height: 28, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: m.role === 'assistant' ? 'var(--accent-light)' : 'var(--bg-3)' }}>
              {m.role === 'assistant' ? <Bot size={14} color="var(--accent)" /> : <User size={14} color="var(--text-2)" />}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
              {m.role === 'user' && m.authorName && (
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{m.authorName}</div>
              )}
              <div dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-light)' }}>
              <Bot size={14} color="var(--accent)" />
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Processing...</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ padding: '16px 40px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', gap: 8, maxWidth: 700 }}>
          <input type="file" ref={fileRef} style={{ display: 'none' }} accept=".csv,.xlsx,.xls,.pdf,.txt" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
          <button onClick={() => fileRef.current?.click()} style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg)', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Upload file">
            <Paperclip size={14} color="var(--text-3)" />
          </button>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Type a command or question..."
            style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13, outline: 'none', fontFamily: 'var(--sans)', background: 'var(--bg)', color: 'var(--text)' }} />
          <button onClick={send} disabled={!input.trim() || loading} className="btn-primary" style={{ opacity: input.trim() ? 1 : 0.5 }}>
            <Send size={14} /> Send
          </button>
        </div>
      </div>
    </div>
  );
}
