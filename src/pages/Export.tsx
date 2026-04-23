import { Download, FileSpreadsheet, FileText, FileJson, Printer } from 'lucide-react';
import { useStore } from '../store';
import { exportCSV, exportExcel, exportJSON, exportAllExcel, exportPDF } from '../lib/fileExporter';

const ENTITIES = [
  { key: 'team', label: 'Team Members' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'events', label: 'Events' },
  { key: 'partnerships', label: 'Partnerships' },
  { key: 'contacts', label: 'CRM Contacts' },
  { key: 'content', label: 'Content' },
  { key: 'outreach', label: 'Outreach' },
  { key: 'memberTasks', label: 'Member Tasks' },
  { key: 'playbooks', label: 'Playbooks' },
  { key: 'verticals', label: 'KPI Verticals' },
  { key: 'users', label: 'User Accounts' },
];

export default function Export() {
  const store = useStore();

  const getData = (key: string) => (store as any)[key] as any[];

  const allData = () => {
    const d: Record<string, any[]> = {};
    ENTITIES.forEach(e => { d[e.key] = getData(e.key); });
    return d;
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Export Data</h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 2 }}>Download your CETAC data in any format</p>
      </div>

      {/* Export All */}
      <div style={{ padding: '20px', background: 'var(--accent-light)', border: '1px solid var(--accent)', borderRadius: 10, marginBottom: 24, borderColor: 'rgba(94, 106, 210, 0.2)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>Export Everything</h3>
        <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12 }}>Download all CETAC data in one file — each entity type gets its own sheet/section.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => exportAllExcel(allData(), 'CETAC-All-Data')}
            style={btnStyle('var(--accent)', 'white')}>
            <FileSpreadsheet size={14} /> Excel (.xlsx)
          </button>
          <button onClick={() => exportJSON(allData(), 'CETAC-All-Data')}
            style={btnStyle('var(--bg)', 'var(--text)')}>
            <FileJson size={14} /> JSON
          </button>
          <button onClick={() => exportPDF(allData(), 'CETAC Full Report')}
            style={btnStyle('var(--bg)', 'var(--text)')}>
            <Printer size={14} /> Print / PDF
          </button>
        </div>
      </div>

      {/* Per-entity exports */}
      <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Export by Section</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ENTITIES.map(e => {
          const data = getData(e.key);
          return (
            <div key={e.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{e.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{data.length} records</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => exportCSV(data, `CETAC-${e.label}`)} disabled={data.length === 0}
                  style={smallBtn(data.length === 0)} title="CSV">
                  <FileText size={12} /> CSV
                </button>
                <button onClick={() => exportExcel(data, `CETAC-${e.label}`, e.label)} disabled={data.length === 0}
                  style={smallBtn(data.length === 0)} title="Excel">
                  <FileSpreadsheet size={12} /> Excel
                </button>
                <button onClick={() => exportJSON(data, `CETAC-${e.label}`)} disabled={data.length === 0}
                  style={smallBtn(data.length === 0)} title="JSON">
                  <FileJson size={12} /> JSON
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const btnStyle = (bg: string, color: string): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
  border: bg === 'var(--bg)' ? '1px solid var(--border)' : 'none',
  borderRadius: 6, background: bg, color, fontSize: 12, fontWeight: 600, cursor: 'pointer',
});

const smallBtn = (disabled: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
  border: '1px solid var(--border)', borderRadius: 5, background: 'var(--bg)',
  color: disabled ? 'var(--text-3)' : 'var(--text)', fontSize: 11, fontWeight: 500,
  cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1,
});
