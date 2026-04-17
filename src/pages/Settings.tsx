import { useStore } from '../store';
import { Save, Trash2, Download } from 'lucide-react';
import { useState } from 'react';

export default function Settings() {
  const { settings, updateSettings, tasks, contacts, team, events, partnerships, content, outreach, memberTasks } = useStore();
  const [saved, setSaved] = useState(false);

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const exportData = () => {
    const data = { tasks, contacts, team, events, partnerships, content, outreach, memberTasks, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `cetac-export-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const clearData = () => {
    if (confirm('This will clear ALL data. Are you sure?')) {
      localStorage.removeItem('cetac-store');
      window.location.reload();
    }
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 600 }}>
      <div className="page-header">
        <h1>Settings</h1>
        <p>Configuration and data management</p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>OpenAI API Key (optional)</label>
        <input value={settings.openaiApiKey} onChange={e => updateSettings({ openaiApiKey: e.target.value })}
          type="password" placeholder="sk-..."
          style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13, outline: 'none', fontFamily: 'monospace', background: 'var(--bg)', color: 'var(--text)' }} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Club Email</label>
        <input value={settings.clubEmail} onChange={e => updateSettings({ clubEmail: e.target.value })}
          placeholder="team@etacambridge.co.uk"
          style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13, outline: 'none', background: 'var(--bg)', color: 'var(--text)' }} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Notification Email</label>
        <input value={settings.notifyEmail} onChange={e => updateSettings({ notifyEmail: e.target.value })}
          placeholder="taslim@example.com"
          style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13, outline: 'none', background: 'var(--bg)', color: 'var(--text)' }} />
      </div>

      <button onClick={save} className="btn-primary" style={{ marginBottom: 32 }}>
        <Save size={14} /> {saved ? 'Saved!' : 'Save Settings'}
      </button>

      <div className="section-ruled">
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Data Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 24 }}>
          {[
            { label: 'Tasks', count: tasks.length },
            { label: 'Team', count: team.length },
            { label: 'Events', count: events.length },
            { label: 'Partnerships', count: partnerships.length },
            { label: 'Contacts', count: contacts.length },
            { label: 'Content', count: content.length },
            { label: 'Outreach', count: outreach.length },
            { label: 'Member Tasks', count: memberTasks.length },
          ].map(d => (
            <div key={d.label} className="card" style={{ padding: '10px 14px' }}>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--serif)' }}>{d.count}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{d.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportData} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg)', color: 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
            <Download size={13} /> Export JSON
          </button>
          <button onClick={clearData} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid var(--red)', borderRadius: 4, background: 'var(--bg)', color: 'var(--red)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
            <Trash2 size={13} /> Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
}
