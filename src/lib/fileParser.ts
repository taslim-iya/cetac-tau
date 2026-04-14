import * as XLSX from 'xlsx';
import { id } from './utils';

// Parse CSV text into rows
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] || ''; });
    return row;
  });
}

// Parse Excel/CSV file buffer
export function parseSpreadsheet(buffer: ArrayBuffer, filename: string): Record<string, string>[] {
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
  return data.map(row => {
    const clean: Record<string, string> = {};
    Object.entries(row).forEach(([k, v]) => { clean[k.toLowerCase().trim()] = String(v); });
    return clean;
  });
}

// Extract text from any file
export async function extractText(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'csv' || ext === 'txt') {
    return await file.text();
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    let text = '';
    wb.SheetNames.forEach(name => {
      const ws = wb.Sheets[name];
      text += XLSX.utils.sheet_to_csv(ws) + '\n';
    });
    return text;
  }

  // For PDF, DOCX — read as text (basic extraction)
  // Real PDF/DOCX parsing needs server-side, but we extract what we can
  if (ext === 'pdf') {
    // PDF binary can't be parsed client-side easily without pdf.js
    // We'll send to AI for parsing
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    // Try to extract visible ASCII text from PDF
    let text = '';
    let inText = false;
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      if (b >= 32 && b <= 126) {
        text += String.fromCharCode(b);
      } else if (b === 10 || b === 13) {
        text += '\n';
      }
    }
    // Clean up PDF artifacts
    return text.replace(/[^\x20-\x7E\n]/g, '').replace(/\n{3,}/g, '\n\n').slice(0, 50000);
  }

  // DOCX — it's a zip with XML inside
  if (ext === 'docx' || ext === 'doc') {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      return XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);
    } catch {
      // Fallback: read as text
      return await file.text();
    }
  }

  // JSON
  if (ext === 'json') {
    return await file.text();
  }

  return await file.text();
}

// Column name mapping — fuzzy match to our fields
const FIELD_ALIASES: Record<string, string[]> = {
  name: ['name', 'full name', 'contact name', 'person', 'member', 'company', 'organisation', 'organization', 'org'],
  email: ['email', 'e-mail', 'email address', 'mail'],
  phone: ['phone', 'telephone', 'mobile', 'cell', 'tel'],
  role: ['role', 'title', 'position', 'job title', 'designation'],
  organisation: ['organisation', 'organization', 'org', 'company', 'firm', 'employer'],
  linkedin: ['linkedin', 'linkedin url', 'li', 'linkedin profile'],
  type: ['type', 'category', 'contact type', 'classification'],
  status: ['status', 'state', 'stage'],
  notes: ['notes', 'note', 'comments', 'comment', 'description', 'details'],
  title: ['title', 'task', 'subject', 'item', 'action'],
  priority: ['priority', 'urgency', 'importance'],
  assignees: ['assignee', 'assignees', 'assigned to', 'owner', 'responsible'],
  dueDate: ['due date', 'due', 'deadline', 'date due'],
  date: ['date', 'event date', 'start date'],
  venue: ['venue', 'location', 'place', 'address'],
  week: ['week', 'week number', 'wk'],
  contactPerson: ['contact person', 'contact', 'poc', 'point of contact'],
  contactEmail: ['contact email', 'poc email'],
  nextAction: ['next action', 'next step', 'action', 'follow up', 'follow-up'],
  subject: ['subject', 'topic', 're'],
  message: ['message', 'body', 'content', 'text'],
  sentDate: ['sent date', 'sent', 'date sent'],
  followUpDate: ['follow up date', 'follow-up date', 'follow up'],
  category: ['category', 'cat', 'group', 'vertical'],
  author: ['author', 'writer', 'by'],
  platform: ['platform', 'channel'],
};

function matchField(colName: string): string | null {
  const lower = colName.toLowerCase().trim();
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.includes(lower) || lower === field) return field;
  }
  return null;
}

