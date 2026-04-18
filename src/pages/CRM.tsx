import { useRef, useState, useMemo } from 'react';
import { useStore } from '../store';
import DataTable from '../components/DataTable';
import { Upload, Copy, Trash2, Check } from 'lucide-react';
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

// Flexible column matching — tries multiple patterns for each field
function buildColumnMap(headers: string[]): Record<string, string> {
  const lower = headers.map(h => h.toLowerCase().trim());
  
  const find = (...patterns: (string | RegExp)[]) => {
    for (const p of patterns) {
      const idx = lower.findIndex(h => typeof p === 'string' ? h === p || h.includes(p) : p.test(h));
      if (idx >= 0) return headers[idx];
    }
    return '';
  };

  return {
    name: find('full name', 'fullname', 'contact name', 'contactname', 'person', 'contact', 'name', /^first/),
    firstName: find('first name', 'firstname', 'first', 'given name'),
    lastName: find('last name', 'lastname', 'last', 'surname', 'family name'),
    email: find('email', 'e-mail', 'mail', /email/),
    phone: find('phone', 'mobile', 'cell', 'telephone', 'tel', /phone/),
    linkedin: find('linkedin', 'linked in', /linkedin/),
    organisation: find('organisation', 'organization', 'company', 'firm', 'business', 'employer', 'org', /compan/),
    role: find('role', 'title', 'position', 'job title', 'job role', 'designation', /title|role|position/),
    notes: find('notes', 'note', 'comments', 'comment', 'description', 'desc', 'info', 'details'),
    type: find('type', 'category', 'contact type', 'status'),
  };
}

