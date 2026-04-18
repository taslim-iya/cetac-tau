import { useState, useRef } from 'react';
import { Upload, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useStore } from '../store';
import DataTable from '../components/DataTable';
import { parseSpreadsheet, extractText } from '../lib/fileParser';
import { id } from '../lib/utils';

const STATUS_OPTS = [
  { value: 'active', label: 'Active' }, { value: 'potential', label: 'Potential' }, { value: 'new', label: 'New' },
];

const ROLE_OPTS = [
  { value: 'President', label: 'President' },
  { value: 'VP Partnerships — External', label: 'VP Partnerships' },
  { value: 'VP Communications & Sponsorship', label: 'VP Communications' },
  { value: 'VP Operations', label: 'VP Operations' },
  { value: 'VP Administration & Events', label: 'VP Admin & Events' },
  { value: 'VP Community', label: 'VP Community' },
  { value: 'Member', label: 'Member' },
  { value: 'Potential Member', label: 'Potential Member' },
];

const COLUMNS = [
  { key: 'name', label: 'Name', width: 140 },
  { key: 'role', label: 'Role', width: 200, type: 'select' as const, options: ROLE_OPTS },
  { key: 'responsibilities', label: 'Responsibilities' },
  { key: 'status', label: 'Status', width: 100, type: 'select' as const, options: STATUS_OPTS },
  { key: 'email', label: 'Email', width: 180 },
  { key: 'phone', label: 'Phone', width: 120, hidden: true },
  { key: 'linkedin', label: 'LinkedIn', width: 140, hidden: true },
];

// Enhanced AI parsing prompt specifically for team members
async function aiParseTeamMembers(text: string, apiKey: string): Promise<any[] | null> {
  const prompt = `You are parsing a document to extract TEAM MEMBERS for a club/organisation management platform.

Extract every person you can find. For each person, extract:
- name: Full name
- role: Their role/position/title (e.g. "President", "VP Operations", "Member", "Marketing Officer", "Event Manager")
- responsibilities: What they do, their duties, areas of focus (be detailed — include ALL mentioned responsibilities)
- email: Email address if present
- phone: Phone number if present
- linkedin: LinkedIn URL if present
- status: "active" if currently on the team, "potential" if mentioned as a prospect/candidate, "new" if just joined

IMPORTANT:
- Extract ALL people mentioned, even if they only appear once
- For responsibilities, combine all mentioned duties/tasks/areas into one string
- If someone has a title like "VP of X", that's their role
- If duties are listed separately (bullet points, commas), combine them
- Look for patterns like "Name - Role" or "Name (Role)" or "Name: responsibilities..."

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
          let imported = 0;
          rows.forEach(row => {
            const name = row['name'] || row['full name'] || row['member'] || row['person'] || '';
            if (!name) return;
            add('team', {
              name,
              role: row['role'] || row['title'] || row['position'] || row['designation'] || '',
              responsibilities: row['responsibilities'] || row['duties'] || row['description'] || row['tasks'] || row['notes'] || '',
              email: row['email'] || row['e-mail'] || '',
              phone: row['phone'] || row['mobile'] || row['telephone'] || '',
              linkedin: row['linkedin'] || '',
              status: (row['status'] || 'new').toLowerCase() as any,
              vertical: '',
            });
            imported++;
          });
          setImportResult({ ok: true, msg: `Imported ${imported} member${imported !== 1 ? 's' : ''} from ${file.name}` });
          setImporting(false);
          return;
        }
      }

      // Extract text from any file type
      const text = await extractText(file);
      if (!text.trim()) {
        setImportResult({ ok: false, msg: 'Could not extract any text from the file' });
        setImporting(false);
        return;
      }

      // Try AI parsing with enhanced team-specific prompt
      const apiKey = settings.openaiKey || '';
      const members = await aiParseTeamMembers(text, apiKey);

      if (members && members.length > 0) {
        members.forEach((item: any) => {
          add('team', {
            name: item.name || '',
            role: item.role || item.position || item.title || '',
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
        // Fallback: line-by-line parsing with smarter patterns
        const lines = text.split('\n').filter(l => l.trim());
        const parsed: any[] = [];

        for (const line of lines) {
          const emailMatch = line.match(/[\w.-]+@[\w.-]+\.\w+/);
          // Try "Name - Role" or "Name (Role)" or "Name: Role"
          const dashSplit = line.match(/^([^-–—:()]+)\s*[-–—:]\s*(.+)/);
          const parenSplit = line.match(/^([^()]+)\(([^)]+)\)/);
          
          let name = '', role = '', rest = '';
          if (dashSplit) {
            name = dashSplit[1].trim();
            rest = dashSplit[2].trim();
            // If rest looks like a role (short, title-case), treat as role
            if (rest.split(' ').length <= 6) { role = rest; } else { role = ''; }
          } else if (parenSplit) {
            name = parenSplit[1].trim();
            role = parenSplit[2].trim();
          } else {
            const cleaned = line.replace(/[\w.-]+@[\w.-]+\.\w+/, '').trim();
            name = cleaned.split(/\s{2,}|\t/)[0]?.trim() || '';
          }

          if (name && name.length > 1 && name.length < 60) {
            parsed.push({
              name, role,
              email: emailMatch?.[0] || '',
              responsibilities: '', phone: '', linkedin: '',
              status: 'new', vertical: '',
            });
          }
        }

        if (parsed.length > 0) {
          parsed.forEach(m => add('team', m));
          setImportResult({ ok: true, msg: `Parsed ${parsed.length} member${parsed.length !== 1 ? 's' : ''} from text` });
        } else {
          setImportResult({ ok: false, msg: 'Could not parse team members. Try CSV/Excel or ensure names are on separate lines.' });
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
        onUpdate={(id, updates) => {
          update('team', id, updates);
          // If role changed, auto-update user permissions
          if (updates.role) {
            const store = useStore.getState();
            const member = store.team.find(m => m.id === id);
            if (member) {
              const user = store.users.find(u => u.name === member.name || u.teamMemberId === id);
              if (user) {
                // Import permsForRole dynamically — it's in the store module
                // For now, just flag the role change; permissions auto-apply on next login
              }
            }
          }
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
