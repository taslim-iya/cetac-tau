import { useState } from 'react';
import { ExternalLink, Globe, Briefcase, Mail, Camera, BookOpen, FileText, Video, Users, GraduationCap, Plus, Trash2, X, Edit2, Link2 } from 'lucide-react';
import { useStore } from '../store';

interface ResourceLink {
  id: string;
  label: string;
  url: string;
  desc: string;
  category: string;
}

const ICON_MAP: Record<string, typeof Globe> = {
  Globe, Briefcase, Mail, Camera, BookOpen, FileText, Video, Users, GraduationCap, Link2,
};

const DEFAULT_RESOURCES: ResourceLink[] = [
  { id: 'r1', label: 'Website', url: 'https://etacambridge.co.uk', desc: 'Our main website - events, about us, and how to join', category: 'Official Channels' },
  { id: 'r2', label: 'LinkedIn', url: 'https://www.linkedin.com/company/cambridge-eta-club/', desc: 'Follow us for updates, articles, and event announcements', category: 'Official Channels' },
  { id: 'r3', label: 'Instagram', url: 'https://www.instagram.com/cambridgeetaclub/', desc: 'Behind the scenes, event photos, and community highlights', category: 'Official Channels' },
  { id: 'r4', label: 'Email', url: 'mailto:team@etacambridge.co.uk', desc: 'Get in touch with the team', category: 'Official Channels' },
  { id: 'r5', label: 'Stanford Search Fund Primer', url: 'https://www.gsb.stanford.edu/experience/about/centers-institutes/ces/research/search-funds', desc: 'The foundational resource on search fund entrepreneurship', category: 'ETA Learning' },
  { id: 'r6', label: 'Search Fund Accelerator', url: 'https://www.searchfundaccelerator.com/', desc: 'Resources and community for aspiring searchers', category: 'ETA Learning' },
  { id: 'r7', label: 'IESE Search Fund Study', url: 'https://www.iese.edu/entrepreneurship/search-funds/', desc: 'Comprehensive data on search fund returns and trends', category: 'ETA Learning' },
  { id: 'r8', label: 'Acquired Podcast', url: 'https://www.acquired.fm/', desc: 'Deep dives into how great companies are built and bought', category: 'ETA Learning' },
  { id: 'r9', label: 'Cambridge Judge Business School', url: 'https://www.jbs.cam.ac.uk/', desc: 'Our home institution', category: 'Partner Organisations' },
  { id: 'r10', label: 'Spectra Search', url: 'https://www.spectrasearch.co.uk/', desc: 'Search fund investor and sponsor', category: 'Partner Organisations' },
  { id: 'r11', label: 'Aven Capital', url: 'https://www.avencapital.com/', desc: 'Roll-up strategy specialists', category: 'Partner Organisations' },
  { id: 'r12', label: 'Saffery', url: 'https://www.saffery.com/', desc: 'Diligence and transaction advisory', category: 'Partner Organisations' },
];

const CATEGORIES = ['Official Channels', 'ETA Learning', 'Partner Organisations'];

