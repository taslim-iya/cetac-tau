import { useState } from 'react';
import { Copy, Check, Edit3, Plus, Trash2, Mail } from 'lucide-react';
import { id } from '../lib/utils';

interface Template { id: string; name: string; category: string; subject: string; body: string; }

const INITIAL: Template[] = [
  {
    id: id(), name: 'Business School Introduction', category: 'Partnership',
    subject: 'Partnership: Cambridge ETA Club × {{school_name}}',
    body: `Dear {{name}},

I hope this finds you well. I'm writing from the Cambridge ETA & Acquisition Club (CETAC) at Cambridge Judge Business School.

We're building the UK's leading student community for Entrepreneurship Through Acquisition, and we'd love to explore a partnership with {{school_name}}'s ETA club.

We're proposing:
• Joint events and speaker sessions
• Shared investor and advisor networks
• Cross-promotion to both memberships
• Co-branded content and case studies

Would you be open to a short call this week to discuss? Happy to work around your schedule.

Best regards,
{{sender_name}}
Cambridge ETA & Acquisition Club`,
  },
  {
    id: id(), name: 'Investor / Speaker Invitation', category: 'Outreach',
    subject: 'Speaking invitation — Cambridge ETA Club',
    body: `Dear {{name}},

I'm reaching out from CETAC (Cambridge ETA & Acquisition Club) at Cambridge Judge Business School.

We'd be honoured to have you speak at one of our upcoming events. Our members are MBA and MFin students actively exploring search fund and acquisition entrepreneurship.

Event details:
• Date: {{event_date}}
• Format: {{event_format}} (45 min talk + 15 min Q&A)
• Audience: 30-50 Cambridge students
• Venue: Cambridge Judge Business School

We'd love to hear your perspective on {{topic}}. Would you be available?

Kind regards,
{{sender_name}}
President, CETAC`,
  },
  {
    id: id(), name: 'Sponsor Proposal', category: 'Sponsorship',
    subject: 'Sponsorship opportunity — CETAC Search Day 2026',
    body: `Dear {{name}},

I'm writing to invite {{company}} to sponsor CETAC's flagship Search Day event at Cambridge Judge Business School.

Search Day is a half-day conference bringing together 60+ aspiring searchers, established investors, and acquisition advisors.

Sponsorship includes:
• Logo placement on all materials
• Speaking slot or panel seat
• Direct access to Cambridge talent pipeline
• Co-branded case study publication

Sponsorship tiers start from £1,000. I'd be happy to walk you through the full proposal on a call.

Best regards,
{{sender_name}}
President, CETAC`,
  },
  {
    id: id(), name: 'Alumni Reconnection', category: 'Alumni',
    subject: 'Reconnecting — Cambridge ETA Club',
    body: `Dear {{name}},

I'm {{sender_name}}, President of the Cambridge ETA & Acquisition Club. I understand you completed your search fund journey after Cambridge, and I'd love to reconnect.

We're building a stronger alumni network and would value your insights:
• Would you be open to a brief case study interview?
• Could we feature your journey in our newsletter?
• Would you consider mentoring current members?

Even a 20-minute chat would be incredibly valuable for our community.

Best regards,
{{sender_name}}`,
  },
  {
    id: id(), name: 'Event Invitation', category: 'Events',
    subject: 'You\'re invited: {{event_name}} — CETAC',
    body: `Hi {{name}},

You're invited to CETAC's upcoming event:

📅 {{event_name}}
🕐 {{event_date}} at {{event_time}}
📍 {{venue}}

{{event_description}}

This is a great opportunity to {{value_prop}}.

RSVP by replying to this email. Spaces are limited.

See you there,
{{sender_name}}
Cambridge ETA & Acquisition Club`,
  },
  {
    id: id(), name: 'Follow-up After Meeting', category: 'Follow-up',
    subject: 'Great meeting you — next steps',
    body: `Dear {{name}},

Thank you for taking the time to meet with us. It was great to hear about {{topic}}.

As discussed, the next steps are:
{{next_steps}}

We'll follow up by {{follow_up_date}}. In the meantime, please don't hesitate to reach out with any questions.

Best regards,
{{sender_name}}
Cambridge ETA & Acquisition Club`,
  },
];

export default function Templates() {
  const [templates, setTemplates] = useState(INITIAL);
  const [editing, setEditing] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (t: Template) => {
    navigator.clipboard.writeText(`Subject: ${t.subject}\n\n${t.body}`);
    setCopied(t.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const update = (tId: string, updates: Partial<Template>) => {
    setTemplates(ts => ts.map(t => t.id === tId ? { ...t, ...updates } : t));
  };

  const addTemplate = () => {
    const newId = id();
    setTemplates(ts => [{ id: newId, name: 'New Template', category: 'Other', subject: '', body: '' }, ...ts]);
    setEditing(newId);
  };

  const categories = [...new Set(templates.map(t => t.category))];

  return (
    <div style={{ padding: '32px 40px', maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Email Templates</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 2 }}>Pre-written templates with variable placeholders</p>
        </div>
        <button onClick={addTemplate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: 'none', borderRadius: 6, background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={14} /> New Template
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {templates.map(t => (
          <div key={t.id} style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'var(--bg)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: editing === t.id ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={14} color="var(--accent)" />
                {editing === t.id ? (
                  <input value={t.name} onChange={e => update(t.id, { name: e.target.value })} className="edit-cell" style={{ fontWeight: 600, fontSize: 13 }} />
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</span>
                )}
                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: 'var(--bg-3)', color: 'var(--text-3)', fontWeight: 500 }}>{t.category}</span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => copy(t)} style={iconBtn} title="Copy">
                  {copied === t.id ? <Check size={13} color="var(--green)" /> : <Copy size={13} />}
                </button>
                <button onClick={() => setEditing(editing === t.id ? null : t.id)} style={iconBtn} title="Edit">
                  <Edit3 size={13} color={editing === t.id ? 'var(--accent)' : undefined} />
                </button>
                <button onClick={() => setTemplates(ts => ts.filter(x => x.id !== t.id))} style={iconBtn} title="Delete">
                  <Trash2 size={13} color="var(--red)" />
                </button>
              </div>
            </div>

            {/* Expanded edit/preview */}
            {editing === t.id ? (
              <div style={{ padding: '12px 16px' }}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>Subject</label>
                  <input value={t.subject} onChange={e => update(t.id, { subject: e.target.value })} className="edit-cell" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>Body</label>
                  <textarea value={t.body} onChange={e => update(t.id, { body: e.target.value })} className="edit-cell"
                    style={{ width: '100%', minHeight: 200, resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit' }} />
                </div>
              </div>
            ) : (
              <div style={{ padding: '8px 16px 12px' }}>
                <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Subject: <strong>{t.subject}</strong></div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, whiteSpace: 'pre-wrap', maxHeight: 60, overflow: 'hidden' }}>{t.body.slice(0, 150)}...</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const iconBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', padding: 4, opacity: 0.5 };
