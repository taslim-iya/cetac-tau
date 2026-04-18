import { useRef, useState } from 'react';
import { useStore } from '../store';
import DataTable from '../components/DataTable';
import { Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

const TYPE_OPTS = [
  { value: 'team', label: 'Team' }, { value: 'investor', label: 'Investor' },
  { value: 'advisor', label: 'Advisor' }, { value: 'alumni', label: 'Alumni' },
  { value: 'partner', label: 'Partner' }, { value: 'sponsor', label: 'Sponsor' },
  { value: 'speaker', label: 'Speaker' }, { value: 'prospect', label: 'Prospect' },
];

const COLUMNS = [
  { key: 'name', label: 'Name', width: 150 },
  { key: 'type', label: 'Type', width: 100, type: 'select' as const, options: TYPE_OPTS },
  { key: 'organisation', label: 'Organisation', width: 160 },
  { key: 'role', label: 'Role', width: 140 },
  { key: 'email', label: 'Email', width: 180 },
  { key: 'phone', label: 'Phone', width: 120, hidden: true },
  { key: 'linkedin', label: 'LinkedIn', width: 140, hidden: true },
  { key: 'tags', label: 'Tags', width: 140, type: 'tags' as const },
  { key: 'notes', label: 'Notes', hidden: true },
];

export default function CRM() {
  const { contacts, update, add, remove } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState('');

  const handleFile = async (file: File) => {
    try {
      let data: any[] = [];
      let headers: string[] = [];

      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const lines = text.split('\n').filter(l => l.trim());
        headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        data = lines.slice(1).map(line => {
          const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row: Record<string, string> = {};
          headers.forEach((h, i) => row[h] = vals[i] || '');
          return row;
        });
      } else if (file.name.match(/\.xlsx?$/)) {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
        if (json.length > 0) {
          headers = (json[0] || []).map(h => h != null ? String(h).trim() : '').filter(Boolean);
          data = json.slice(1).filter(row => row && row.length > 0).map(row => {
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => obj[h] = row[i] != null ? String(row[i]).trim() : '');
            return obj;
          });
        }
      } else {
        setImportMsg('Unsupported file type. Use CSV or Excel.');
        return;
      }

      const findHeader = (pattern: RegExp | string) => {
        const match = headers.find(h => typeof pattern === 'string' ? h.toLowerCase().includes(pattern) : pattern.test(h.toLowerCase()));
        return match || '';
      };

      let imported = 0;
      data.forEach(row => {
        const name = (row[findHeader('name')] || '').trim();
        if (!name) return;
        add('contacts', {
          name,
          email: row[findHeader('email')] || '',
          phone: row[findHeader('phone')] || '',
          linkedin: row[findHeader('linkedin')] || '',
          type: 'prospect',
          organisation: row[findHeader(/organ|company|firm/)] || '',
          role: row[findHeader(/role|title|position/)] || '',
          notes: row[findHeader('note')] || '',
          tags: [],
        });
        imported++;
      });
      setImportMsg(`Imported ${imported} contacts from ${file.name}`);
      setTimeout(() => setImportMsg(''), 5000);
    } catch (err) {
      setImportMsg(`Error: ${err}`);
    }
  };

  return (
    <div style={{ padding: '32px 40px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>CRM</h1>
          <p>{contacts.length} contacts</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="file" ref={fileRef} style={{ display: 'none' }} accept=".csv,.xlsx,.xls" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
          <button onClick={() => fileRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'var(--bg)', color: 'var(--text-2)', fontFamily: 'var(--sans)' }}>
            <Upload size={13} /> Import File
          </button>
        </div>
      </div>

      {importMsg && (
        <div style={{ padding: '8px 14px', marginBottom: 16, borderRadius: 4, background: importMsg.startsWith('Error') ? 'var(--red-light)' : 'var(--green-light)', color: importMsg.startsWith('Error') ? 'var(--red)' : 'var(--green)', fontSize: 12, fontWeight: 600 }}>
          {importMsg}
        </div>
      )}

      <DataTable
        columns={COLUMNS}
        data={contacts}
        onUpdate={(id, updates) => update('contacts', id, updates)}
        onDelete={(id) => remove('contacts', id)}
        onAdd={() => add('contacts', { name: '', email: '', phone: '', linkedin: '', type: 'prospect', organisation: '', role: '', notes: '', tags: [] })}
        addLabel="Add Contact"
        entityName="contacts"
        defaultSort={{ key: 'name', dir: 'asc' }}
      />
    </div>
  );
}
