import { useState } from 'react';
import { Plus, GripVertical, Building2, Phone, Mail, Banknote } from 'lucide-react';
import { useStore } from '../store';
import { id } from '../lib/utils';

const STAGES = ['Prospecting', 'Proposal Sent', 'Negotiating', 'Confirmed'] as const;
const STAGE_COLORS = { Prospecting: 'var(--text-3)', 'Proposal Sent': 'var(--blue)', Negotiating: 'var(--yellow)', Confirmed: 'var(--green)' };

interface Sponsor { id: string; name: string; contactPerson: string; contactEmail: string; value: string; stage: string; deliverables: string; notes: string; }

export default function Sponsors() {
  const { partnerships, update, add } = useStore();

  // Use partnerships with type='sponsor' or 'investor' as sponsor pipeline
  const sponsors = partnerships.filter(p => p.type === 'sponsor' || p.type === 'investor');

  const stageMap: Record<string, string> = { prospect: 'Prospecting', contacted: 'Proposal Sent', in_discussion: 'Negotiating', agreed: 'Confirmed', active: 'Confirmed' };
  const reverseStageMap: Record<string, string> = { Prospecting: 'prospect', 'Proposal Sent': 'contacted', Negotiating: 'in_discussion', Confirmed: 'agreed' };

  const getStage = (p: any) => stageMap[p.status] || 'Prospecting';
  const inStage = (stage: string) => sponsors.filter(s => getStage(s) === stage);

  const [dragId, setDragId] = useState<string | null>(null);

  const addSponsor = () => {
    add('partnerships', { name: '', type: 'sponsor', contactPerson: '', contactEmail: '', status: 'prospect', notes: '', lastContactDate: '', nextAction: '' });
  };

  const moveTo = (sponsorId: string, stage: string) => {
    const newStatus = reverseStageMap[stage];
    if (newStatus) update('partnerships', sponsorId, { status: newStatus, lastContactDate: new Date().toISOString().slice(0, 10) });
  };

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Sponsor Pipeline</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 2 }}>{sponsors.length} sponsors — drag between stages</p>
        </div>
        <button onClick={addSponsor} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: 'none', borderRadius: 6, background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={14} /> Add Sponsor
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, alignItems: 'flex-start' }}>
        {STAGES.map(stage => (
          <div key={stage}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); if (dragId) moveTo(dragId, stage); setDragId(null); }}
            style={{ background: 'var(--bg-2)', borderRadius: 8, padding: '12px', minHeight: 300 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: STAGE_COLORS[stage] }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{stage}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', background: 'var(--bg)', padding: '1px 6px', borderRadius: 8 }}>
                {inStage(stage).length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {inStage(stage).map(s => (
                <div key={s.id} draggable
                  onDragStart={() => setDragId(s.id)}
                  onDragEnd={() => setDragId(null)}
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', cursor: 'grab', transition: 'box-shadow 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{s.name || 'Untitled'}</div>
                  {s.contactPerson && (
                    <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Phone size={10} /> {s.contactPerson}
                    </div>
                  )}
                  {s.notes && (
                    <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.4 }}>{s.notes}</div>
                  )}
                  {s.nextAction && (
                    <div style={{ fontSize: 10, marginTop: 6, padding: '2px 6px', borderRadius: 6, background: 'var(--accent-light)', color: 'var(--accent)', fontWeight: 600 }}>
                      Next: {s.nextAction}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