// Auto-detect which CETAC entity type the data maps to
export function detectEntityType(rows: Record<string, string>[]): string {
  if (rows.length === 0) return 'contacts';
  const keys = Object.keys(rows[0]).map(k => k.toLowerCase());
  
  // Check for task indicators
  if (keys.some(k => ['task', 'priority', 'assignee', 'assignees', 'due date', 'week'].includes(k))) return 'tasks';
  // Check for event indicators
  if (keys.some(k => ['venue', 'event', 'speakers', 'sponsors', 'format', 'attendees'].includes(k))) return 'events';
  // Check for partnership indicators
  if (keys.some(k => ['next action', 'next step', 'partnership', 'contact person', 'last contact'].includes(k))) return 'partnerships';
  // Check for outreach indicators
  if (keys.some(k => ['sent date', 'follow up', 'follow-up', 'message', 'subject'].includes(k))) return 'outreach';
  // Check for content indicators
  if (keys.some(k => ['author', 'publish date', 'platform', 'content type'].includes(k))) return 'content';
  // Check for team indicators
  if (keys.some(k => ['responsibilities', 'vertical', 'member'].includes(k))) return 'team';
  
  return 'contacts'; // default
}

// Map rows to CETAC entity format
export function mapToEntity(rows: Record<string, string>[], entityType: string): any[] {
  return rows.map(row => {
    const mapped: Record<string, any> = { id: id(), createdAt: new Date().toISOString() };
    
    Object.entries(row).forEach(([col, val]) => {
      const field = matchField(col);
      if (field) {
        if (field === 'assignees') {
          mapped[field] = val.split(/[,;]/).map(s => s.trim()).filter(Boolean);
        } else if (field === 'week') {
          mapped[field] = parseInt(val) || 1;
        } else {
          mapped[field] = val;
        }
      }
    });

    // Set defaults based on entity type
    switch (entityType) {
      case 'tasks':
        return { title: '', description: '', status: 'todo', priority: 'medium', assignees: [], dueDate: '', week: 1, category: '', completedAt: '', ...mapped };
      case 'events':
        return { name: mapped.name || mapped.title || '', description: '', date: '', time: '', venue: '', week: 1, status: 'planned', speakers: [], sponsors: [], attendeeCount: 0, format: '', postEventNotes: '', ...mapped };
      case 'partnerships':
        return { name: '', type: 'other', contactPerson: '', contactEmail: '', status: 'prospect', notes: '', lastContactDate: '', nextAction: '', ...mapped };
      case 'outreach':
        return { contactName: mapped.name || '', contactEmail: mapped.email || '', subject: '', message: '', status: 'draft', sentDate: '', followUpDate: '', category: '', notes: '', ...mapped };
      case 'content':
        return { title: '', type: 'linkedin_post', status: 'idea', author: '', subject: '', publishDate: '', platform: '', notes: '', ...mapped };
      case 'team':
        return { name: '', role: '', responsibilities: '', email: '', phone: '', linkedin: '', status: 'new', vertical: '', ...mapped };
      default: // contacts
        return { name: '', email: '', phone: '', linkedin: '', type: 'prospect', organisation: '', role: '', notes: '', tags: [], ...mapped };
    }
  });
}

// AI-powered text parsing (uses /api/ai endpoint)
export async function aiParseText(text: string, apiKey: string): Promise<{ entityType: string; items: any[] } | null> {
  try {
    const prompt = `Parse the following text and extract structured data. Determine if it contains: contacts/people, tasks/todos, events, partnerships, outreach emails, or team members.

Return ONLY valid JSON in this format:
{
  "entityType": "contacts|tasks|events|partnerships|outreach|team|content",
  "items": [
    { ...fields appropriate for the entity type }
  ]
}

Field schemas:
- contacts: { name, email, phone, linkedin, type (investor|advisor|alumni|partner|sponsor|speaker|prospect), organisation, role, notes }
- tasks: { title, description, status (todo|in_progress|done), priority (urgent|high|medium|low), assignees (array), dueDate, week (1-9), category }
- events: { name, description, date, time, venue, week (1-9), status (planned|confirmed), speakers (array), sponsors (array), format }
- partnerships: { name, type (business_school|cambridge_internal|investor|sponsor|advisor|other), contactPerson, contactEmail, status (prospect|contacted|in_discussion|agreed|active), notes, nextAction }
- outreach: { contactName, contactEmail, subject, message, status (draft|sent|replied|meeting_booked|no_response), sentDate, followUpDate, category, notes }
- team: { name, role, responsibilities, email, phone, linkedin, status (active|potential|new), vertical }

Text to parse:
${text.slice(0, 8000)}`;

    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, apiKey }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || data.content || '';
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.entityType && Array.isArray(parsed.items)) {
      return {
        entityType: parsed.entityType,
        items: parsed.items.map((item: any) => ({ ...item, id: id(), createdAt: new Date().toISOString() })),
      };
    }
    return null;
  } catch {
    return null;
  }
}