export default function CRM() {
  const { contacts, update, add, remove } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState('');
  const [showDupes, setShowDupes] = useState(false);

  // Find duplicates by name or email
  const duplicates = useMemo(() => {
    const groups: Record<string, typeof contacts> = {};
    contacts.forEach(c => {
      const nameKey = c.name.toLowerCase().trim();
      const emailKey = c.email?.toLowerCase().trim();
      // Group by name
      if (nameKey) {
        if (!groups[nameKey]) groups[nameKey] = [];
        if (!groups[nameKey].find(x => x.id === c.id)) groups[nameKey].push(c);
      }
      // Also group by email if present
      if (emailKey) {
        const eKey = `email:${emailKey}`;
        if (!groups[eKey]) groups[eKey] = [];
        if (!groups[eKey].find(x => x.id === c.id)) groups[eKey].push(c);
      }
    });
    // Return only groups with 2+ entries
    const seen = new Set<string>();
    const result: { key: string; items: typeof contacts }[] = [];
    Object.entries(groups).forEach(([key, items]) => {
      if (items.length < 2) return;
      const ids = items.map(i => i.id).sort().join(',');
      if (seen.has(ids)) return;
      seen.add(ids);
      result.push({ key, items });
    });
    return result;
  }, [contacts]);

  const removeDuplicate = (keepId: string, removeId: string) => {
    // Merge notes/tags from removed into kept
    const keep = contacts.find(c => c.id === keepId);
    const dup = contacts.find(c => c.id === removeId);
    if (keep && dup) {
      const mergedNotes = [keep.notes, dup.notes].filter(Boolean).join('\n');
      const mergedTags = [...new Set([...(keep.tags || []), ...(dup.tags || [])])];
      // Fill empty fields from duplicate
      const updates: Record<string, any> = { notes: mergedNotes, tags: mergedTags };
      if (!keep.email && dup.email) updates.email = dup.email;
      if (!keep.phone && dup.phone) updates.phone = dup.phone;
      if (!keep.linkedin && dup.linkedin) updates.linkedin = dup.linkedin;
      if (!keep.organisation && dup.organisation) updates.organisation = dup.organisation;
      if (!keep.role && dup.role) updates.role = dup.role;
      update('contacts', keepId, updates);
    }
    remove('contacts', removeId);
  };

  const removeAllDuplicates = () => {
    let removed = 0;
    duplicates.forEach(({ items }) => {
      // Keep the first (most complete) — the one with most filled fields
      const sorted = [...items].sort((a, b) => {
        const fields = ['email', 'phone', 'linkedin', 'organisation', 'role', 'notes'];
        const aCount = fields.filter(f => (a as any)[f]).length;
        const bCount = fields.filter(f => (b as any)[f]).length;
        return bCount - aCount;
      });
      const keep = sorted[0];
      sorted.slice(1).forEach(dup => {
        removeDuplicate(keep.id, dup.id);
        removed++;
      });
    });
    setImportMsg(`Removed ${removed} duplicate${removed !== 1 ? 's' : ''}`);
    setTimeout(() => setImportMsg(''), 5000);
    setShowDupes(false);
  };

  const handleFile = async (file: File) => {
    try {
      let data: any[] = [];
      let headers: string[] = [];

      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length === 0) { setImportMsg('Empty file'); return; }
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
        if (json.length === 0) { setImportMsg('Empty spreadsheet'); return; }
        
        // Find the header row — sometimes row 0 is a title, look for row with most non-empty cells
        let headerIdx = 0;
        if (json.length > 2) {
          let maxCols = 0;
          for (let i = 0; i < Math.min(5, json.length); i++) {
            const nonEmpty = (json[i] || []).filter(c => c != null && String(c).trim()).length;
            if (nonEmpty > maxCols) { maxCols = nonEmpty; headerIdx = i; }
          }
        }
        
        headers = (json[headerIdx] || []).map(h => h != null ? String(h).trim() : '').filter(Boolean);
        data = json.slice(headerIdx + 1).filter(row => row && row.some((c: any) => c != null && String(c).trim())).map(row => {
          const obj: Record<string, string> = {};
          headers.forEach((h, i) => obj[h] = row[i] != null ? String(row[i]).trim() : '');
          return obj;
        });
      } else {
        setImportMsg('Unsupported file type. Use CSV or Excel.');
        return;
      }

      if (data.length === 0) { setImportMsg('No data rows found'); return; }

      const colMap = buildColumnMap(headers);

      let imported = 0;
      data.forEach(row => {
        // Build name from either full name column or first+last
        let name = colMap.name ? (row[colMap.name] || '').trim() : '';
        if (!name && colMap.firstName) {
          const first = (row[colMap.firstName] || '').trim();
          const last = colMap.lastName ? (row[colMap.lastName] || '').trim() : '';
          name = [first, last].filter(Boolean).join(' ');
        }
        // If still no name, try the first column as fallback
        if (!name && headers.length > 0) {
          const firstVal = (row[headers[0]] || '').trim();
          // Only use if it looks like a name (has letters, not too long, not a number)
          if (firstVal && firstVal.length < 60 && /[a-zA-Z]/.test(firstVal) && !/^\d+$/.test(firstVal)) {
            name = firstVal;
          }
        }
        if (!name) return;

        // Detect type from column if present
        const rawType = colMap.type ? (row[colMap.type] || '').toLowerCase().trim() : '';
        const validTypes = ['team', 'investor', 'advisor', 'alumni', 'partner', 'sponsor', 'speaker', 'prospect'];
        const type = validTypes.includes(rawType) ? rawType : 'prospect';

        add('contacts', {
          name,
          email: colMap.email ? row[colMap.email] || '' : '',
          phone: colMap.phone ? row[colMap.phone] || '' : '',
          linkedin: colMap.linkedin ? row[colMap.linkedin] || '' : '',
          type: type as any,
          organisation: colMap.organisation ? row[colMap.organisation] || '' : '',
          role: colMap.role ? row[colMap.role] || '' : '',
          notes: colMap.notes ? row[colMap.notes] || '' : '',
          tags: [],
        });
        imported++;
      });

      const mapped = Object.entries(colMap).filter(([, v]) => v).map(([k, v]) => `${k}="${v}"`).join(', ');
      setImportMsg(imported > 0
        ? `Imported ${imported} contacts (${mapped})`
        : `0 contacts imported. Headers found: ${headers.join(', ')}. Could not detect a name column.`
      );
      setTimeout(() => setImportMsg(''), 10000);
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
          {duplicates.length > 0 && (
            <button onClick={() => setShowDupes(!showDupes)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px solid var(--yellow)', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: showDupes ? 'var(--yellow-light)' : 'var(--bg)', color: 'var(--yellow-dark, #92400e)', fontFamily: 'var(--sans)' }}>
              <Copy size={13} /> {duplicates.length} duplicate{duplicates.length !== 1 ? 's' : ''}
            </button>
          )}
          <input type="file" ref={fileRef} style={{ display: 'none' }} accept=".csv,.xlsx,.xls" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
          <button onClick={() => fileRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'var(--bg)', color: 'var(--text-2)', fontFamily: 'var(--sans)' }}>
            <Upload size={13} /> Import File
          </button>
        </div>
      </div>

      {importMsg && (
        <div style={{ padding: '8px 14px', marginBottom: 16, borderRadius: 4, background: importMsg.includes('0 contacts') || importMsg.startsWith('Error') ? 'var(--red-light)' : 'var(--green-light)', color: importMsg.includes('0 contacts') || importMsg.startsWith('Error') ? 'var(--red)' : 'var(--green)', fontSize: 12, fontWeight: 600 }}>
          {importMsg}
        </div>
      )}

      {showDupes && duplicates.length > 0 && (
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Duplicate Contacts</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{duplicates.length} group{duplicates.length !== 1 ? 's' : ''} found — matching by name or email</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={removeAllDuplicates} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', border: 'none', borderRadius: 4, background: 'var(--red)', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                <Trash2 size={12} /> Remove All Duplicates
              </button>
              <button onClick={() => setShowDupes(false)} style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg)', fontSize: 11, cursor: 'pointer', color: 'var(--text-2)' }}>
                Close
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflow: 'auto' }}>
            {duplicates.map(({ key, items }) => (
              <div key={key} style={{ padding: '10px 12px', background: 'var(--bg-2)', borderRadius: 6, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {key.startsWith('email:') ? `Email: ${key.slice(6)}` : `Name: "${key}"`} — {items.length} entries
                </div>
                {items.map((item, idx) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      {idx === 0 && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: 'var(--green-light)', color: 'var(--green)', fontWeight: 600 }}>KEEP</span>}
                      {idx > 0 && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: 'var(--red-light)', color: 'var(--red)', fontWeight: 600 }}>DUP</span>}
                      <span style={{ fontWeight: 600 }}>{item.name}</span>
                      <span style={{ color: 'var(--text-3)' }}>{item.email}</span>
                      <span style={{ color: 'var(--text-3)' }}>{item.organisation}</span>
                    </div>
                    {idx > 0 && (
                      <button onClick={() => removeDuplicate(items[0].id, item.id)} style={{ padding: '2px 8px', border: '1px solid var(--red)', borderRadius: 3, background: 'transparent', fontSize: 10, cursor: 'pointer', color: 'var(--red)', fontWeight: 600 }}>
                        Merge & Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
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
