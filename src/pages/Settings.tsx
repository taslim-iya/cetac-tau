import { useStore } from '../store';
import { Save, Trash2, Download, Upload } from 'lucide-react';
import { useState } from 'react';

export default function Settings() {
  const { settings, updateSettings, tasks, contacts, team, events, partnerships, content, outreach } = useStore();
  const [saved, setSaved] = useState(false);

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const exportData = () => {
    const data = { tasks, contacts, team, events, partnerships, content, outreach, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `cetac-export-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const clearData = () => {
    if (confirm('This will clear ALL data (tasks, contacts, events, partnerships, content, outreach). Are you sure?')) {
      localStorage.removeItem('cetac-store');
      window.location.reload();
    }
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 600 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Settings</h1>
      <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 28 }}>Configuration and data management</p>

      {/* API Key */}
      <div style={{ marginBottom: 28 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>OpenAI API Key (optional — for AI chat)</label>
        <input value={settings.openaiApiKey} onChange={e => updateSettings({ openaiApiKey: e.target.value })}
          type="password" placeholder="sk-..."
          style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }} />
      </div>

      {/* Club email */}
      <div style={{ marginBottom: 28 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Club Email</label>
        <input value={settings.clubEmail} onChange={e => updateSettings({ clubEmail: e.target.value })}
          placeholder="eta@cam.ac.uk"
          style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
      </div>

      {/* Notify email */}
      <div style={{ marginBottom: 28 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Notification Email</label>
        <input value={settings.notifyEmail} onChange={e => updateSettings({ notifyEmail: e.target.value })}
          placeholder="taslim@example.com"
          style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
      </div>

      <button onClick={save} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: 'none', borderRadius: 8, background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 32 }}>
        <Save size={14} /> {saved ? 'Saved!' : 'Save Settings'}
      </button>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 0 28px' }} />

      {/* Data summary */}
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Data Summary</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 24 }}>
        {[
          { label: 'Tasks', count: tasks.length },
          { label: 'Team', count: team.length },
          { label: 'Events', count: events.length },
          { label: 'Partnerships', count: partnerships.length },
          { label: 'Contacts', count: contacts.length },
          { label: 'Content', count: content.length },
          { label: 'Outreach', count: outreach.length },
        ].map(d => (
          <div key={d.label} style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 6 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{d.count}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{d.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={exportData} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg)', color: 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <Download size={13} /> Export JSON
        </button>
        <button onClick={clearData} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid var(--red)', borderRadius: 6, background: 'var(--bg)', color: 'var(--red)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <Trash2 size={13} /> Clear All Data
        </button>
      </div>
    </div>
  );
}
