import { useState } from 'react';
import { Copy, Check, Edit3, Plus, Trash2, Mail } from 'lucide-react';
import { id } from '../lib/utils';

interface Template { id: string; name: string; category: string; subject: string; body: string; }

const INITIAL: Template[] = [
  { id: id(), name: 'Business School Introduction', category: 'Introduction', subject: 'Partnership: Cambridge ETA Club x {{school_name}}', body: `Dear {{name}},\n\nI hope this finds you well. I am writing from the Cambridge ETA & Acquisition Club (CETAC) at Cambridge Judge Business School.\n\nWe are building the UK's leading student community for Entrepreneurship Through Acquisition, and we would love to explore a partnership with {{school_name}}'s ETA club.\n\nWe are proposing:\n- Joint events and speaker sessions\n- Shared investor and advisor networks\n- Cross-promotion to both memberships\n- Co-branded content and case studies\n\nWould you be open to a short call this week to discuss?\n\nBest regards,\n{{sender_name}}\nCambridge ETA & Acquisition Club` },
  { id: id(), name: 'Investor / Speaker Invitation', category: 'Introduction', subject: 'Speaking invitation - Cambridge ETA Club', body: `Dear {{name}},\n\nI am reaching out from CETAC (Cambridge ETA & Acquisition Club) at Cambridge Judge Business School.\n\nWe would be honoured to have you speak at one of our upcoming events. Our members are MBA and MFin students actively exploring search fund and acquisition entrepreneurship.\n\nEvent details:\n- Date: {{event_date}}\n- Format: {{event_format}} (45 min talk + 15 min Q&A)\n- Audience: 30-50 Cambridge students\n- Venue: Cambridge Judge Business School\n\nWe would love to hear your perspective on {{topic}}. Would you be available?\n\nKind regards,\n{{sender_name}}\nPresident, CETAC` },
  { id: id(), name: 'Follow-up After Meeting', category: 'Follow-up', subject: 'Great meeting you - next steps', body: `Dear {{name}},\n\nThank you for taking the time to meet with us. It was great to hear about {{topic}}.\n\nAs discussed, the next steps are:\n{{next_steps}}\n\nWe will follow up by {{follow_up_date}}. In the meantime, please do not hesitate to reach out with any questions.\n\nBest regards,\n{{sender_name}}\nCambridge ETA & Acquisition Club` },
  { id: id(), name: 'Post-Event Follow-up', category: 'Follow-up', subject: 'Thank you for attending {{event_name}}', body: `Dear {{name}},\n\nThank you for joining us at {{event_name}} last {{event_day}}. We hope you found the session valuable.\n\nKey takeaways:\n{{key_points}}\n\nWe would love to keep you in the loop on future events. Our next session is on {{next_event_date}}.\n\nBest regards,\n{{sender_name}}\nCETAC` },
  { id: id(), name: 'Thank You Note', category: 'Thank You', subject: 'Thank you from CETAC', body: `Dear {{name}},\n\nOn behalf of the Cambridge ETA & Acquisition Club, I wanted to express our sincere gratitude for {{reason}}.\n\nYour support has been instrumental in {{impact}}. We truly value our relationship with {{organisation}} and look forward to continuing our collaboration.\n\nWith warm regards,\n{{sender_name}}\nPresident, CETAC` },
  { id: id(), name: 'Speaker Thank You', category: 'Thank You', subject: 'Thank you for your talk at CETAC', body: `Dear {{name}},\n\nThank you so much for speaking at our {{event_name}} event. Your insights on {{topic}} were incredibly valuable to our members.\n\nThe feedback has been overwhelmingly positive. We have had several members reach out wanting to learn more about {{company}}'s approach.\n\nWe would love to have you back for future events. Please let us know if you would be interested.\n\nWith gratitude,\n{{sender_name}}\nCETAC` },
  { id: id(), name: 'Partnership Inquiry', category: 'Partnership', subject: 'Partnership opportunity - CETAC x {{organisation}}', body: `Dear {{name}},\n\nI am writing to explore a potential partnership between CETAC (Cambridge ETA & Acquisition Club) and {{organisation}}.\n\nAbout CETAC:\n- Cambridge Judge Business School's ETA-focused student society\n- 50+ active members (MBA, MFin, PhD students)\n- Weekly events with investors, advisors, and searchers\n- Growing alumni network across the ETA ecosystem\n\nWe believe a partnership could be mutually beneficial through:\n- {{benefit_1}}\n- {{benefit_2}}\n- {{benefit_3}}\n\nWould you be open to a conversation about how we might work together?\n\nBest regards,\n{{sender_name}}\nPresident, CETAC` },
  { id: id(), name: 'Sponsor Pitch', category: 'Sponsor Pitch', subject: 'Sponsorship opportunity - CETAC Search Day 2026', body: `Dear {{name}},\n\nI am writing to invite {{company}} to sponsor CETAC's flagship Search Day event at Cambridge Judge Business School.\n\nSearch Day is a half-day conference bringing together 60+ aspiring searchers, established investors, and acquisition advisors.\n\nSponsorship includes:\n- Logo placement on all materials\n- Speaking slot or panel seat\n- Direct access to Cambridge talent pipeline\n- Co-branded case study publication\n\nSponsorship tiers:\n- Gold: GBP 5,000 (keynote + branding + dinner seat)\n- Silver: GBP 2,500 (panel + branding)\n- Bronze: GBP 1,000 (branding + networking)\n\nI would be happy to walk you through the full proposal on a call.\n\nBest regards,\n{{sender_name}}\nPresident, CETAC` },
  { id: id(), name: 'Event Invitation', category: 'Event Invite', subject: 'You are invited: {{event_name}} - CETAC', body: `Dear {{name}},\n\nYou are invited to CETAC's upcoming event:\n\n{{event_name}}\nDate: {{event_date}} at {{event_time}}\nVenue: {{venue}}\n\n{{event_description}}\n\nThis is a great opportunity to {{value_prop}}.\n\nRSVP by replying to this email. Spaces are limited.\n\nSee you there,\n{{sender_name}}\nCambridge ETA & Acquisition Club` },
  { id: id(), name: 'Alumni Reconnection', category: 'Introduction', subject: 'Reconnecting - Cambridge ETA Club', body: `Dear {{name}},\n\nI am {{sender_name}}, President of the Cambridge ETA & Acquisition Club. I understand you completed your search fund journey after Cambridge, and I would love to reconnect.\n\nWe are building a stronger alumni network and would value your insights:\n- Would you be open to a brief case study interview?\n- Could we feature your journey in our newsletter?\n- Would you consider mentoring current members?\n\nEven a 20-minute chat would be incredibly valuable for our community.\n\nBest regards,\n{{sender_name}}` },
];