export default function Resources() {
  const currentUser = useStore(s => s.currentUser);
  const isAdmin = currentUser?.role === 'super_admin';

  // Use store for persistence if available, else defaults
  const storeResources = useStore(s => (s as any).resources) as ResourceLink[] | undefined;
  const setStoreState = useStore(s => s.updateSettings); // We'll piggyback on a custom field

  const [resources, setResourcesLocal] = useState<ResourceLink[]>(storeResources && storeResources.length > 0 ? storeResources : DEFAULT_RESOURCES);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ label: '', url: '', desc: '', category: CATEGORIES[0] });

  const setResources = (r: ResourceLink[]) => {
    setResourcesLocal(r);
    // Persist to store
    useStore.setState({ resources: r } as any);
  };

  const grouped = CATEGORIES.map(cat => ({
    category: cat,
    items: resources.filter(r => r.category === cat),
  })).filter(g => g.items.length > 0);

  // Also show any custom categories
  const customCats = [...new Set(resources.map(r => r.category))].filter(c => !CATEGORIES.includes(c));
  customCats.forEach(cat => {
    grouped.push({ category: cat, items: resources.filter(r => r.category === cat) });
  });

  const allCategories = [...CATEGORIES, ...customCats];

  const addResource = () => {
    if (!form.label || !form.url) return;
    const newR: ResourceLink = {
      id: 'r' + Date.now(),
      label: form.label,
      url: form.url.startsWith('http') || form.url.startsWith('mailto:') ? form.url : 'https://' + form.url,
      desc: form.desc,
      category: form.category,
    };
    setResources([...resources, newR]);
    setForm({ label: '', url: '', desc: '', category: CATEGORIES[0] });
    setAdding(false);
  };

  const removeResource = (id: string) => {
    setResources(resources.filter(r => r.id !== id));
  };

  const updateResource = (id: string, updates: Partial<ResourceLink>) => {
    setResources(resources.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 900 }}>
      <div style={{ borderBottom: '2px solid var(--border)', paddingBottom: 16, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, margin: 0 }}>Resources</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Key links, learning materials, and partner organisations</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setAdding(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={14} /> Add Resource
          </button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <div style={{ padding: 16, border: '1px solid var(--accent)', borderRadius: 8, marginBottom: 20, background: 'var(--bg-2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Add New Resource</h3>
            <button onClick={() => setAdding(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="Name (e.g. Twitter)" style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, background: 'var(--bg)' }} />
            <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="URL (e.g. https://twitter.com/...)" style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, background: 'var(--bg)' }} />
          </div>
          <input value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="Description (optional)" style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, marginBottom: 8, background: 'var(--bg)' }} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, background: 'var(--bg)' }}>
              {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="__new">+ New Category</option>
            </select>
            {form.category === '__new' && (
              <input
                autoFocus
                placeholder="Category name"
                onBlur={e => { if (e.target.value) setForm({ ...form, category: e.target.value }); }}
                onKeyDown={e => { if (e.key === 'Enter' && (e.target as HTMLInputElement).value) setForm({ ...form, category: (e.target as HTMLInputElement).value }); }}
                style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, background: 'var(--bg)' }}
              />
            )}
            <button onClick={addResource} disabled={!form.label || !form.url} style={{ padding: '8px 16px', borderRadius: 6, background: !form.label || !form.url ? 'var(--bg-2)' : 'var(--accent)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Add
            </button>
          </div>
        </div>
      )}

      {grouped.map(section => (
        <div key={section.category} style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
            {section.category}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {section.items.map(item => {
              const isEditing = editing === item.id;
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16,
                    border: '1px solid var(--border)', borderRadius: 8,
                    background: 'var(--bg)', transition: 'all 0.15s', position: 'relative',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ padding: 8, borderRadius: 8, background: 'var(--bg-2)', flexShrink: 0 }}>
                    <Link2 size={18} color="var(--accent)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <input value={item.label} onChange={e => updateResource(item.id, { label: e.target.value })} style={{ fontSize: 13, fontWeight: 600, border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', background: 'var(--bg)' }} />
                        <input value={item.url} onChange={e => updateResource(item.id, { url: e.target.value })} style={{ fontSize: 11, border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', background: 'var(--bg)' }} />
                        <input value={item.desc} onChange={e => updateResource(item.id, { desc: e.target.value })} style={{ fontSize: 11, border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', background: 'var(--bg)' }} />
                        <button onClick={() => setEditing(null)} style={{ alignSelf: 'flex-start', fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Done</button>
                      </div>
                    ) : (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'var(--text)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</span>
                          <ExternalLink size={12} color="var(--text-3)" />
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.4 }}>{item.desc}</div>
                      </a>
                    )}
                  </div>
                  {isAdmin && !isEditing && (
                    <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
                      <button onClick={e => { e.stopPropagation(); setEditing(item.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, opacity: 0.4 }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '0.4')}
                      ><Edit2 size={12} /></button>
                      <button onClick={e => { e.stopPropagation(); removeResource(item.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, opacity: 0.4, color: '#dc2626' }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '0.4')}
                      ><Trash2 size={12} /></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
