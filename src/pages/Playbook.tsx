import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { ChevronRight, ChevronDown, GraduationCap, Users, CheckCircle2, Circle, Clock, AlertTriangle, XCircle } from 'lucide-react';
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

function TaskRow({ task, isAdmin, onToggle, onUpdateNotes }: { task: PlaybookTask; isAdmin: boolean; onToggle: () => void; onUpdateNotes: (notes: string) => void }) {
  const st = TASK_STATUS[task.status] || TASK_STATUS.open;
  const Icon = st.icon;
  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      <td style={{ padding: '6px 8px', width: 28 }}>
        {isAdmin ? (
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
        {isAdmin ? (
          <input
            value={task.notes}
            onChange={e => onUpdateNotes(e.target.value)}
            placeholder="Notes..."
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: 12, color: 'var(--text-3)', background: 'transparent' }}
          />
        ) : (
          task.notes || '—'
        )}
      </td>
    </tr>
  );
}

function TaskSection({ title, tasks, isAdmin, onToggle, onUpdateNotes }: {
  title: string; tasks: PlaybookTask[]; isAdmin: boolean;
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
              <TaskRow
                key={task.id}
                task={task}
                isAdmin={isAdmin}
                onToggle={() => onToggle(task.id)}
                onUpdateNotes={notes => onUpdateNotes(task.id, notes)}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function KPISection({ kpis, isAdmin, onUpdate }: { kpis: PlaybookKPI[]; isAdmin: boolean; onUpdate: (kpiId: string, field: string, value: string) => void }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, marginBottom: 8 }}>KPIs — Easter Term</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)' }}>
            <th style={{ padding: '6px 8px', fontSize: 11, fontWeight: 600, textAlign: 'left', color: 'var(--text-3)', textTransform: 'uppercase' }}>KPI</th>
            <th style={{ padding: '6px 8px', fontSize: 11, fontWeight: 600, textAlign: 'left', color: 'var(--text-3)', textTransform: 'uppercase' }}>Target</th>
            <th style={{ padding: '6px 8px', fontSize: 11, fontWeight: 600, textAlign: 'left', color: 'var(--text-3)', textTransform: 'uppercase' }}>Actual</th>
            <th style={{ padding: '6px 8px', fontSize: 11, fontWeight: 600, textAlign: 'left', color: 'var(--text-3)', textTransform: 'uppercase' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {kpis.map(kpi => (
            <tr key={kpi.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '6px 8px', fontSize: 13 }}>{kpi.kpi}</td>
              <td style={{ padding: '6px 8px', fontSize: 13, fontWeight: 600 }}>{kpi.target}</td>
              <td style={{ padding: '6px 8px', fontSize: 13 }}>
                {isAdmin ? (
                  <input value={kpi.actual} onChange={e => onUpdate(kpi.id, 'actual', e.target.value)} placeholder="—" style={{ width: 80, border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', fontSize: 13, background: 'var(--bg)' }} />
                ) : (kpi.actual || '—')}
              </td>
              <td style={{ padding: '6px 8px' }}>
                {isAdmin ? (
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

function RoleDetail({ playbook, isAdmin, onUpdateTask, onUpdateTaskNotes, onUpdateKPI, onUpdateOverallStatus, onUpdateHolder }: {
  playbook: RolePlaybook; isAdmin: boolean;
  onUpdateTask: (section: string, taskId: string) => void;
  onUpdateTaskNotes: (section: string, taskId: string, notes: string) => void;
  onUpdateKPI: (kpiId: string, field: string, value: string) => void;
  onUpdateOverallStatus: (status: string) => void;
  onUpdateHolder: (holder: string) => void;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, margin: 0 }}>{playbook.role}</h2>
        {isAdmin ? (
          <select value={playbook.overallStatus} onChange={e => onUpdateOverallStatus(e.target.value)} style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '4px 8px', fontSize: 12, background: STATUS_COLORS[playbook.overallStatus]?.bg, color: STATUS_COLORS[playbook.overallStatus]?.text }}>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="on_track">On Track</option>
            <option value="at_risk">At Risk</option>
            <option value="completed">Completed</option>
          </select>
        ) : <StatusBadge status={playbook.overallStatus} />}
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
      </div>

      <TaskSection title="Daily Cadence" tasks={playbook.dailyCadence} isAdmin={isAdmin} onToggle={id => onUpdateTask('dailyCadence', id)} onUpdateNotes={(id, n) => onUpdateTaskNotes('dailyCadence', id, n)} />
      <TaskSection title="Weekly Cadence" tasks={playbook.weeklyCadence} isAdmin={isAdmin} onToggle={id => onUpdateTask('weeklyCadence', id)} onUpdateNotes={(id, n) => onUpdateTaskNotes('weeklyCadence', id, n)} />
      <TaskSection title="Monthly Cadence" tasks={playbook.monthlyCadence} isAdmin={isAdmin} onToggle={id => onUpdateTask('monthlyCadence', id)} onUpdateNotes={(id, n) => onUpdateTaskNotes('monthlyCadence', id, n)} />
      <TaskSection title="Recommended Habits" tasks={playbook.recommendedHabits} isAdmin={isAdmin} onToggle={id => onUpdateTask('recommendedHabits', id)} onUpdateNotes={(id, n) => onUpdateTaskNotes('recommendedHabits', id, n)} />
      <TaskSection title="Weekly Targets" tasks={playbook.weeklyTargets} isAdmin={isAdmin} onToggle={id => onUpdateTask('weeklyTargets', id)} onUpdateNotes={(id, n) => onUpdateTaskNotes('weeklyTargets', id, n)} />

      <KPISection kpis={playbook.kpis} isAdmin={isAdmin} onUpdate={onUpdateKPI} />

      <div style={{ marginBottom: 16 }}>
        <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Standard Operating Procedures</h4>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {playbook.sops.map(sop => (
            <li key={sop.id} style={{ fontSize: 13, marginBottom: 4, color: 'var(--text-2)' }}>{sop.item}</li>
          ))}
        </ul>
      </div>
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
                    <option>Active</option>
                    <option>To contact</option>
                    <option>Track</option>
                    <option>Contacted</option>
                    <option>MOU signed</option>
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

  // For non-admin: find their role
  const myPlaybook = useMemo(() => {
    if (isAdmin) return null;
    const myName = currentUser?.name?.toLowerCase() || '';
    const myTeam = team.find(m => m.email === currentUser?.email);
    const name = myTeam?.name?.toLowerCase() || myName;
    return playbooks.find(p => p.holder.toLowerCase() === name);
  }, [isAdmin, currentUser, team, playbooks]);

  // Non-admin with no role sees their own or empty
  const visiblePlaybooks = isAdmin ? playbooks : (myPlaybook ? [myPlaybook] : []);
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
      {/* Header */}
      <div style={{ borderBottom: '2px solid var(--border)', paddingBottom: 16, marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, margin: 0 }}>Role Playbook</h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '4px 0 12px' }}>
          Easter Term — {playbooks.length} roles · {filledCount} filled · {vacantCount} vacant
        </p>
        {(isAdmin || myPlaybook) && (
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
        )}
      </div>

      {/* Non-admin with no role */}
      {!isAdmin && !myPlaybook && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Users size={40} color="var(--text-3)" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No role assigned</h3>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>You haven't been assigned a playbook role yet. Contact your admin.</p>
        </div>
      )}

      {/* Dashboard */}
      {tab === 'dashboard' && visiblePlaybooks.length > 0 && (
        <div>
          {!isAdmin && myPlaybook ? (
            <RoleDetail
              playbook={myPlaybook}
              isAdmin={false}
              onUpdateTask={() => {}}
              onUpdateTaskNotes={() => {}}
              onUpdateKPI={() => {}}
              onUpdateOverallStatus={() => {}}
              onUpdateHolder={() => {}}
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    {['Role', 'Holder', 'Primary Weekly Target', 'Primary Term KPI', 'Status', 'Notes'].map(h => (
                      <th key={h} style={{ padding: '8px 8px', fontSize: 11, fontWeight: 600, textAlign: 'left', color: 'var(--text-3)', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visiblePlaybooks.map(pb => (
                    <tr
                      key={pb.id}
                      onClick={() => openDetail(pb.id)}
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '8px', fontSize: 13, fontWeight: 600 }}>{pb.role}</td>
                      <td style={{ padding: '8px', fontSize: 13, color: pb.holder === 'Vacant' ? '#d97706' : 'var(--text)', fontWeight: pb.holder === 'Vacant' ? 600 : 400 }}>
                        {pb.holder}
                      </td>
                      <td style={{ padding: '8px', fontSize: 12, color: 'var(--text-2)' }}>{pb.primaryWeeklyTarget}</td>
                      <td style={{ padding: '8px', fontSize: 12, color: 'var(--text-2)' }}>{pb.primaryTermKPI}</td>
                      <td style={{ padding: '8px' }}><StatusBadge status={pb.overallStatus} /></td>
                      <td style={{ padding: '8px', fontSize: 12, color: 'var(--text-3)' }}>
                        {isAdmin ? (
                          <input
                            value={pb.notes}
                            onChange={e => { e.stopPropagation(); updatePlaybook(pb.id, { notes: e.target.value }); }}
                            onClick={e => e.stopPropagation()}
                            placeholder="—"
                            style={{ width: 120, border: 'none', fontSize: 12, color: 'var(--text-3)', background: 'transparent' }}
                          />
                        ) : (pb.notes || '—')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Detail view */}
      {tab === 'detail' && selectedPlaybook && (
        <div>
          <button onClick={() => setTab('dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--accent)', marginBottom: 12, padding: 0 }}>
            ← Back to Dashboard
          </button>
          <RoleDetail
            playbook={selectedPlaybook}
            isAdmin={isAdmin}
            onUpdateTask={(section, taskId) => handleToggleTask(selectedPlaybook.id, section, taskId)}
            onUpdateTaskNotes={(section, taskId, notes) => handleUpdateTaskNotes(selectedPlaybook.id, section, taskId, notes)}
            onUpdateKPI={(kpiId, field, value) => handleUpdateKPI(selectedPlaybook.id, kpiId, field, value)}
            onUpdateOverallStatus={status => updatePlaybook(selectedPlaybook.id, { overallStatus: status })}
            onUpdateHolder={holder => updatePlaybook(selectedPlaybook.id, { holder })}
          />
        </div>
      )}

      {/* BS Tracker */}
      {tab === 'bs-tracker' && (
        <div>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Business School Partnership Tracker</h3>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>{bsPartners.length} target schools — Tier 1 = active MOU priority, Tier 2 = active engagement, Tier 3 = track and stay warm</p>
          <BSPartnerTable
            partners={bsPartners}
            isAdmin={isAdmin}
            onUpdate={(id, field, value) => updateBSPartner(id, { [field]: value })}
          />
        </div>
      )}
    </div>
  );
}
