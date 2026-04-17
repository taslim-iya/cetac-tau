import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Target, Calendar, CheckSquare, Users, Handshake, Award,
  UserPlus, BookOpen, Send, Mail, Trophy, MessageSquare, Upload, Download,
  Shield, Settings, Moon, Sun, Plus, Search as SearchIcon,
} from 'lucide-react';
import { useStore } from '../store';

type Cmd = {
  id: string;
  group: string;
  label: string;
  hint?: string;
  kbd?: string;
  icon: any;
  run: () => void;
};

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode, add } = useStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const close = () => setOpen(false);
  const go = (path: string) => { navigate(path); close(); };

  const commands: Cmd[] = useMemo(() => [
    // Navigate
    { id: 'go-dashboard',  group: 'Go to', label: 'Dashboard',       icon: LayoutDashboard, run: () => go('/') },
    { id: 'go-plan',       group: 'Go to', label: '9-Week Plan',     icon: Target,          run: () => go('/plan') },
    { id: 'go-calendar',   group: 'Go to', label: 'Calendar',        icon: Calendar,        run: () => go('/calendar') },
    { id: 'go-tasks',      group: 'Go to', label: 'Tasks',           icon: CheckSquare,     run: () => go('/tasks') },
    { id: 'go-events',     group: 'Go to', label: 'Events',          icon: Calendar,        run: () => go('/events') },
    { id: 'go-team',       group: 'Go to', label: 'Team',            icon: Users,           run: () => go('/team') },
    { id: 'go-roles',      group: 'Go to', label: 'Roles',           icon: UserPlus,        run: () => go('/roles') },
    { id: 'go-partners',   group: 'Go to', label: 'Partnerships',    icon: Handshake,       run: () => go('/partnerships') },
    { id: 'go-sponsors',   group: 'Go to', label: 'Sponsors',        icon: Award,           run: () => go('/sponsors') },
    { id: 'go-crm',        group: 'Go to', label: 'CRM',             icon: Users,           run: () => go('/crm') },
    { id: 'go-outreach',   group: 'Go to', label: 'Outreach',        icon: Send,            run: () => go('/outreach') },
    { id: 'go-content',    group: 'Go to', label: 'Content',         icon: BookOpen,        run: () => go('/content') },
    { id: 'go-templates',  group: 'Go to', label: 'Templates',       icon: Mail,            run: () => go('/templates') },
    { id: 'go-search-day', group: 'Go to', label: 'Search Day',      icon: Trophy,          run: () => go('/search-day') },
    { id: 'go-chat',       group: 'Go to', label: 'AI Chat',         icon: MessageSquare,   run: () => go('/chat') },
    { id: 'go-import',     group: 'Go to', label: 'Import',          icon: Upload,          run: () => go('/import') },
    { id: 'go-export',     group: 'Go to', label: 'Export',          icon: Download,        run: () => go('/export') },
    { id: 'go-portal',     group: 'Go to', label: 'Team Portal',     icon: Shield,          run: () => go('/team-portal') },
    { id: 'go-settings',   group: 'Go to', label: 'Settings',        icon: Settings,        run: () => go('/settings') },

    // Create
    { id: 'new-task', group: 'Create', label: 'New Task', icon: Plus, hint: 'Add to Tasks',
      run: () => { add('tasks', { title: '', description: '', status: 'todo', priority: 'medium', assignees: [], dueDate: '', week: 1, category: '', completedAt: '' }); go('/tasks'); } },
    { id: 'new-event', group: 'Create', label: 'New Event', icon: Plus, hint: 'Add to Events',
      run: () => { add('events', { name: '', description: '', date: '', time: '', venue: '', week: 1, status: 'planned', speakers: [], sponsors: [], attendeeCount: 0, format: '', postEventNotes: '', checklist: [] }); go('/events'); } },
    { id: 'new-contact', group: 'Create', label: 'New Contact', icon: Plus, hint: 'Add to CRM',
      run: () => { add('contacts', { name: '', email: '', phone: '', linkedin: '', type: 'prospect', organisation: '', role: '', notes: '', tags: [] }); go('/crm'); } },
    { id: 'new-partnership', group: 'Create', label: 'New Partnership', icon: Plus, hint: 'Add to Partnerships',
      run: () => { add('partnerships', { name: '', type: 'other', contactPerson: '', contactEmail: '', status: 'prospect', notes: '', lastContactDate: '', nextAction: '' }); go('/partnerships'); } },
    { id: 'new-member', group: 'Create', label: 'New Team Member', icon: Plus, hint: 'Add to Team',
      run: () => { add('team', { name: '', role: '', responsibilities: '', email: '', phone: '', linkedin: '', status: 'new', vertical: '' }); go('/team'); } },

    // Preferences
    { id: 'toggle-theme', group: 'Preferences', label: darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      icon: darkMode ? Sun : Moon, run: () => { toggleDarkMode(); close(); } },
  ], [darkMode, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(c =>
      c.label.toLowerCase().includes(q)
      || c.group.toLowerCase().includes(q)
      || (c.hint || '').toLowerCase().includes(q)
    );
  }, [query, commands]);

  useEffect(() => { setActive(0); }, [query]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(results.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); results[active]?.run(); }
  };

  if (!open) return null;

  const grouped: [string, Cmd[]][] = [];
  for (const c of results) {
    const last = grouped[grouped.length - 1];
    if (last && last[0] === c.group) last[1].push(c);
    else grouped.push([c.group, [c]]);
  }

  let idx = 0;
  return (
    <div className="cmdk-overlay" onClick={close}>
      <div className="cmdk-panel" onClick={e => e.stopPropagation()}>
        <div style={{ position: 'relative' }}>
          <SearchIcon size={15} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            ref={inputRef}
            className="cmdk-input"
            placeholder="Jump to a page, create, or run a command..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            style={{ paddingLeft: 44 }}
          />
        </div>
        <div className="cmdk-list">
          {results.length === 0 ? (
            <div className="cmdk-empty">No results for "{query}"</div>
          ) : grouped.map(([group, items]) => (
            <div key={group}>
              <div className="cmdk-group-label">{group}</div>
              {items.map(c => {
                const myIdx = idx++;
                const isActive = myIdx === active;
                return (
                  <div
                    key={c.id}
                    className="cmdk-item"
                    data-active={isActive}
                    onMouseEnter={() => setActive(myIdx)}
                    onClick={() => c.run()}
                  >
                    <span className="cmdk-item-icon"><c.icon size={14} strokeWidth={2} /></span>
                    <span>{c.label}</span>
                    {c.hint && <span style={{ color: 'var(--text-3)', fontSize: 12 }}>· {c.hint}</span>}
                    {c.kbd && <span className="cmdk-kbd">{c.kbd}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="cmdk-footer">
          <span><span className="cmdk-kbd">↑</span> <span className="cmdk-kbd">↓</span> navigate</span>
          <span><span className="cmdk-kbd">↵</span> select</span>
          <span><span className="cmdk-kbd">esc</span> close</span>
        </div>
      </div>
    </div>
  );
}
