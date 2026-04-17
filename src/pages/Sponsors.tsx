import { useState } from 'react';
import { Plus, Phone, LayoutGrid, Table2 } from 'lucide-react';
import { useStore } from '../store';
import DataTable from '../components/DataTable';

const STAGES = ['Prospecting', 'Proposal Sent', 'Negotiating', 'Confirmed'] as const;
const STAGE_COLORS: Record<string, string> = { Prospecting: 'var(--text-3)', 'Proposal Sent': 'var(--blue)', Negotiating: 'var(--yellow)', Confirmed: 'var(--green)' };

const stageMap: Record<string, string> = { prospect: 'Prospecting', contacted: 'Proposal Sent', in_discussion: 'Negotiating', agreed: 'Confirmed', active: 'Confirmed' };
const reverseStageMap: Record<string, string> = { Prospecting: 'prospect', 'Proposal Sent': 'contacted', Negotiating: 'in_discussion', Confirmed: 'agreed' };

const TABLE_COLS = [
  { key: 'name', label: 'Name', width: 180 },
  { key: 'contactPerson', label: 'Contact', width: 140 },
  { key: 'contactEmail', label: 'Email', width: 160 },
  { key: 'status', label: 'Stage', type: 'select' as const, options: [{ value: 'prospect', label: 'Prospecting' }, { value: 'contacted', label: 'Proposal Sent' }, { value: 'in_discussion', label: 'Negotiating' }, { value: 'agreed', label: 'Confirmed' }, { value: 'active', label: 'Active' }] },
  { key: 'notes', label: 'Notes', width: 200 },
  { key: 'nextAction', label: 'Next Action', width: 160 },
];

export default function Sponsors() {
  const { partnerships, update, add, remove } = useStore();
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [dragId, setDragId] = useState<string | null>(null);

  const sponsors = partnerships.filter(p => p.type === 'sponsor' || p.type === 'investor');
  const getStage = (p: any) => stageMap[p.status] || 'Prospecting';
  const inStage = (stage: string) => sponsors.filter(s => getStage(s) === stage);

  const addSponsor = () => {
    add('partnerships', { name: '', type: 'sponsor', contactPerson: '', contactEmail: '', status: 'prospect', notes: '', lastContactDate: '', nextAction: '' });
  };

  const moveTo = (sponsorId: string, stage: string) => {
    const newStatus = reverseStageMap[stage];
    if (newStatus) update('partnerships', sponsorId, { status: newStatus, lastContactDate: new Date().toISOString().slice(0, 10) });
  };

  return (
    <div style={{ padding: '32px 40px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Sponsor Pipeline</h1>
          <p>{sponsors.length} sponsors tracked</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-2)', borderRadius: 4, padding: 2 }}>
            <button onClick={() => setView('kanban')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', border: 'none', borderRadius: 3, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: view === 'kanban' ? 'var(--accent)' : 'transparent', color: view === 'kanban' ? 'white' : 'var(--text-2)', fontFamily: 'var(--sans)' }}>
              <LayoutGrid size={13} /> Kanban
            </button>
            <button onClick={() => setView('table')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', border: 'none', borderRadius: 3, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: view === 'table' ? 'var(--accent)' : 'transparent', color: view === 'table' ? 'white' : 'var(--text-2)', fontFamily: 'var(--sans)' }}>
              <Table2 size={13} /> Table
            </button>
          </div>
          <button onClick={addSponsor} className="btn-primary">
            <Plus size={14} /> Add Sponsor
          </button>
        </div>
      </div>

      {view === 'table' ? (
        <DataTable
          columns={TABLE_COLS}
          data={sponsors}
          onUpdate={(itemId, updates) => update('partnerships', itemId, updates)}
          onDelete={(itemId) => remove('partnerships', itemId)}
          entityName="sponsors"
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, alignItems: 'flex-start' }}>
          {STAGES.map(stage => (
            <div key={stage}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); if (dragId) moveTo(dragId, stage); setDragId(null); }}
              style={{ background: 'var(--bg-2)', borderRadius: 4, padding: 12, minHeight: 300, borderTop: `3px solid ${STAGE_COLORS[stage]}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--sans)' }}>{stage}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', background: 'var(--bg)', padding: '1px 6px', borderRadius: 3 }}>
                  {inStage(stage).length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {inStage(stage).map(s => (
                  <div key={s.id} draggable onDragStart={() => setDragId(s.id)} onDragEnd={() => setDragId(null)}
                    className="card" style={{ padding: '10px 12px', cursor: 'grab' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{s.name || 'Untitled'}</div>
                    {s.contactPerson && (
                      <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Phone size={10} /> {s.contactPerson}
                      </div>
                    )}
                    {s.notes && <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.4 }}>{s.notes}</div>}
                    {s.nextAction && (
                      <div style={{ fontSize: 10, marginTop: 6, padding: '2px 6px', borderRadius: 3, background: 'var(--accent-light)', color: 'var(--accent)', fontWeight: 600 }}>
                        Next: {s.nextAction}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
