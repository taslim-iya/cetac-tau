import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { useStore } from '../store';
import { id } from '../lib/utils';

interface Message { id: string; role: 'user' | 'assistant'; content: string; timestamp: string; }

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'assistant', content: 'Hi! I\'m the CETAC AI assistant. I can help you:\n\n• **Add tasks** — "Add a task to contact LBS president this week"\n• **Add contacts** — "Add John Smith from Spectra Search as an investor"\n• **Add events** — "Create an event for Week 3 dinner"\n• **Add outreach** — "Track email to Aven Capital"\n• **Summarise progress** — "How are we doing on Week 1?"\n\nWhat would you like to do?', timestamp: new Date().toISOString() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const store = useStore();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const parseAndExecute = (text: string): string => {
    const lower = text.toLowerCase();

    // Add task
    if (lower.includes('add') && lower.includes('task')) {
      const title = text.replace(/add\s+(a\s+)?task\s+(to\s+)?/i, '').trim();
      const weekMatch = lower.match(/week\s*(\d)/);
      const week = weekMatch ? Number(weekMatch[1]) : 1;
      store.add('tasks', { title: title || 'New task', description: '', status: 'todo', priority: 'medium', assignees: [], dueDate: '', week, category: '', completedAt: '' });
      return `✅ Added task: "${title || 'New task'}" to Week ${week}. You can edit it in the Tasks page.`;
    }

    // Add contact
    if (lower.includes('add') && (lower.includes('contact') || lower.includes('investor') || lower.includes('advisor') || lower.includes('alumni'))) {
      const type = lower.includes('investor') ? 'investor' : lower.includes('advisor') ? 'advisor' : lower.includes('alumni') ? 'alumni' : 'prospect';
      const nameMatch = text.match(/(?:add|contact)\s+(.+?)(?:\s+(?:from|as|at)\s|$)/i);
      const orgMatch = text.match(/(?:from|at)\s+(.+?)(?:\s+as\s|$)/i);
      store.add('contacts', { name: nameMatch?.[1] || '', email: '', phone: '', linkedin: '', type, organisation: orgMatch?.[1] || '', role: '', notes: '', tags: [] });
      return `✅ Added ${type}: "${nameMatch?.[1] || 'New contact'}"${orgMatch?.[1] ? ` from ${orgMatch[1]}` : ''}. Fill in details in the CRM.`;
    }

    // Add event
    if (lower.includes('add') && lower.includes('event') || lower.includes('create') && lower.includes('event')) {
      const weekMatch = lower.match(/week\s*(\d)/);
      const week = weekMatch ? Number(weekMatch[1]) : 1;
      const name = text.replace(/(?:add|create)\s+(an?\s+)?event\s+(?:for\s+)?/i, '').replace(/week\s*\d/i, '').trim();
      store.add('events', { name: name || 'New event', description: '', date: '', time: '', venue: '', week, status: 'planned', speakers: [], sponsors: [], attendeeCount: 0, format: '', postEventNotes: '' });
      return `✅ Created event: "${name || 'New event'}" in Week ${week}. Set date and venue in Events.`;
    }

    // Add outreach
    if (lower.includes('track') && lower.includes('email') || lower.includes('add') && lower.includes('outreach')) {
      const toMatch = text.match(/(?:to|email)\s+(.+?)(?:\s+about\s|$)/i);
      store.add('outreach', { contactName: toMatch?.[1] || '', contactEmail: '', subject: '', message: '', status: 'draft', sentDate: '', followUpDate: '', category: '', notes: '' });
      return `✅ Tracking outreach to "${toMatch?.[1] || 'contact'}". Update status in Outreach.`;
    }

    // Progress summary
    if (lower.includes('progress') || lower.includes('how') && lower.includes('doing') || lower.includes('summary') || lower.includes('status')) {
      const weekMatch = lower.match(/week\s*(\d)/);
      if (weekMatch) {
        const w = Number(weekMatch[1]);
        const wTasks = store.tasks.filter(t => t.week === w);
        const done = wTasks.filter(t => t.status === 'done').length;
        const inProg = wTasks.filter(t => t.status === 'in_progress').length;
        const event = store.events.find(e => e.week === w);
        return `📊 **Week ${w} Progress**\n\n• Tasks: ${done}/${wTasks.length} done, ${inProg} in progress\n• Event: ${event ? `${event.name} (${event.status})` : 'None'}\n• Key tasks remaining:\n${wTasks.filter(t => t.status !== 'done').slice(0, 5).map(t => `  – ${t.title}`).join('\n') || '  None — all done!'}`;
      }
      const total = store.tasks.length;
      const done = store.tasks.filter(t => t.status === 'done').length;
      return `📊 **Overall Progress**\n\n• Tasks: ${done}/${total} completed (${total ? Math.round(done/total*100) : 0}%)\n• Team: ${store.team.filter(t => t.status === 'active').length} active members\n• Events: ${store.events.length} planned\n• Partnerships: ${store.partnerships.length} tracked\n• Contacts: ${store.contacts.length} in CRM\n• Content: ${store.content.length} items`;
    }

    return `I understood: "${text}"\n\nTry commands like:\n• "Add a task to [description]"\n• "Add [name] from [org] as investor"\n• "Create an event for Week 3"\n• "Track email to [name]"\n• "How are we doing on Week 1?"`;
  };

  const send = () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { id: id(), role: 'user', content: input.trim(), timestamp: new Date().toISOString() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      const response = parseAndExecute(userMsg.content);
      setMessages(m => [...m, { id: id(), role: 'assistant', content: response, timestamp: new Date().toISOString() }]);
      setLoading(false);
    }, 400);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: '20px 40px', borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>AI Chat</h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 2 }}>Natural language interface — add data, get summaries</p>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px 40px' }}>
        {messages.map(m => (
          <div key={m.id} style={{ display: 'flex', gap: 10, marginBottom: 16, maxWidth: 700 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: m.role === 'assistant' ? 'var(--accent-light)' : 'var(--bg-3)' }}>
              {m.role === 'assistant' ? <Bot size={14} color="var(--accent)" /> : <User size={14} color="var(--text-2)" />}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text)', whiteSpace: 'pre-wrap' }}
              dangerouslySetInnerHTML={{ __html: m.content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code style="background:var(--bg-3);padding:1px 4px;border-radius:3px;font-size:12px">$1</code>') }} />
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-light)' }}>
              <Bot size={14} color="var(--accent)" />
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Thinking...</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ padding: '16px 40px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', gap: 8, maxWidth: 700 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Type a command or question..."
            style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
          <button onClick={send} disabled={!input.trim() || loading}
            style={{ padding: '10px 16px', border: 'none', borderRadius: 8, background: input.trim() ? 'var(--accent)' : 'var(--bg-3)', color: input.trim() ? 'white' : 'var(--text-3)', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
            <Send size={14} /> Send
          </button>
        </div>
      </div>
    </div>
  );
}
