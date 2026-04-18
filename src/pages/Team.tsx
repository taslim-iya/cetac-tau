import { useState, useRef } from 'react';
import { Upload, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useStore } from '../store';
import DataTable from '../components/DataTable';
import { parseSpreadsheet, extractText, detectEntityType, mapToEntity, aiParseText } from '../lib/fileParser';
import { id } from '../lib/utils';

const STATUS_OPTS = [
  { value: 'active', label: 'Active' }, { value: 'potential', label: 'Potential' }, { value: 'new', label: 'New' },
];

const COLUMNS = [
  { key: 'name', label: 'Name', width: 140 },
  { key: 'role', label: 'Role', width: 180 },
  { key: 'responsibilities', label: 'Responsibilities' },
  { key: 'status', label: 'Status', width: 100, type: 'select' as const, options: STATUS_OPTS },
  { key: 'email', label: 'Email', width: 160 },
  { key: 'phone', label: 'Phone', width: 120, hidden: true },
  { key: 'linkedin', label: 'LinkedIn', width: 140, hidden: true },
  { key: 'vertical', label: 'Vertical', width: 120 },
];

export default function Team() {
  const { team, update, add, remove, settings } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleFile = async (file: File) => {
    setImporting(true);
    setImportResult(null);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();

      // Try structured parsing first (CSV, Excel)
      if (ext === 'csv' || ext === 'xlsx' || ext === 'xls') {
        const buf = await file.arrayBuffer();
        const rows = parseSpreadsheet(buf, file.name);
        if (rows.length > 0) {
          const items = mapToEntity(rows, 'team');
          items.forEach(item => add('team', item));
          setImportResult({ ok: true, msg: `Imported ${items.length} member${items.length !== 1 ? 's' : ''} from ${file.name}` });
          setImporting(false);
          return;
        }
      }

      // For all other file types (PDF, DOCX, TXT, JSON, or if spreadsheet had no rows) — extract text and send to AI
      const text = await extractText(file);
      if (!text.trim()) {
        setImportResult({ ok: false, msg: 'Could not extract any text from the file' });
        setImporting(false);
        return;
      }

      // Try AI parsing
      const apiKey = settings.openaiKey || '';
      const aiResult = await aiParseText(text, apiKey);

      if (aiResult && aiResult.items.length > 0) {
        // AI parsed it — map to team members regardless of detected type
        const members = aiResult.items.map((item: any) => ({
          id: id(),
          createdAt: new Date().toISOString(),
          name: item.name || item.contactName || item.title || '',
          role: item.role || item.position || item.title || '',
          responsibilities: item.responsibilities || item.description || item.notes || '',
          email: item.email || item.contactEmail || '',
          phone: item.phone || item.telephone || item.mobile || '',
          linkedin: item.linkedin || '',
          status: item.status === 'active' || item.status === 'potential' || item.status === 'new' ? item.status : 'new',
          vertical: item.vertical || item.category || item.department || '',
        }));

        members.forEach((m: any) => add('team', m));
        setImportResult({ ok: true, msg: `AI imported ${members.length} member${members.length !== 1 ? 's' : ''} from ${file.name}` });
      } else {
        // Fallback: try to parse as line-per-person (name, email pairs)
        const lines = text.split('\n').filter(l => l.trim());
        const members: any[] = [];

        for (const line of lines) {
          const emailMatch = line.match(/[\w.-]+@[\w.-]+\.\w+/);
          const cleaned = line.replace(/[\w.-]+@[\w.-]+\.\w+/, '').replace(/[,;|]/, ' ').trim();
          if (cleaned || emailMatch) {
            members.push({
              name: cleaned.split(/\s{2,}|\t/)[0]?.trim() || '',
              email: emailMatch?.[0] || '',
              role: '', responsibilities: '', phone: '', linkedin: '',
              status: 'new' as const, vertical: '',
            });
          }
        }

        if (members.length > 0) {
          members.forEach(m => add('team', m));
          setImportResult({ ok: true, msg: `Parsed ${members.length} member${members.length !== 1 ? 's' : ''} from text (basic extraction)` });
        } else {
          setImportResult({ ok: false, msg: 'Could not parse any team members from the file. Try CSV or Excel format.' });
        }
      }
    } catch (err: any) {
      setImportResult({ ok: false, msg: `Error: ${err.message || 'Failed to parse file'}` });
    }

    setImporting(false);
  };

  return (
    <div style={{ padding: '32px 40px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Team</h1>
          <p>{team.length} member{team.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {importResult && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: importResult.ok ? 'var(--green)' : 'var(--red)', fontWeight: 500, maxWidth: 300 }}>
              {importResult.ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
              {importResult.msg}
            </div>
          )}
          <button onClick={() => fileRef.current?.click()} disabled={importing} className="btn-primary" style={{ gap: 6 }}>
            {importing ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={14} />}
            {importing ? 'Parsing...' : 'Import File'}
          </button>
          <input
            ref={fileRef}
            type="file"
            style={{ display: 'none' }}
            accept=".csv,.xlsx,.xls,.pdf,.txt,.docx,.doc,.json"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
          />
        </div>
      </div>

      <DataTable
        columns={COLUMNS}
        data={team}
        onUpdate={(id, updates) => update('team', id, updates)}
        onDelete={(id) => remove('team', id)}
        onAdd={() => add('team', { name: '', role: '', responsibilities: '', email: '', phone: '', linkedin: '', status: 'new', vertical: '' })}
        addLabel="Add Member"
        entityName="members"
        defaultSort={{ key: 'name', dir: 'asc' }}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
