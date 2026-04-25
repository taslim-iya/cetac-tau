import { useState, useEffect } from 'react';
import { Check, Crown, Save, Wand2 } from 'lucide-react';
import { useStore } from '../store';
import type { AccessOverride } from '../store';
import { autoModulesForRole } from '../lib/permissions';

// Permission modules
const MODULES = [
  { key: 'dashboard', label: 'Dashboard', desc: 'View stats and progress' },
  { key: 'plan', label: '9-Week Plan', desc: 'View and update plan' },
  { key: 'calendar', label: 'Calendar', desc: 'View calendar' },
  { key: 'tasks', label: 'Tasks', desc: 'View and manage tasks' },
  { key: 'events', label: 'Events', desc: 'View and manage events' },
  { key: 'partnerships', label: 'Partnerships', desc: 'View and manage partnerships' },
  { key: 'sponsors', label: 'Sponsor Pipeline', desc: 'Manage sponsor relationships' },
  { key: 'crm', label: 'CRM', desc: 'Contacts database' },
  { key: 'roles', label: 'Roles', desc: 'Role assignments' },
  { key: 'content', label: 'Content', desc: 'Content management' },
  { key: 'outreach', label: 'Outreach', desc: 'Email outreach tracking' },
  { key: 'memberTasks', label: 'Member Tasks', desc: 'Daily/weekly/one-off tasks' },
  { key: 'templates', label: 'Templates', desc: 'Email templates' },
  { key: 'searchDay', label: 'Search Day', desc: 'Search Day command centre' },
  { key: 'chat', label: 'AI Chat', desc: 'AI assistant' },
  { key: 'import', label: 'Import', desc: 'Import data' },
  { key: 'export', label: 'Export', desc: 'Export data' },
  { key: 'playbook', label: 'Playbook', desc: 'Role playbooks and KPIs' },
  { key: 'kpi', label: 'KPI Tracker', desc: 'KPI tracking by vertical' },
  { key: 'resources', label: 'Resources', desc: 'Links and documents' },
  { key: 'settings', label: 'Settings', desc: 'App settings' },
  { key: 'teamPortal', label: 'Team Management', desc: 'Manage team access (admin only)' },
];

// Role presets
const ROLE_PRESETS: Record<string, string[]> = {
  'President': MODULES.map(m => m.key), // Full access
  'VP Partnerships — External': ['dashboard', 'plan', 'calendar', 'partnerships', 'sponsors', 'crm', 'outreach', 'templates', 'searchDay', 'export', 'playbook', 'kpi', 'resources', 'memberTasks'],
  'VP Communications & Sponsorship': ['dashboard', 'plan', 'calendar', 'content', 'outreach', 'templates', 'crm', 'sponsors', 'export', 'playbook', 'kpi', 'resources', 'memberTasks'],
  'VP Operations': ['dashboard', 'plan', 'calendar', 'tasks', 'events', 'roles', 'teamPortal', 'export', 'import', 'playbook', 'kpi', 'resources', 'memberTasks'],
  'VP Administration & Events': ['dashboard', 'plan', 'calendar', 'events', 'searchDay', 'tasks', 'export', 'playbook', 'kpi', 'resources', 'memberTasks'],
  'VP Community': ['dashboard', 'plan', 'calendar', 'crm', 'content', 'outreach', 'templates', 'playbook', 'kpi', 'resources', 'memberTasks'],
  'Member': ['dashboard', 'plan', 'calendar', 'tasks', 'events', 'playbook', 'resources', 'memberTasks'],
  'Potential Member': ['dashboard', 'plan', 'calendar', 'resources'],
};

type MemberAccess = AccessOverride;

