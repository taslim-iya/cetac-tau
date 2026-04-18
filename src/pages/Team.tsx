import { useState, useRef } from 'react';
import { Upload, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useStore } from '../store';
import DataTable from '../components/DataTable';
import { parseSpreadsheet, extractText } from '../lib/fileParser';
import { id } from '../lib/utils';
import RoleCombobox from '../components/RoleCombobox';

const STATUS_OPTS = [
  { value: 'active', label: 'Active' }, { value: 'potential', label: 'Potential' }, { value: 'new', label: 'New' },
];

// Enhanced AI parsing prompt specifically for team members
async function aiParseTeamMembers(text: string, apiKey: string): Promise<any[] | null> {
  const prompt = `You are parsing a document to extract TEAM MEMBERS for a club/organisation management platform.

Extract every person you can find. For each person, extract:
- name: Full name
- role: Their role/position/title (e.g. "President", "VP Operations", "Member", "Marketing Officer", "Event Manager")
- responsibilities: What they do, their duties, areas of focus (be detailed — include ALL mentioned responsibilities, tasks, and areas they handle)
- email: Email address if present
- phone: Phone number if present
- linkedin: LinkedIn URL if present
- status: "active" if currently on the team, "potential" if mentioned as a prospect/candidate, "new" if just joined

IMPORTANT:
- Extract ALL people mentioned, even if they only appear once
- For responsibilities, combine ALL mentioned duties/tasks/areas into one descriptive string
- If someone has a title like "VP of X", that's their role
- If duties are listed separately (bullet points, commas, paragraphs), combine them into one string
- Look for patterns like "Name - Role" or "Name (Role)" or "Name: responsibilities..."
- Be thorough with responsibilities — include every task, duty, or area mentioned

Return ONLY valid JSON array:
[
  { "name": "...", "role": "...", "responsibilities": "...", "email": "...", "phone": "...", "linkedin": "...", "status": "active" }
]

Text to parse:
${text.slice(0, 12000)}`;

  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, apiKey }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || data.content || '';
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

export default function Team() {
  const { team, update, add, remove, settings, roles, addRole } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Build columns dynamically with role options from store
  const COLUMNS = [
    { key: 'name', label: 'Name', width: 140 },
    { key: 'role', label: 'Role', width: 200,
      render: (value: string, row: any) => (
        <RoleCombobox
          value={value}
          roles={roles}
          onChange={(newRole) => {
            update('team', row.id, { role: newRole });
            // Auto-add new role to global list
            if (newRole && !roles.includes(newRole)) addRole(newRole);
          }}
        />
      ),
    },
    { key: 'responsibilities', label: 'Responsibilities' },
    { key: 'status', label: 'Status', width: 100, type: 'select' as const, options: STATUS_OPTS },
    { key: 'email', label: 'Email', width: 180 },
    { key: 'phone', label: 'Phone', width: 120, hidden: true },
    { key: 'linkedin', label: 'LinkedIn', width: 140, hidden: true },
  ];

  const handleFile = async (file: File) => {
    setImporting(true);
    setImportResult(null);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'csv' || ext === 'xlsx' || ext === 'xls') {
        const buf = await file.arrayBuffer();
        const rows = parseSpreadsheet(buf, file.name);
        if (rows.length > 0) {
          let imported = 0;
          rows.forEach(row => {
            const name = row['name'] || row['full name'] || row['member'] || row['person'] || '';
            if (!name) return;
            const role = row['role'] || row['title'] || row['position'] || row['designation'] || '';
            // Auto-add new role
            if (role && !roles.includes(role)) addRole(role);
            add('team', {
              name, role,
              responsibilities: row['responsibilities'] || row['duties'] || row['description'] || row['tasks'] || row['notes'] || '',
              email: row['email'] || row['e-mail'] || '',
              phone: row['phone'] || row['mobile'] || row['telephone'] || '',
              linkedin: row['linkedin'] || '',
              status: (row['status'] || 'new').toLowerCase() as any,
              vertical: '',
            });
            imported++;
          });
          setImportResult({ ok: true, msg: `Imported ${imported} member${imported !== 1 ? 's' : ''}` });
          setImporting(false);
          return;
        }
      }

      const text = await extractText(file);
      if (!text.trim()) {
        setImportResult({ ok: false, msg: 'Could not extract any text from the file' });
        setImporting(false);
        return;
      }

      const apiKey = (settings as any).openaiApiKey || '';
      const members = await aiParseTeamMembers(text, apiKey);

      if (members && members.length > 0) {
        members.forEach((item: any) => {
          const role = item.role || item.position || item.title || '';
          // Auto-add new role from AI parsing
          if (role && !roles.includes(role)) addRole(role);
          add('team', {
            name: item.name || '',
            role,
            responsibilities: item.responsibilities || item.duties || item.description || '',
            email: item.email || '',
            phone: item.phone || '',
            linkedin: item.linkedin || '',
            status: ['active', 'potential', 'new'].includes(item.status) ? item.status : 'new',
            vertical: '',
          });
        });
        setImportResult({ ok: true, msg: `AI imported ${members.length} member${members.length !== 1 ? 's' : ''} with roles & responsibilities` });
      } else {
        const lines = text.split('\n').filter(l => l.trim());
        const parsed: any[] = [];
        for (const line of lines) {
          const emailMatch = line.match(/[\w.-]+@[\w.-]+\.\w+/);
          const dashSplit = line.match(/^([^-–—:()]+)\s*[-–—:]\s*(.+)/);
          const parenSplit = line.match(/^([^()]+)\(([^)]+)\)/);
          let name = '', role = '';
          if (dashSplit) {
            name = dashSplit[1].trim();
            const rest = dashSplit[2].trim();
            if (rest.split(' ').length <= 6) role = rest;
          } else if (parenSplit) {
            name = parenSplit[1].trim();
            role = parenSplit[2].trim();
          } else {
            const cleaned = line.replace(/[\w.-]+@[\w.-]+\.\w+/, '').trim();
            name = cleaned.split(/\s{2,}|\t/)[0]?.trim() || '';
          }
          if (name && name.length > 1 && name.length < 60) {
            if (role && !roles.includes(role)) addRole(role);
            parsed.push({ name, role, email: emailMatch?.[0] || '', responsibilities: '', phone: '', linkedin: '', status: 'new', vertical: '' });
          }
        }
        if (parsed.length > 0) {
          parsed.forEach(m => add('team', m));
          setImportResult({ ok: true, msg: `Parsed ${parsed.length} member${parsed.length !== 1 ? 's' : ''}` });
        } else {
          setImportResult({ ok: false, msg: 'Could not parse team members. Try CSV/Excel.' });
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
          <p>{team.length} member{team.length !== 1 ? 's' : ''} · {roles.length} roles</p>
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
          <input ref={fileRef} type="file" style={{ display: 'none' }} accept=".csv,.xlsx,.xls,.pdf,.txt,.docx,.doc,.json"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
        </div>
      </div>

      <DataTable
        columns={COLUMNS}
        data={team}
        onUpdate={(id, updates) => {
          update('team', id, updates);
          if (updates.role && !roles.includes(updates.role)) addRole(updates.role);
        }}
        onDelete={(id) => remove('team', id)}
        onAdd={() => add('team', { name: '', role: 'Member', responsibilities: '', email: '', phone: '', linkedin: '', status: 'new', vertical: '' })}
        addLabel="Add Member"
        entityName="members"
        defaultSort={{ key: 'name', dir: 'asc' }}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
