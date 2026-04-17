import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Table, Check, AlertTriangle, Sparkles, X, ChevronDown } from 'lucide-react';
import { useStore } from '../store';
import { parseSpreadsheet, extractText, detectEntityType, mapToEntity, aiParseText } from '../lib/fileParser';

const ENTITY_LABELS: Record<string, string> = {
  contacts: 'CRM Contacts', tasks: 'Tasks', events: 'Events',
  partnerships: 'Partnerships', outreach: 'Outreach', content: 'Content', team: 'Team Members', memberTasks: 'Member Tasks',
};

export default function Import() {
  const store = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, any>[]>([]);
  const [entityType, setEntityType] = useState('contacts');
  const [status, setStatus] = useState<'idle' | 'parsing' | 'preview' | 'ai-parsing' | 'imported'>('idle');
  const [error, setError] = useState('');
  const [aiMode, setAiMode] = useState(false);
  const [importCount, setImportCount] = useState(0);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setError('');
    setStatus('parsing');
    const ext = f.name.split('.').pop()?.toLowerCase();

    try {
      if (ext === 'csv' || ext === 'xlsx' || ext === 'xls') {
        // Structured data — parse directly
        let rows: Record<string, string>[];
        if (ext === 'csv') {
          const text = await f.text();
          const lines = text.trim().split('\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          rows = lines.slice(1).map(line => {
            const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const row: Record<string, string> = {};
            headers.forEach((h, i) => { row[h] = vals[i] || ''; });
            return row;
          });
        } else {
          const buf = await f.arrayBuffer();
          rows = parseSpreadsheet(buf, f.name);
        }

        const detected = detectEntityType(rows);
        setEntityType(detected);
        const mapped = mapToEntity(rows, detected);
        setPreview(mapped);
        setAiMode(false);
        setStatus('preview');
      } else {
        // Unstructured — extract text, offer AI parsing
        const text = await extractText(f);
        if (text.length < 20) {
          setError(`Couldn't extract enough text from ${f.name}. Try CSV or Excel for best results.`);
          setStatus('idle');
          return;
        }
        setAiMode(true);
        setStatus('ai-parsing');

        // Try AI parsing
        const result = await aiParseText(text, store.settings.openaiApiKey);
        if (result && result.items.length > 0) {
          setEntityType(result.entityType);
          setPreview(result.items);
          setStatus('preview');
        } else {
          // Fallback — try as CSV
          const lines = text.trim().split('\n').filter(l => l.includes(','));
          if (lines.length > 1) {
            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            const rows = lines.slice(1).map(line => {
              const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
              const row: Record<string, string> = {};
              headers.forEach((h, i) => { row[h] = vals[i] || ''; });
              return row;
            });
            const detected = detectEntityType(rows);
            setEntityType(detected);
            setPreview(mapToEntity(rows, detected));
            setStatus('preview');
          } else {
            setError('Could not parse file. For PDF/Word files, add your OpenAI API key in Settings for AI parsing. CSV and Excel work without a key.');
            setStatus('idle');
          }
        }
      }
    } catch (e: any) {
      setError(`Error parsing file: ${e.message}`);
      setStatus('idle');
    }
  }, [store.settings.openaiApiKey]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const doImport = () => {
    if (preview.length === 0) return;
    preview.forEach(item => {
      store.add(entityType, item);
    });
    setImportCount(preview.length);
    setStatus('imported');
  };

  const reset = () => {
    setFile(null); setPreview([]); setStatus('idle'); setError(''); setImportCount(0);
  };

  const previewHeaders = preview.length > 0
    ? Object.keys(preview[0]).filter(k => k !== 'id' && k !== 'createdAt')
    : [];

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Import Data</h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 2 }}>
          Upload CSV, Excel, Word, PDF, or JSON — auto-maps to CETAC fields
        </p>
      </div>

      {/* Drop zone */}
      {status === 'idle' && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 12, padding: '48px 32px', textAlign: 'center', cursor: 'pointer',
            background: dragging ? 'var(--accent-light)' : 'var(--bg-2)',
            transition: 'all 0.15s',
          }}
        >
          <Upload size={32} color="var(--accent)" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
            Drop a file here or click to browse
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
            CSV · Excel (.xlsx) · Word (.docx) · PDF · JSON · TXT
          </div>
          <input ref={fileRef} type="file" style={{ display: 'none' }}
            accept=".csv,.xlsx,.xls,.docx,.doc,.pdf,.json,.txt"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
      )}

      {/* Parsing indicator */}
      {(status === 'parsing' || status === 'ai-parsing') && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
            {status === 'ai-parsing' ? 'AI is parsing your document...' : 'Reading file...'}
          </div>
          {file && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{file.name}</div>}
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: '14px 18px', background: 'var(--red-light)', border: '1px solid #fecaca', borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 16 }}>
          <AlertTriangle size={16} color="var(--red)" style={{ marginTop: 1, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#dc2626' }}>Import Error</div>
            <div style={{ fontSize: 12, color: '#991b1b', marginTop: 2 }}>{error}</div>
          </div>
          <button onClick={reset} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={14} color="#dc2626" />
          </button>
        </div>
      )}

      {/* Preview */}
      {status === 'preview' && (
        <div>
          {/* File info bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText size={18} color="var(--accent)" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{file?.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{preview.length} rows detected</div>
              </div>
              {aiMode && (
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'var(--accent-light)', color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Sparkles size={10} /> AI Parsed
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)' }}>Import as:</label>
              <select value={entityType} onChange={e => {
                setEntityType(e.target.value);
                // Re-map if we have raw data
              }} style={{ padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, background: 'var(--bg)' }}>
                {Object.entries(ENTITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview table */}
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'auto', maxHeight: 400, marginBottom: 16 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 30 }}>#</th>
                  {previewHeaders.slice(0, 8).map(h => <th key={h}>{h}</th>)}
                  {previewHeaders.length > 8 && <th>+{previewHeaders.length - 8}</th>}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 20).map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 11, color: 'var(--text-3)' }}>{i + 1}</td>
                    {previewHeaders.slice(0, 8).map(h => (
                      <td key={h} style={{ fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {Array.isArray(row[h]) ? row[h].join(', ') : String(row[h] || '')}
                      </td>
                    ))}
                    {previewHeaders.length > 8 && <td style={{ fontSize: 11, color: 'var(--text-3)' }}>...</td>}
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 20 && (
              <div style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-3)', borderTop: '1px solid var(--border-subtle)' }}>
                Showing 20 of {preview.length} rows
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={doImport} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: 'none', borderRadius: 8, background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Check size={14} /> Import {preview.length} {ENTITY_LABELS[entityType]}
            </button>
            <button onClick={reset} style={{ padding: '10px 20px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)', color: 'var(--text)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Success */}
      {status === 'imported' && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Check size={24} color="var(--green)" />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
            Imported {importCount} {ENTITY_LABELS[entityType]}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
            Data has been added to your {entityType} store
          </div>
          <button onClick={reset} style={{ marginTop: 16, padding: '10px 20px', border: 'none', borderRadius: 8, background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Import Another File
          </button>
        </div>
      )}

      {/* Help text */}
      {status === 'idle' && !error && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--text-2)' }}>How it works</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { icon: Table, title: 'CSV / Excel', desc: 'Auto-detects column names and maps to CETAC fields. Best for bulk imports.' },
              { icon: FileText, title: 'Word / PDF / TXT', desc: 'AI extracts and structures data. Requires OpenAI API key in Settings.' },
              { icon: Sparkles, title: 'Smart Mapping', desc: 'Fuzzy-matches column names (e.g. "E-mail" → email, "Due Date" → dueDate).' },
              { icon: ChevronDown, title: 'Entity Detection', desc: 'Auto-detects if data is contacts, tasks, events, partnerships, or outreach.' },
            ].map(h => (
              <div key={h.title} style={{ padding: '14px', border: '1px solid var(--border)', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <h.icon size={14} color="var(--accent)" />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{h.title}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4 }}>{h.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
