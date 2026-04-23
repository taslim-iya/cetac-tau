import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { ChevronRight, ChevronDown, GraduationCap, Users, CheckCircle2, Circle, Clock, XCircle, UserPlus, X } from 'lucide-react';
import type { RolePlaybook, PlaybookTask, PlaybookKPI, BSPartner } from '../data/playbook-data';

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  not_started: { bg: '#f3f4f6', text: '#6b7280', label: 'Not Started' },
  in_progress: { bg: '#dbeafe', text: '#2563eb', label: 'In Progress' },
  on_track: { bg: '#d1fae5', text: '#059669', label: 'On Track' },
  at_risk: { bg: '#fef3c7', text: '#d97706', label: 'At Risk' },
  completed: { bg: '#d1fae5', text: '#059669', label: 'Completed' },
  achieved: { bg: '#d1fae5', text: '#059669', label: 'Achieved' },
};

const TASK_STATUS: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  open: { icon: Circle, color: '#9ca3af' },
  done: { icon: CheckCircle2, color: '#059669' },
  in_progress: { icon: Clock, color: '#2563eb' },
  blocked: { icon: XCircle, color: '#dc2626' },
};

const TIER_COLORS: Record<number, { bg: string; text: string }> = {
  1: { bg: '#dbeafe', text: '#1d4ed8' },
  2: { bg: '#fef3c7', text: '#92400e' },
  3: { bg: '#f3f4f6', text: '#6b7280' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.not_started;
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
}

function TaskRow({ task, canEdit, onToggle, onUpdateNotes }: { task: PlaybookTask; canEdit: boolean; onToggle: () => void; onUpdateNotes: (notes: string) => void }) {
  const st = TASK_STATUS[task.status] || TASK_STATUS.open;
  const Icon = st.icon;
  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      <td style={{ padding: '6px 8px', width: 28 }}>
        {canEdit ? (
          <button onClick={onToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <Icon size={16} color={st.color} />
          </button>
        ) : (
          <Icon size={16} color={st.color} />
        )}
      </td>
      <td style={{ padding: '6px 8px', fontSize: 13, color: task.status === 'done' ? '#9ca3af' : 'var(--text)', textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
        {task.item}
      </td>
      <td style={{ padding: '6px 8px', width: 200, fontSize: 12, color: 'var(--text-3)' }}>
        {canEdit ? (
          <input value={task.notes} onChange={e => onUpdateNotes(e.target.value)} placeholder="Notes..." style={{ width: '100%', border: 'none', outline: 'none', fontSize: 12, color: 'var(--text-3)', background: 'transparent' }} />
        ) : (task.notes || '—')}
      </td>
    </tr>
  );
}

function TaskSection({ title, tasks, canEdit, onToggle, onUpdateNotes }: {
  title: string; tasks: PlaybookTask[]; canEdit: boolean;
  onToggle: (taskId: string) => void; onUpdateNotes: (taskId: string, notes: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const done = tasks.filter(t => t.status === 'done').length;
  return (
    <div style={{ marginBottom: 16 }}>
      <button onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', width: '100%' }}>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{title}</span>
        <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 8 }}>{done}/{tasks.length}</span>
      </button>
      {open && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 4 }}>
          <tbody>
            {tasks.map(task => (
              <TaskRow key={task.id} task={task} canEdit={canEdit} onToggle={() => onToggle(task.id)} onUpdateNotes={notes => onUpdateNotes(task.id, notes)} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function KPISection({ kpis, canEdit, onUpdate }: { kpis: PlaybookKPI[]; canEdit: boolean; onUpdate: (kpiId: string, field: string, value: string) => void }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, marginBottom: 8 }}>KPIs — Easter Term</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)' }}>
            {['KPI', 'Target', 'Actual', 'Status'].map(h => (
              <th key={h} style={{ padding: '6px 8px', fontSize: 11, fontWeight: 600, textAlign: 'left', color: 'var(--text-3)', textTransform: 'uppercase' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {kpis.map(kpi => (
            <tr key={kpi.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '6px 8px', fontSize: 13 }}>{kpi.kpi}</td>
              <td style={{ padding: '6px 8px', fontSize: 13, fontWeight: 600 }}>{kpi.target}</td>
              <td style={{ padding: '6px 8px', fontSize: 13 }}>
                {canEdit ? (
                  <input value={kpi.actual} onChange={e => onUpdate(kpi.id, 'actual', e.target.value)} placeholder="—" style={{ width: 80, border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', fontSize: 13, background: 'var(--bg)' }} />
                ) : (kpi.actual || '—')}
              </td>
              <td style={{ padding: '6px 8px' }}>
                {canEdit ? (
                  <select value={kpi.status} onChange={e => onUpdate(kpi.id, 'status', e.target.value)} style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', fontSize: 11, background: STATUS_COLORS[kpi.status]?.bg, color: STATUS_COLORS[kpi.status]?.text }}>
                    <option value="not_started">Not Started</option>
                    <option value="on_track">On Track</option>
                    <option value="at_risk">At Risk</option>
                    <option value="achieved">Achieved</option>
                  </select>
                ) : <StatusBadge status={kpi.status} />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* Assignment modal: admin picks which members can see a playbook */
function AssignModal({ playbook, teamMembers, onAssign, onClose }: {
  playbook: RolePlaybook; teamMembers: { name: string }[];
  onAssign: (names: string[]) => void; onClose: () => void;
}) {
  const assigned = playbook.assignedTo || [];
  const toggle = (name: string) => {
    onAssign(assigned.includes(name) ? assigned.filter(n => n !== name) : [...assigned, name]);
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }} onClick={onClose}>
      <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 24, width: 380, maxHeight: '70vh', overflow: 'auto', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, margin: 0 }}>Assign: {playbook.role}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>
          Holder (<b>{playbook.holder}</b>) always has access. Select additional members:
        </p>
        {teamMembers.map(m => {
          const isHolder = m.name.toLowerCase() === playbook.holder.toLowerCase();
          const isAssigned = assigned.includes(m.name);
          return (
            <label key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: isHolder ? 'default' : 'pointer', opacity: isHolder ? 0.5 : 1 }}>
              <input
                type="checkbox"
                checked={isHolder || isAssigned}
                disabled={isHolder}
                onChange={() => !isHolder && toggle(m.name)}
                style={{ accentColor: 'var(--accent)' }}
              />
              <span style={{ fontSize: 13 }}>{m.name}</span>
              {isHolder && <span style={{ fontSize: 10, color: 'var(--text-3)', fontStyle: 'italic' }}>(holder)</span>}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function RoleDetail({ playbook, canEdit, isAdmin, teamMembers, onUpdateTask, onUpdateTaskNotes, onUpdateKPI, onUpdateOverallStatus, onUpdateHolder, onAssign }: {
  playbook: RolePlaybook; canEdit: boolean; isAdmin: boolean; teamMembers: { name: string }[];
  onUpdateTask: (section: string, taskId: string) => void;
  onUpdateTaskNotes: (section: string, taskId: string, notes: string) => void;
  onUpdateKPI: (kpiId: string, field: string, value: string) => void;
  onUpdateOverallStatus: (status: string) => void;
  onUpdateHolder: (holder: string) => void;
  onAssign: (names: string[]) => void;
}) {
  const [showAssign, setShowAssign] = useState(false);
  const assigned = playbook.assignedTo || [];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, margin: 0 }}>{playbook.role}</h2>
        {canEdit ? (
          <select value={playbook.overallStatus} onChange={e => onUpdateOverallStatus(e.target.value)} style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '4px 8px', fontSize: 12, background: STATUS_COLORS[playbook.overallStatus]?.bg, color: STATUS_COLORS[playbook.overallStatus]?.text }}>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="on_track">On Track</option>
            <option value="at_risk">At Risk</option>
            <option value="completed">Completed</option>
          </select>
        ) : <StatusBadge status={playbook.overallStatus} />}
        {isAdmin && (
          <button onClick={() => setShowAssign(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 11, cursor: 'pointer', color: 'var(--text-2)' }}>
            <UserPlus size={13} /> Assign ({assigned.length})
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24, padding: 16, background: 'var(--bg-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>Holder</div>
          {isAdmin ? (
            <input value={playbook.holder} onChange={e => onUpdateHolder(e.target.value)} style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '4px 8px', fontSize: 13, width: '100%', background: 'var(--bg)' }} />
          ) : (
            <div style={{ fontSize: 14, fontWeight: 600, color: playbook.holder === 'Vacant' ? '#d97706' : 'var(--text)' }}>{playbook.holder}</div>
          )}
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>Reports to</div>
          <div style={{ fontSize: 14 }}>{playbook.reportsTo}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>Deputy</div>
          <div style={{ fontSize: 14 }}>{playbook.deputy}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>Primary Weekly Target</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{playbook.primaryWeeklyTarget}</div>
        </div>
        {assigned.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>Also visible to</div>
            <div style={{ fontSize: 13 }}>{assigned.join(', ')}</div>
          </div>
        )}
      </div>

      <TaskSection title="Daily Cadence" tasks={playbook.dailyCadence} canEdit={canEdit} onToggle={id => onUpdateTask('dailyCadence', id)} onUpdateNotes={(id, n) => onUpdateTaskNotes('dailyCadence', id, n)} />
      <TaskSection title="Weekly Cadence" tasks={playbook.weeklyCadence} canEdit={canEdit} onToggle={id => onUpdateTask('weeklyCadence', id)} onUpdateNotes={(id, n) => onUpdateTaskNotes('weeklyCadence', id, n)} />
      <TaskSection title="Monthly Cadence" tasks={playbook.monthlyCadence} canEdit={canEdit} onToggle={id => onUpdateTask('monthlyCadence', id)} onUpdateNotes={(id, n) => onUpdateTaskNotes('monthlyCadence', id, n)} />
      <TaskSection title="Recommended Habits" tasks={playbook.recommendedHabits} canEdit={canEdit} onToggle={id => onUpdateTask('recommendedHabits', id)} onUpdateNotes={(id, n) => onUpdateTaskNotes('recommendedHabits', id, n)} />
      <TaskSection title="Weekly Targets" tasks={playbook.weeklyTargets} canEdit={canEdit} onToggle={id => onUpdateTask('weeklyTargets', id)} onUpdateNotes={(id, n) => onUpdateTaskNotes('weeklyTargets', id, n)} />

      <KPISection kpis={playbook.kpis} canEdit={canEdit} onUpdate={onUpdateKPI} />

      <div style={{ marginBottom: 16 }}>
        <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Standard Operating Procedures</h4>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {playbook.sops.map(sop => (
            <li key={sop.id} style={{ fontSize: 13, marginBottom: 4, color: 'var(--text-2)' }}>{sop.item}</li>
          ))}
        </ul>
      </div>

      {showAssign && (
        <AssignModal
          playbook={playbook}
          teamMembers={teamMembers}
          onAssign={names => { onAssign(names); }}
          onClose={() => setShowAssign(false)}
        />
      )}
    </div>
  );
}

function BSPartnerTable({ partners, isAdmin, onUpdate }: { partners: BSPartner[]; isAdmin: boolean; onUpdate: (id: string, field: string, value: string) => void }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)' }}>
            {['School', 'Region', 'Country', 'Club / URL', 'Contact', 'Tier', 'Relationship', 'Status', 'Notes'].map(h => (
              <th key={h} style={{ padding: '8px 6px', fontSize: 11, fontWeight: 600, textAlign: 'left', color: 'var(--text-3)', textTransform: 'uppercase' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {partners.map(p => (
            <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '6px', fontSize: 13, fontWeight: 600 }}>{p.school}</td>
              <td style={{ padding: '6px', fontSize: 12 }}>{p.region}</td>
              <td style={{ padding: '6px', fontSize: 12 }}>{p.country}</td>
              <td style={{ padding: '6px', fontSize: 12 }}>{p.clubName}</td>
              <td style={{ padding: '6px', fontSize: 12 }}>
                {isAdmin ? (
                  <input value={p.contactEmail} onChange={e => onUpdate(p.id, 'contactEmail', e.target.value)} placeholder="—" style={{ width: 140, border: '1px solid var(--border)', borderRadius: 3, padding: '2px 4px', fontSize: 11, background: 'var(--bg)' }} />
                ) : (p.contactEmail ? <a href={`mailto:${p.contactEmail}`} style={{ color: '#2563eb', fontSize: 12 }}>{p.contactEmail}</a> : '—')}
              </td>
              <td style={{ padding: '6px' }}>
                <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 3, fontSize: 11, fontWeight: 600, background: TIER_COLORS[p.tier]?.bg, color: TIER_COLORS[p.tier]?.text }}>
                  Tier {p.tier}
                </span>
              </td>
              <td style={{ padding: '6px', fontSize: 12 }}>{p.relationship}</td>
              <td style={{ padding: '6px', fontSize: 12 }}>
                {isAdmin ? (
                  <select value={p.status} onChange={e => onUpdate(p.id, 'status', e.target.value)} style={{ border: '1px solid var(--border)', borderRadius: 3, padding: '2px 4px', fontSize: 11 }}>
                    <option>Active</option><option>To contact</option><option>Track</option><option>Contacted</option><option>MOU signed</option>
                  </select>
                ) : p.status}
              </td>
              <td style={{ padding: '6px', fontSize: 12, color: 'var(--text-3)' }}>
                {isAdmin ? (
                  <input value={p.notes} onChange={e => onUpdate(p.id, 'notes', e.target.value)} style={{ width: 140, border: 'none', fontSize: 11, color: 'var(--text-3)', background: 'transparent' }} />
                ) : p.notes}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type Tab = 'dashboard' | 'detail' | 'bs-tracker';

export default function Playbook() {
  const currentUser = useStore(s => s.currentUser);
  const team = useStore(s => s.team);
  const playbooks = useStore(s => s.playbooks) || [];
  const bsPartners = useStore(s => s.bsPartners) || [];
  const updatePlaybook = useStore(s => s.updatePlaybook);
  const updateBSPartner = useStore(s => s.updateBSPartner);

  const isAdmin = currentUser?.role === 'super_admin';
  const [tab, setTab] = useState<Tab>('dashboard');
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  // Resolve current user's team name
  const myName = useMemo(() => {
    const myTeam = team.find(m => m.email === currentUser?.email);
    return myTeam?.name || currentUser?.name || '';
  }, [currentUser, team]);

  // Check if user is holder or assigned to a playbook
  const isHolderOf = (pb: RolePlaybook) => pb.holder.toLowerCase() === myName.toLowerCase();
  const isAssignedTo = (pb: RolePlaybook) => (pb.assignedTo || []).some(n => n.toLowerCase() === myName.toLowerCase());
  
  // Auto-match: if team member's role contains keywords from the playbook role name
  const isRoleMatch = (pb: RolePlaybook) => {
    if (!myName) return false;
    const myTeam = team.find(m => m.name.toLowerCase() === myName.toLowerCase());
    if (!myTeam) return false;
    const myRoles = (myTeam.role || '').toLowerCase();
    const pbRole = pb.role.toLowerCase();
    // Match if member role keywords overlap with playbook role
    const pbWords = pbRole.split(/[\s\/&,\-–]+/).filter(w => w.length > 2 && !['and','the','for','lead'].includes(w));
    return pbWords.some(w => myRoles.includes(w)) || myRoles.includes(pbRole.slice(0, 15));
  };
  
  const canAccess = (pb: RolePlaybook) => isAdmin || isHolderOf(pb) || isAssignedTo(pb) || isRoleMatch(pb);
  const canEditPb = (pb: RolePlaybook) => isAdmin || isHolderOf(pb); // Admin or holder can edit

  // Visible playbooks for this user
  const visiblePlaybooks = useMemo(() => {
    if (isAdmin) return playbooks;
    return playbooks.filter(pb => canAccess(pb));
  }, [isAdmin, playbooks, myName, team]);

  const selectedPlaybook = playbooks.find(p => p.id === selectedRoleId);

  const openDetail = (roleId: string) => {
    setSelectedRoleId(roleId);
    setTab('detail');
  };

  const handleToggleTask = (playbookId: string, section: string, taskId: string) => {
    const pb = playbooks.find(p => p.id === playbookId);
    if (!pb) return;
    const tasks = (pb as any)[section] as PlaybookTask[];
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const next = task.status === 'done' ? 'open' : task.status === 'open' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'open';
    const updated = tasks.map(t => t.id === taskId ? { ...t, status: next } : t);
    updatePlaybook(playbookId, { [section]: updated });
  };

  const handleUpdateTaskNotes = (playbookId: string, section: string, taskId: string, notes: string) => {
    const pb = playbooks.find(p => p.id === playbookId);
    if (!pb) return;
    const tasks = (pb as any)[section] as PlaybookTask[];
    const updated = tasks.map(t => t.id === taskId ? { ...t, notes } : t);
    updatePlaybook(playbookId, { [section]: updated });
  };

  const handleUpdateKPI = (playbookId: string, kpiId: string, field: string, value: string) => {
    const pb = playbooks.find(p => p.id === playbookId);
    if (!pb) return;
    const updated = pb.kpis.map(k => k.id === kpiId ? { ...k, [field]: value } : k);
    updatePlaybook(playbookId, { kpis: updated });
  };

  const filledCount = playbooks.filter(p => p.holder !== 'Vacant' && p.holder !== 'Incoming MBA').length;
  const vacantCount = playbooks.length - filledCount;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100 }}>
      <div style={{ borderBottom: '2px solid var(--border)', paddingBottom: 16, marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, margin: 0 }}>Role Playbook</h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '4px 0 12px' }}>
          Easter Term — {playbooks.length} roles · {filledCount} filled · {vacantCount} vacant
          {!isAdmin && visiblePlaybooks.length > 0 && ` · You have access to ${visiblePlaybooks.length} role${visiblePlaybooks.length > 1 ? 's' : ''}`}
        </p>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setTab('dashboard')} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: tab === 'dashboard' ? 'var(--accent)' : 'var(--bg)', color: tab === 'dashboard' ? '#fff' : 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Dashboard
          </button>
          {isAdmin && (
            <button onClick={() => setTab('bs-tracker')} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: tab === 'bs-tracker' ? 'var(--accent)' : 'var(--bg)', color: tab === 'bs-tracker' ? '#fff' : 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <GraduationCap size={14} /> BS Tracker
            </button>
          )}
          {tab === 'detail' && selectedPlaybook && (
            <span style={{ padding: '6px 14px', fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ChevronRight size={12} /> {selectedPlaybook.role}
            </span>
          )}
        </div>
      </div>

      {/* No access */}
      {!isAdmin && visiblePlaybooks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Users size={40} color="var(--text-3)" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No playbooks assigned</h3>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>You haven't been assigned any playbook roles yet. Contact your admin.</p>
        </div>
      )}

      {/* Dashboard */}
      {tab === 'dashboard' && visiblePlaybooks.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                {['Role', 'Holder', 'Primary Weekly Target', 'Primary Term KPI', 'Status', isAdmin ? 'Assigned' : '', 'Notes'].filter(Boolean).map(h => (
                  <th key={h} style={{ padding: '8px 8px', fontSize: 11, fontWeight: 600, textAlign: 'left', color: 'var(--text-3)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visiblePlaybooks.map(pb => {
                const myRole = isHolderOf(pb);
                return (
                  <tr
                    key={pb.id}
                    onClick={() => openDetail(pb.id)}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s', background: myRole ? 'rgba(94,106,210,0.04)' : 'transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.background = myRole ? 'rgba(94,106,210,0.08)' : 'var(--bg-2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = myRole ? 'rgba(94,106,210,0.04)' : 'transparent')}
                  >
                    <td style={{ padding: '8px', fontSize: 13, fontWeight: 600 }}>
                      {pb.role}
                      {myRole && <span style={{ fontSize: 10, color: 'var(--accent)', marginLeft: 6 }}>★ yours</span>}
                    </td>
                    <td style={{ padding: '8px', fontSize: 13, color: pb.holder === 'Vacant' ? '#d97706' : 'var(--text)', fontWeight: pb.holder === 'Vacant' ? 600 : 400 }}>
                      {pb.holder}
                    </td>
                    <td style={{ padding: '8px', fontSize: 12, color: 'var(--text-2)' }}>{pb.primaryWeeklyTarget}</td>
                    <td style={{ padding: '8px', fontSize: 12, color: 'var(--text-2)' }}>{pb.primaryTermKPI}</td>
                    <td style={{ padding: '8px' }}><StatusBadge status={pb.overallStatus} /></td>
                    {isAdmin && (
                      <td style={{ padding: '8px', fontSize: 11, color: 'var(--text-3)' }}>
                        {(pb.assignedTo || []).length > 0 ? (pb.assignedTo || []).join(', ') : '—'}
                      </td>
                    )}
                    <td style={{ padding: '8px', fontSize: 12, color: 'var(--text-3)' }}>
                      {canEditPb(pb) ? (
                        <input value={pb.notes} onChange={e => { e.stopPropagation(); updatePlaybook(pb.id, { notes: e.target.value }); }} onClick={e => e.stopPropagation()} placeholder="—" style={{ width: 100, border: 'none', fontSize: 12, color: 'var(--text-3)', background: 'transparent' }} />
                      ) : (pb.notes || '—')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail */}
      {tab === 'detail' && selectedPlaybook && (
        <div>
          <button onClick={() => setTab('dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--accent)', marginBottom: 12, padding: 0 }}>
            ← Back to Dashboard
          </button>
          <RoleDetail
            playbook={selectedPlaybook}
            canEdit={canEditPb(selectedPlaybook)}
            isAdmin={isAdmin}
            teamMembers={team.filter(m => m.status === 'active')}
            onUpdateTask={(section, taskId) => handleToggleTask(selectedPlaybook.id, section, taskId)}
            onUpdateTaskNotes={(section, taskId, notes) => handleUpdateTaskNotes(selectedPlaybook.id, section, taskId, notes)}
            onUpdateKPI={(kpiId, field, value) => handleUpdateKPI(selectedPlaybook.id, kpiId, field, value)}
            onUpdateOverallStatus={status => updatePlaybook(selectedPlaybook.id, { overallStatus: status })}
            onUpdateHolder={holder => updatePlaybook(selectedPlaybook.id, { holder })}
            onAssign={names => updatePlaybook(selectedPlaybook.id, { assignedTo: names })}
          />
        </div>
      )}

      {/* BS Tracker */}
      {tab === 'bs-tracker' && (
        <div>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Business School Partnership Tracker</h3>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>{bsPartners.length} target schools</p>
          <BSPartnerTable partners={bsPartners} isAdmin={isAdmin} onUpdate={(id, field, value) => updateBSPartner(id, { [field]: value })} />
        </div>
      )}
    </div>
  );
}
