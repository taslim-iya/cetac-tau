import { useState } from 'react';
import { BarChart3, Plus, Trash2, ChevronDown, ChevronUp, Target, Users, TrendingUp, Edit3, Check, X } from 'lucide-react';
import { useStore } from '../store';
import { id as makeId } from '../lib/utils';
import type { Vertical, KPI } from '../types';

export default function KPITracker() {
  const { verticals, team, tasks, memberTasks, addVertical, updateVertical, removeVertical } = useStore();
  const [expandedId, setExpandedId] = useState<string | null>(verticals[0]?.id || null);
  const [addingVertical, setAddingVertical] = useState(false);
  const [newV, setNewV] = useState({ name: '', description: '' });
  const [editingKpi, setEditingKpi] = useState<string | null>(null);

  // Team performance stats
  const teamStats = team.filter(m => m.status === 'active').map(m => {
    const assigned = tasks.filter(t => t.assignees.includes(m.name));
    const done = assigned.filter(t => t.status === 'done').length;
    const mTasks = memberTasks.filter(t => t.assigneeId === m.id || t.assigneeName === m.name);
    const mDone = mTasks.filter(t => t.status === 'done').length;
    return {
      ...m,
      totalTasks: assigned.length + mTasks.length,
      completedTasks: done + mDone,
      rate: (assigned.length + mTasks.length) > 0 ? Math.round(((done + mDone) / (assigned.length + mTasks.length)) * 100) : 0,
    };
  }).sort((a, b) => b.rate - a.rate);

  // Overall KPI progress
  const allKpis = verticals.flatMap(v => v.kpis);
  const overallProgress = allKpis.length > 0
    ? Math.round(allKpis.reduce((sum, k) => sum + Math.min(100, (k.current / Math.max(k.target, 1)) * 100), 0) / allKpis.length)
    : 0;

  const handleAddKpi = (vId: string) => {
    const v = verticals.find(x => x.id === vId);
    if (!v) return;
    const newKpi: KPI = { id: makeId(), name: 'New KPI', target: 100, current: 0, unit: 'count' };
    updateVertical(vId, { kpis: [...v.kpis, newKpi] });
  };

  const handleUpdateKpi = (vId: string, kpiId: string, updates: Partial<KPI>) => {
    const v = verticals.find(x => x.id === vId);
    if (!v) return;
    updateVertical(vId, { kpis: v.kpis.map(k => k.id === kpiId ? { ...k, ...updates } : k) });
  };

  const handleRemoveKpi = (vId: string, kpiId: string) => {
    const v = verticals.find(x => x.id === vId);
    if (!v) return;
    updateVertical(vId, { kpis: v.kpis.filter(k => k.id !== kpiId) });
  };

  const progressColor = (pct: number) => pct >= 75 ? 'var(--green)' : pct >= 40 ? 'var(--yellow)' : 'var(--red)';

  return (
    <div style={{ padding: '32px 40px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><BarChart3 size={22} /> KPI Tracker</h1>
          <p>{verticals.length} verticals · {allKpis.length} KPIs · {overallProgress}% overall progress</p>
        </div>
        <button onClick={() => setAddingVertical(true)} className="btn-primary">
          <Plus size={14} /> Add Vertical
        </button>
      </div>

      {/* Overview cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 28 }}>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: progressColor(overallProgress) }}>{overallProgress}%</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overall Progress</div>
        </div>
        {verticals.map(v => {
          const vProg = v.kpis.length > 0
            ? Math.round(v.kpis.reduce((s, k) => s + Math.min(100, (k.current / Math.max(k.target, 1)) * 100), 0) / v.kpis.length)
            : 0;
          return (
            <div key={v.id} className="card" style={{ padding: 16, textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s', border: expandedId === v.id ? '1px solid var(--accent)' : undefined }}
              onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}>
              <div style={{ fontSize: 24, fontWeight: 800, color: progressColor(vProg) }}>{vProg}%</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{v.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{v.kpis.length} KPIs</div>
            </div>
          );
        })}
      </div>

      {/* Add vertical form */}
      {addingVertical && (
        <div className="card" style={{ padding: 16, marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Name</label>
            <input value={newV.name} onChange={e => setNewV(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Marketing"
              style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12, background: 'var(--bg)', color: 'var(--text)', width: 200 }} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Description</label>
            <input value={newV.description} onChange={e => setNewV(p => ({ ...p, description: e.target.value }))} placeholder="What this vertical covers"
              style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12, background: 'var(--bg)', color: 'var(--text)', width: 300 }} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Lead</label>
            <select onChange={e => {}} style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12, background: 'var(--bg)', color: 'var(--text)' }}>
              <option value="">No lead</option>
              {team.filter(m => m.status === 'active').map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <button onClick={() => {
            if (!newV.name.trim()) return;
            addVertical({ name: newV.name, description: newV.description, leadId: '', kpis: [] });
            setNewV({ name: '', description: '' });
            setAddingVertical(false);
          }} className="btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}>Create</button>
          <button onClick={() => setAddingVertical(false)} style={{ padding: '6px 14px', fontSize: 12, background: 'none', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-2)' }}>Cancel</button>
        </div>
      )}

      {/* Vertical detail panels */}
      {verticals.map(v => {
        const expanded = expandedId === v.id;
        const vProg = v.kpis.length > 0
          ? Math.round(v.kpis.reduce((s, k) => s + Math.min(100, (k.current / Math.max(k.target, 1)) * 100), 0) / v.kpis.length)
          : 0;
        const lead = team.find(m => m.id === v.leadId);

        return (
          <div key={v.id} className="card" style={{ marginBottom: 12, overflow: 'hidden' }}>
            <div onClick={() => setExpandedId(expanded ? null : v.id)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', cursor: 'pointer', background: expanded ? 'var(--bg-2)' : undefined }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{v.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{v.description}{lead ? ` · Lead: ${lead.name}` : ''}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: progressColor(vProg) }}>{vProg}%</span>
                <div style={{ width: 80, height: 6, borderRadius: 3, background: 'var(--bg-3)', overflow: 'hidden' }}>
                  <div style={{ width: `${vProg}%`, height: '100%', borderRadius: 3, background: progressColor(vProg), transition: 'width 0.3s' }} />
                </div>
              </div>
            </div>

            {expanded && (
              <div style={{ padding: '0 18px 16px' }}>
                {/* Lead selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)' }}>Lead:</span>
                  <select value={v.leadId} onChange={e => updateVertical(v.id, { leadId: e.target.value })}
                    style={{ padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12, background: 'var(--bg)', color: 'var(--text)' }}>
                    <option value="">Unassigned</option>
                    {team.filter(m => m.status === 'active').map(m => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}
                  </select>
                  <div style={{ flex: 1 }} />
                  <button onClick={(e) => { e.stopPropagation(); handleAddKpi(v.id); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: '1px solid var(--accent)', borderRadius: 4, background: 'transparent', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: 'var(--accent)' }}>
                    <Plus size={12} /> Add KPI
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${v.name}" vertical?`)) removeVertical(v.id); }}
                    style={{ padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 4, background: 'transparent', cursor: 'pointer', color: 'var(--red)', fontSize: 11 }}>
                    <Trash2 size={12} />
                  </button>
                </div>

                {/* KPI rows */}
                {v.kpis.length === 0 ? (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                    No KPIs yet. Click "Add KPI" to start tracking.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 140px 40px', gap: 8, padding: '0 4px', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <span>KPI</span><span>Current</span><span>Target</span><span>Unit</span><span>Progress</span><span />
                    </div>
                    {v.kpis.map(k => {
                      const pct = Math.min(100, Math.round((k.current / Math.max(k.target, 1)) * 100));
                      const isEditing = editingKpi === k.id;
                      return (
                        <div key={k.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 140px 40px', gap: 8, alignItems: 'center', padding: '6px 4px', borderRadius: 4, background: 'var(--bg-2)' }}>
                          {isEditing ? (
                            <>
                              <input defaultValue={k.name} onBlur={e => handleUpdateKpi(v.id, k.id, { name: e.target.value })}
                                style={{ padding: '3px 6px', border: '1px solid var(--border)', borderRadius: 3, fontSize: 12, background: 'var(--bg)', color: 'var(--text)' }} />
                              <input type="number" defaultValue={k.current} onBlur={e => handleUpdateKpi(v.id, k.id, { current: Number(e.target.value) })}
                                style={{ padding: '3px 6px', border: '1px solid var(--border)', borderRadius: 3, fontSize: 12, background: 'var(--bg)', color: 'var(--text)', width: 70 }} />
                              <input type="number" defaultValue={k.target} onBlur={e => handleUpdateKpi(v.id, k.id, { target: Number(e.target.value) })}
                                style={{ padding: '3px 6px', border: '1px solid var(--border)', borderRadius: 3, fontSize: 12, background: 'var(--bg)', color: 'var(--text)', width: 70 }} />
                              <input defaultValue={k.unit} onBlur={e => handleUpdateKpi(v.id, k.id, { unit: e.target.value })}
                                style={{ padding: '3px 6px', border: '1px solid var(--border)', borderRadius: 3, fontSize: 12, background: 'var(--bg)', color: 'var(--text)', width: 70 }} />
                              <div />
                              <button onClick={() => setEditingKpi(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--green)' }}><Check size={14} /></button>
                            </>
                          ) : (
                            <>
                              <span style={{ fontSize: 12, fontWeight: 600 }}>{k.name}</span>
                              <input type="number" value={k.current}
                                onChange={e => handleUpdateKpi(v.id, k.id, { current: Number(e.target.value) })}
                                style={{ padding: '3px 6px', border: '1px solid var(--border)', borderRadius: 3, fontSize: 12, background: 'var(--bg)', color: 'var(--text)', width: 70 }} />
                              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{k.target} {k.unit}</span>
                              <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{k.unit}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-3)', overflow: 'hidden' }}>
                                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: progressColor(pct), transition: 'width 0.3s' }} />
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 700, color: progressColor(pct), minWidth: 32 }}>{pct}%</span>
                              </div>
                              <div style={{ display: 'flex', gap: 2 }}>
                                <button onClick={() => setEditingKpi(k.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 2 }}><Edit3 size={12} /></button>
                                <button onClick={() => handleRemoveKpi(v.id, k.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 2 }}><Trash2 size={12} /></button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Team Performance Section */}
      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={18} /> Team Performance
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {teamStats.map(m => (
            <div key={m.id} className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                {m.name.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{m.role}</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: progressColor(m.rate) }}>{m.rate}%</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--bg-3)', overflow: 'hidden' }}>
                    <div style={{ width: `${m.rate}%`, height: '100%', borderRadius: 2, background: progressColor(m.rate), transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{m.completedTasks}/{m.totalTasks} tasks</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
