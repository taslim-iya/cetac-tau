import { useState } from 'react';
import { UserPlus, Check, Clock, AlertTriangle } from 'lucide-react';
import EditableCell from '../components/EditableCell';
import { id } from '../lib/utils';

interface Role { id: string; title: string; description: string; skills: string; candidates: string; status: 'vacant' | 'interviewing' | 'filled'; filledBy: string; }

const INITIAL_ROLES: Role[] = [
  { id: id(), title: 'Event Manager (Internal)', description: 'Manages room bookings, AV setup, catering, and logistics for all CJBS-hosted events', skills: 'Organisation, attention to detail, CJBS contacts', candidates: '', status: 'vacant', filledBy: '' },
  { id: id(), title: 'Event Manager (External)', description: 'Handles off-campus events: dinners, networking socials, sponsor-hosted sessions', skills: 'Venue sourcing, budget management, hospitality', candidates: '', status: 'vacant', filledBy: '' },
  { id: id(), title: 'Partnerships Lead (Business Schools)', description: 'Owns relationships with LBS, INSEAD, IESE, HBS, IE, ESADE ETA clubs. Drives MOUs and joint events.', skills: 'Networking, cross-institution diplomacy, outreach', candidates: '', status: 'vacant', filledBy: '' },
  { id: id(), title: 'Marketing Officer (External)', description: 'LinkedIn content strategy, event promotion, brand visibility across ETA ecosystem', skills: 'Content creation, LinkedIn, copywriting', candidates: '', status: 'vacant', filledBy: '' },
  { id: id(), title: 'Alumni Relations Lead', description: 'Maps Cambridge ETA alumni, organises reunions, maintains alumni database', skills: 'Research, relationship building, CRM', candidates: '', status: 'vacant', filledBy: '' },
  { id: id(), title: 'Content & Case Studies Lead', description: 'Conducts searcher interviews, writes case studies, manages playbook contributions', skills: 'Writing, interviewing, content strategy', candidates: '', status: 'vacant', filledBy: '' },
  { id: id(), title: 'Searchfunder & Community Lead', description: 'Manages Searchfunder.com presence, community engagement, online discussions', skills: 'Community management, forum moderation', candidates: '', status: 'vacant', filledBy: '' },
  { id: id(), title: 'Co-Founder Networking Lead', description: 'Organises co-founder coffee meetups, matchmaking between aspiring searchers', skills: 'Networking, matchmaking, event hosting', candidates: '', status: 'vacant', filledBy: '' },
  { id: id(), title: 'Website & Digital Lead', description: 'Maintains etacambridge.com, updates content, SEO, digital presence', skills: 'Web development, design, SEO', candidates: '', status: 'vacant', filledBy: '' },
  { id: id(), title: 'Database & Research Manager', description: 'Maintains ETA ecosystem database — investors, advisors, brokers, search funds', skills: 'Research, data management, Excel/Sheets', candidates: '', status: 'vacant', filledBy: '' },
  { id: id(), title: 'Treasurer / Admin Lead', description: 'Budget tracking, expense management, CUSU admin compliance, society registration', skills: 'Finance, admin, compliance', candidates: '', status: 'vacant', filledBy: '' },
];

const STATUS_ICON = { vacant: AlertTriangle, interviewing: Clock, filled: Check };
const STATUS_COLOR = { vacant: 'var(--red)', interviewing: 'var(--yellow)', filled: 'var(--green)' };
const STATUS_BG = { vacant: 'var(--red-light)', interviewing: 'var(--yellow-light)', filled: 'var(--green-light)' };
const STATUS_OPTS = [{ value: 'vacant', label: 'Vacant' }, { value: 'interviewing', label: 'Interviewing' }, { value: 'filled', label: 'Filled' }];

export default function Roles() {
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);

  const updateRole = (roleId: string, updates: Partial<Role>) => {
    setRoles(rs => rs.map(r => r.id === roleId ? { ...r, ...updates } : r));
  };

  const addRole = () => {
    setRoles(rs => [{ id: id(), title: '', description: '', skills: '', candidates: '', status: 'vacant', filledBy: '' }, ...rs]);
  };

  const vacant = roles.filter(r => r.status === 'vacant').length;
  const interviewing = roles.filter(r => r.status === 'interviewing').length;
  const filled = roles.filter(r => r.status === 'filled').length;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Role Assignments</h1>
          <p>Fill critical team positions</p>
        </div>
        <button onClick={addRole} className="btn-primary">
          <UserPlus size={14} /> Add Role
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

      {/* Roles grid — fixed layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {roles.map(r => {
          const Icon = STATUS_ICON[r.status];
          return (
            <div key={r.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Card header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: STATUS_BG[r.status] }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                  <Icon size={14} color={STATUS_COLOR[r.status]} style={{ flexShrink: 0 }} />
                  <EditableCell value={r.title} onChange={v => updateRole(r.id, { title: v })} placeholder="Role title" />
                </div>
                <div style={{ flexShrink: 0 }}>
                  <EditableCell value={r.status} onChange={v => updateRole(r.id, { status: v as any })} type="select" options={STATUS_OPTS} />
                </div>
              </div>

              {/* Card body */}
              <div style={{ padding: '12px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, minHeight: 36 }}>
                  {r.description || 'No description'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 2 }}>Skills Needed</label>
                    <EditableCell value={r.skills} onChange={v => updateRole(r.id, { skills: v })} placeholder="Required skills" />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 2 }}>Candidates</label>
                    <EditableCell value={r.candidates} onChange={v => updateRole(r.id, { candidates: v })} placeholder="Names..." />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 2 }}>Filled By</label>
                    <EditableCell value={r.filledBy} onChange={v => updateRole(r.id, { filledBy: v })} placeholder="Assigned person" />
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