export default function TeamPortal() {
  const { team, users, addUser, updateUser, removeUser, accessOverrides, setAccessOverrides } = useStore();

  // Local working copy so the editor doesn't fire a remote save on every
  // checkbox click. Synced from the global store on load and after Save.
  const [accessList, setAccessList] = useState<MemberAccess[]>(() => seedAccess(team, accessOverrides));

  // If the team list grows (a new member is added) while this page is open,
  // make sure the new member appears in the access list with role defaults.
  useEffect(() => {
    setAccessList(prev => {
      const byId = new Map(prev.map(a => [a.memberId, a]));
      let changed = false;
      for (const m of team) {
        if (!byId.has(m.id)) {
          byId.set(m.id, defaultAccessFor(m));
          changed = true;
        }
      }
      return changed ? [...byId.values()] : prev;
    });
  }, [team]);

  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAcct, setNewAcct] = useState({ name: '', email: '', password: '', role: 'team_member' as 'super_admin' | 'team_member' });

  const saveAccess = () => {
    // Push to the synced store so every browser sees the new permissions on
    // their next poll/reload, instead of leaving them in this tab's localStorage.
    setAccessOverrides(accessList);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const getAccess = (memberId: string) => accessList.find(a => a.memberId === memberId);

  const togglePermission = (memberId: string, module: string) => {
    setAccessList(prev => prev.map(a => {
      if (a.memberId !== memberId) return a;
      const perms = a.permissions.includes(module)
        ? a.permissions.filter(p => p !== module)
        : [...a.permissions, module];
      return { ...a, permissions: perms };
    }));
  };

  const toggleAdmin = (memberId: string) => {
    setAccessList(prev => prev.map(a =>
      a.memberId === memberId ? { ...a, isAdmin: !a.isAdmin } : a
    ));
  };

  const setPin = (memberId: string, pin: string) => {
    setAccessList(prev => prev.map(a =>
      a.memberId === memberId ? { ...a, pin: pin.slice(0, 4) } : a
    ));
  };

  const applyPreset = (memberId: string, role: string) => {
    const perms = ROLE_PRESETS[role] || ROLE_PRESETS['Member'];
    setAccessList(prev => prev.map(a =>
      a.memberId === memberId ? { ...a, permissions: perms } : a
    ));
  };

  const selectAll = (memberId: string) => {
    setAccessList(prev => prev.map(a =>
      a.memberId === memberId ? { ...a, permissions: MODULES.map(m => m.key) } : a
    ));
  };

  const selectNone = (memberId: string) => {
    setAccessList(prev => prev.map(a =>
      a.memberId === memberId ? { ...a, permissions: ['dashboard'] } : a // Always keep dashboard
    ));
  };

  const selected = selectedMember ? team.find(m => m.id === selectedMember) : null;
  const selectedAccess = selectedMember ? getAccess(selectedMember) : null;

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Team Portal</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 2 }}>Manage individual access and permissions</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => {
            setAccessList(prev => prev.map(a => {
              const member = team.find(m => m.id === a.memberId);
              if (!member) return a;
              return { ...a, permissions: autoModulesForRole(member.role) };
            }));
          }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg)', color: 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <Wand2 size={14} /> Auto-assign All
          </button>
          <button onClick={saveAccess} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: 'none', borderRadius: 6, background: saved ? 'var(--green)' : 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}>
            {saved ? <Check size={14} /> : <Save size={14} />} {saved ? 'Saved!' : 'Save Permissions'}
          </button>
        </div>
      </div>

      {/* Account Management */}
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showAddAccount ? 12 : 0 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--serif)' }}>Login Accounts</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{users.length} account{users.length !== 1 ? 's' : ''} — team members use these to sign in</div>
          </div>
          <button onClick={() => setShowAddAccount(!showAddAccount)} className="btn-primary" style={{ padding: '6px 12px', fontSize: 11 }}>
            {showAddAccount ? 'Cancel' : '+ Create Account'}
          </button>
        </div>

        {showAddAccount && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap', padding: '12px 0', borderTop: '1px solid var(--border)', marginTop: 12 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>Name</label>
              <input value={newAcct.name} onChange={e => setNewAcct(p => ({ ...p, name: e.target.value }))} placeholder="Andres"
                style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 3, fontSize: 12, background: 'var(--bg)', color: 'var(--text)', width: 140 }} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>Email</label>
              <input value={newAcct.email} onChange={e => setNewAcct(p => ({ ...p, email: e.target.value }))} placeholder="andres@etacambridge.co.uk"
                style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 3, fontSize: 12, background: 'var(--bg)', color: 'var(--text)', width: 220 }} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>Password</label>
              <input value={newAcct.password} onChange={e => setNewAcct(p => ({ ...p, password: e.target.value }))} placeholder="password"
                style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 3, fontSize: 12, background: 'var(--bg)', color: 'var(--text)', width: 140 }} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>Role</label>
              <select value={newAcct.role} onChange={e => setNewAcct(p => ({ ...p, role: e.target.value as any }))}
                style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 3, fontSize: 12, background: 'var(--bg)', color: 'var(--text)' }}>
                <option value="team_member">Team Member</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <button onClick={() => {
              if (!newAcct.name || !newAcct.email || !newAcct.password) return;
              addUser({ name: newAcct.name, email: newAcct.email, password: newAcct.password, role: newAcct.role, permissions: {} });
              setNewAcct({ name: '', email: '', password: '', role: 'team_member' });
              setShowAddAccount(false);
            }} className="btn-primary" style={{ padding: '6px 12px', fontSize: 11 }}>Create</button>
          </div>
        )}

        {/* Existing accounts list — editable */}
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {users.map(u => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 3, background: 'var(--bg-2)', fontSize: 12, gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap' }}>
                <input value={u.name} onChange={e => updateUser(u.id, { name: e.target.value })}
                  style={{ fontWeight: 600, minWidth: 80, width: 100, padding: '3px 6px', border: '1px solid var(--border)', borderRadius: 3, fontSize: 12, background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--sans)' }} />
                <input value={u.email} onChange={e => updateUser(u.id, { email: e.target.value })}
                  style={{ minWidth: 180, width: 220, padding: '3px 6px', border: '1px solid var(--border)', borderRadius: 3, fontSize: 12, background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--sans)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600 }}>pw:</span>
                  <input value={u.password} onChange={e => updateUser(u.id, { password: e.target.value })}
                    style={{ width: 120, padding: '3px 6px', border: '1px solid var(--border)', borderRadius: 3, fontSize: 11, background: 'var(--bg)', color: 'var(--text)', fontFamily: 'monospace', letterSpacing: '0.03em' }} />
                </div>
                <select value={u.role} onChange={e => updateUser(u.id, { role: e.target.value as any })}
                  style={{ padding: '3px 6px', border: '1px solid var(--border)', borderRadius: 3, fontSize: 10, background: u.role === 'super_admin' ? 'var(--gold-light)' : 'var(--blue-light)', color: u.role === 'super_admin' ? 'var(--gold)' : 'var(--blue)', fontWeight: 600, textTransform: 'uppercase' }}>
                  <option value="super_admin">Admin</option>
                  <option value="team_member">Member</option>
                </select>
              </div>
              {u.email !== 'admin@etacambridge.co.uk' && (
                <button onClick={() => removeUser(u.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--red)', whiteSpace: 'nowrap' }}>Remove</button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="team-portal-grid" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
        {/* Member list */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', background: 'var(--bg-2)', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>
            Team Members ({team.length})
          </div>
          <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 250px)' }}>
            {team.map(m => {
              const access = getAccess(m.id);
              const active = selectedMember === m.id;
              return (
                <div key={m.id} onClick={() => setSelectedMember(m.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                    cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)',
                    background: active ? 'var(--accent-light)' : 'var(--bg)',
                    borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
                  }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-2)', flexShrink: 0 }}>
                    {m.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {m.name}
                      {access?.isAdmin && <Crown size={11} color="var(--yellow)" />}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.role}</div>
                  </div>
                  <div style={{ fontSize: 9, padding: '1px 5px', borderRadius: 6, background: m.status === 'active' ? 'var(--green-light)' : 'var(--yellow-light)', color: m.status === 'active' ? 'var(--green)' : 'var(--yellow)', fontWeight: 600 }}>
                    {m.status}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Permission editor */}
        {selected && selectedAccess ? (
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            {/* Member header */}
            <div style={{ padding: '16px 20px', background: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>
                  {selected.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{selected.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{selected.role}</div>
                </div>
              </div>

              {/* Login credentials */}
              {(() => {
                const userAcct = users.find(u => u.name === selected.name || u.teamMemberId === selected.id);
                return userAcct ? (
                  <div style={{ padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, marginBottom: 10, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Login</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Email:</span>
                      <code style={{ fontSize: 11, color: 'var(--text)', background: 'var(--bg-3)', padding: '1px 6px', borderRadius: 2 }}>{userAcct.email}</code>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Password:</span>
                      <code style={{ fontSize: 11, color: 'var(--text)', background: 'var(--bg-3)', padding: '1px 6px', borderRadius: 2 }}>{userAcct.password}</code>
                    </div>
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 2, background: userAcct.role === 'super_admin' ? 'var(--gold-light)' : 'var(--blue-light)', color: userAcct.role === 'super_admin' ? 'var(--gold)' : 'var(--blue)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {userAcct.role === 'super_admin' ? 'Admin' : 'Member'}
                    </span>
                  </div>
                ) : null;
              })()}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {/* Admin toggle */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: selectedAccess.isAdmin ? 'var(--yellow-light)' : 'var(--bg)' }}>
                  <input type="checkbox" checked={selectedAccess.isAdmin} onChange={() => toggleAdmin(selected.id)} style={{ accentColor: 'var(--accent)' }} />
                  <Crown size={12} color="var(--yellow)" /> Admin
                </label>

                {/* PIN */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>PIN:</span>
                  <input value={selectedAccess.pin} onChange={e => setPin(selected.id, e.target.value.replace(/\D/g, ''))}
                    placeholder="0000" maxLength={4}
                    style={{ width: 56, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, fontFamily: 'monospace', textAlign: 'center', outline: 'none', background: 'var(--bg)', color: 'var(--text)' }} />
                </div>

                {/* Presets */}
                <select onChange={e => { if (e.target.value) applyPreset(selected.id, e.target.value); e.target.value = ''; }}
                  style={{ padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, background: 'var(--bg)', color: 'var(--text)' }}>
                  <option value="">Apply preset...</option>
                  {Object.keys(ROLE_PRESETS).map(r => <option key={r} value={r}>{r}</option>)}
                </select>

                <button onClick={() => {
                  const autoPerms = autoModulesForRole(selected.role);
                  setAccessList(prev => prev.map(a => a.memberId === selected.id ? { ...a, permissions: autoPerms } : a));
                }} style={{ ...quickBtn, background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Wand2 size={11} /> Auto
                </button>
                <button onClick={() => selectAll(selected.id)} style={quickBtn}>All</button>
                <button onClick={() => selectNone(selected.id)} style={quickBtn}>None</button>
              </div>
            </div>

            {/* Permissions grid */}
            <div style={{ padding: '16px 20px', overflow: 'auto', maxHeight: 'calc(100vh - 380px)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                Accessible Modules ({selectedAccess.permissions.length}/{MODULES.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 6 }}>
                {MODULES.map(mod => {
                  const enabled = selectedAccess.permissions.includes(mod.key);
                  return (
                    <div key={mod.key} onClick={() => togglePermission(selected.id, mod.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                        border: `1px solid ${enabled ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 8, cursor: 'pointer', transition: 'all 0.1s',
                        background: enabled ? 'var(--accent-light)' : 'var(--bg)',
                      }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: 4,
                        border: `1.5px solid ${enabled ? 'var(--accent)' : 'var(--border)'}`,
                        background: enabled ? 'var(--accent)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {enabled && <Check size={12} color="white" />}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: enabled ? 'var(--accent)' : 'var(--text)' }}>{mod.label}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{mod.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: 'var(--text-3)', fontSize: 13 }}>
            Select a team member to manage their access
          </div>
        )}
      </div>
    </div>
  );
}

const quickBtn: React.CSSProperties = { padding: '4px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, background: 'var(--bg)', cursor: 'pointer', fontWeight: 500, color: 'var(--text-2)' };

function defaultAccessFor(m: { id: string; role: string }): MemberAccess {
  return {
    memberId: m.id,
    permissions: ROLE_PRESETS[m.role] || ROLE_PRESETS['Member'] || ['dashboard', 'plan', 'calendar'],
    isAdmin: m.role === 'President' || m.role === 'VP Operations',
    pin: '',
  };
}

function seedAccess(team: { id: string; role: string }[], overrides: AccessOverride[]): MemberAccess[] {
  const byId = new Map<string, MemberAccess>(overrides.map(o => [o.memberId, o]));
  for (const m of team) if (!byId.has(m.id)) byId.set(m.id, defaultAccessFor(m));
  return [...byId.values()];
}
