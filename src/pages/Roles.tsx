import { useState } from 'react';
import { UserPlus, Check, Clock, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import EditableCell from '../components/EditableCell';
import { useStore } from '../store';
import { generatePlaybookForRole, matchTeamToPlaybook } from '../lib/ai-role';

const STATUS_ICON = { vacant: AlertTriangle, interviewing: Clock, filled: Check };
const STATUS_COLOR = { vacant: 'var(--red)', interviewing: 'var(--yellow)', filled: 'var(--green)' };
const STATUS_BG = { vacant: 'var(--red-light)', interviewing: 'var(--yellow-light)', filled: 'var(--green-light)' };
const STATUS_OPTS = [{ value: 'vacant', label: 'Vacant' }, { value: 'interviewing', label: 'Interviewing' }, { value: 'filled', label: 'Filled' }];

interface RoleCard {
  id: string; title: string; description: string; skills: string;
  candidates: string; status: 'vacant' | 'interviewing' | 'filled'; filledBy: string;
}

export default function Roles() {
  const { roles, addRole, playbooks, addPlaybook, team, update: storeUpdate } = useStore();
  const [generating, setGenerating] = useState<string | null>(null);

  // Build role cards from the global roles list + playbook data
  const [localCards, setLocalCards] = useState<Record<string, Partial<RoleCard>>>({});

  const roleCards: RoleCard[] = roles.map(role => {
    const pb = playbooks.find(p => p.role.toLowerCase() === role.toLowerCase());
    const holder = pb?.holder || '';
    const filledMember = team.find(m => m.name === holder && holder !== 'Vacant');
    const local = localCards[role] || {};
    return {
      id: role,
      title: role,
      description: local.description || pb?.primaryTermKPI || '',
      skills: local.skills || '',
      candidates: local.candidates || '',
      status: local.status || (filledMember ? 'filled' : pb && pb.holder !== 'Vacant' ? 'filled' : 'vacant'),
      filledBy: local.filledBy || (filledMember ? filledMember.name : pb?.holder === 'Vacant' ? '' : pb?.holder || ''),
    };
  });

  const updateCard = (role: string, updates: Partial<RoleCard>) => {
    setLocalCards(prev => ({ ...prev, [role]: { ...prev[role], ...updates } }));
  };

  const handleAddRole = async () => {
    const name = prompt('Enter new role title:');
    if (!name?.trim()) return;
    const roleName = name.trim();
    
    // Add to global roles
    addRole(roleName);
    
    // Generate playbook with AI
    const hasPlaybook = playbooks.some(p => p.role.toLowerCase() === roleName.toLowerCase());
    if (!hasPlaybook) {
      setGenerating(roleName);
      try {
        const pb = await generatePlaybookForRole(roleName, playbooks);
        // AI-match team members to this new playbook
        const activeTeam = team.filter(m => m.name && (!m.status || m.status === 'active' || m.status === 'new'));
        const matchedNames = await matchTeamToPlaybook(roleName, activeTeam.map(m => ({ name: m.name, role: m.role })));
        if (matchedNames.length > 0) {
          pb.assignedTo = matchedNames;
          if (pb.holder === 'Vacant') pb.holder = matchedNames[0];
        }
        addPlaybook(pb);
      } catch (e) { console.error('Playbook generation failed:', e); }
      setGenerating(null);
    }
  };

  const handleFill = (role: string, memberName: string) => {
    updateCard(role, { filledBy: memberName, status: 'filled' });
    // Update the playbook holder
    const pb = playbooks.find(p => p.role.toLowerCase() === role.toLowerCase());
    if (pb) {
      const { updatePlaybook } = useStore.getState();
      updatePlaybook(pb.id, { holder: memberName });
    }
    // Update the team member's role
    const member = team.find(m => m.name === memberName);
    if (member) {
      storeUpdate('team', member.id, { role });
    }
  };

  const vacant = roleCards.filter(r => r.status === 'vacant').length;
  const interviewing = roleCards.filter(r => r.status === 'interviewing').length;
  const filled = roleCards.filter(r => r.status === 'filled').length;

  const activeMembers = team.filter(m => m.name && (!m.status || m.status === 'active' || m.status === 'new'));

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Role Assignments</h1>
          <p>Fill critical team positions · {roles.length} roles</p>
        </div>
        <button onClick={handleAddRole} className="btn-primary" disabled={!!generating}>
          {generating ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <UserPlus size={14} />}
          {generating ? `Creating ${generating}...` : 'Add Role'}
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[{ label: 'Vacant', count: vacant, color: 'var(--red)', bg: 'var(--red-light)' },
          { label: 'Interviewing', count: interviewing, color: 'var(--yellow)', bg: 'var(--yellow-light)' },
          { label: 'Filled', count: filled, color: 'var(--green)', bg: 'var(--green-light)' }].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 18px', borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'var(--serif)' }}>{s.count}</div>
            <div style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Info banner */}
      {generating && (
        <div style={{ padding: '10px 16px', background: 'var(--accent-light)', border: '1px solid var(--accent)', borderRadius: 6, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--accent)' }}>
          <Sparkles size={14} /> AI is generating a playbook for "{generating}" with daily/weekly/monthly cadence, KPIs, and SOPs...
        </div>
      )}

      {/* Roles grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {roleCards.map(r => {
          const Icon = STATUS_ICON[r.status];
          const hasPb = playbooks.some(p => p.role.toLowerCase() === r.title.toLowerCase());
          return (
            <div key={r.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: STATUS_BG[r.status] }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                  <Icon size={14} color={STATUS_COLOR[r.status]} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{r.title}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {hasPb && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'var(--accent-light)', color: 'var(--accent)', fontWeight: 600 }}>PLAYBOOK</span>}
                  <EditableCell value={r.status} onChange={v => updateCard(r.title, { status: v as any })} type="select" options={STATUS_OPTS} />
                </div>
              </div>

              <div style={{ padding: '12px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, minHeight: 36 }}>
                  <EditableCell value={r.description} onChange={v => updateCard(r.title, { description: v })} placeholder="Role description..." />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 2 }}>Skills Needed</label>
                    <EditableCell value={r.skills} onChange={v => updateCard(r.title, { skills: v })} placeholder="Required skills" />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 2 }}>Candidates</label>
                    <EditableCell value={r.candidates} onChange={v => updateCard(r.title, { candidates: v })} placeholder="Names..." />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 2 }}>Filled By</label>
                    <select
                      value={r.filledBy}
                      onChange={e => handleFill(r.title, e.target.value)}
                      style={{ width: '100%', padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 3, fontSize: 12, background: 'var(--bg)', color: 'var(--text)' }}
                    >
                      <option value="">Select member...</option>
                      {activeMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
