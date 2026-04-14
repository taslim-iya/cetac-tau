import { useState } from 'react';
import { UserPlus, Check, Clock, AlertTriangle } from 'lucide-react';
import EditableCell from '../components/EditableCell';
import { useStore } from '../store';
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Role Assignments</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 2 }}>Fill critical team positions</p>
        </div>
        <button onClick={addRole} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: 'none', borderRadius: 6, background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <UserPlus size={14} /> Add Role
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[{ label: 'Vacant', count: vacant, color: 'var(--red)', bg: 'var(--red-light)' },
          { label: 'Interviewing', count: interviewing, color: 'var(--yellow)', bg: 'var(--yellow-light)' },
          { label: 'Filled', count: filled, color: 'var(--green)', bg: 'var(--green-light)' }].map(s => (
          <div key={s.label} style={{ flex: 1, padding: '12px 16px', borderRadius: 8, background: s.bg, border: `1px solid ${s.color}20` }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Roles list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {roles.map(r => {
          const Icon = STATUS_ICON[r.status];
          return (
            <div key={r.id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Icon size={14} color={STATUS_COLOR[r.status]} />
                    <EditableCell value={r.title} onChange={v => updateRole(r.id, { title: v })} placeholder="Role title" className="font-semibold" />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 6 }}>{r.description}</div>
                </div>
                <EditableCell value={r.status} onChange={v => updateRole(r.id, { status: v as any })} type="select" options={STATUS_OPTS} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>Skills Needed</label>
                  <EditableCell value={r.skills} onChange={v => updateRole(r.id, { skills: v })} placeholder="Required skills" />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>Candidates Approached</label>
                  <EditableCell value={r.candidates} onChange={v => updateRole(r.id, { candidates: v })} placeholder="Names..." />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>Filled By</label>
                  <EditableCell value={r.filledBy} onChange={v => updateRole(r.id, { filledBy: v })} placeholder="Assigned person" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