const CATEGORIES = ['All', 'Introduction', 'Follow-up', 'Thank You', 'Partnership', 'Sponsor Pitch', 'Event Invite'];

export default function Templates() {
  const [templates, setTemplates] = useState(INITIAL);
  const [editing, setEditing] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All' ? templates : templates.filter(t => t.category === activeCategory);

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
    setTemplates(ts => [{ id: newId, name: 'New Template', category: activeCategory === 'All' ? 'Other' : activeCategory, subject: '', body: '' }, ...ts]);
    setEditing(newId);
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 900 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Message Templates</h1>
          <p>Pre-written templates with variable placeholders</p>
        </div>
        <button onClick={addTemplate} className="btn-primary">
          <Plus size={14} /> New Template
        </button>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            style={{ padding: '5px 12px', border: '1px solid var(--border)', borderRadius: 3, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: activeCategory === cat ? 'var(--accent)' : 'var(--bg)', color: activeCategory === cat ? 'white' : 'var(--text-2)', fontFamily: 'var(--sans)' }}>
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(t => (
          <div key={t.id} className="card" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: editing === t.id ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={14} color="var(--accent)" />
                {editing === t.id ? (
                  <input value={t.name} onChange={e => update(t.id, { name: e.target.value })} className="edit-cell" style={{ fontWeight: 600, fontSize: 13 }} />
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</span>
                )}
                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: 'var(--accent-light)', color: 'var(--accent)', fontWeight: 600 }}>{t.category}</span>
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

            {editing === t.id ? (
              <div style={{ padding: '12px 16px' }}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Category</label>
                  <select value={t.category} onChange={e => update(t.id, { category: e.target.value })}
                    style={{ display: 'block', marginTop: 4, padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12, background: 'var(--bg)', color: 'var(--text)' }}>
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Subject</label>
                  <input value={t.subject} onChange={e => update(t.id, { subject: e.target.value })} className="edit-cell" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Body</label>
                  <textarea value={t.body} onChange={e => update(t.id, { body: e.target.value })} className="edit-cell"
                    style={{ width: '100%', minHeight: 200, resize: 'vertical', lineHeight: 1.6, fontFamily: 'var(--sans)' }} />
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
