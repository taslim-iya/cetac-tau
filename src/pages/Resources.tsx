import { ExternalLink, Globe, Briefcase, Mail, Camera, BookOpen, FileText, Video, Users, GraduationCap } from 'lucide-react';

const LINKS = [
  {
    category: 'Official Channels',
    items: [
      { label: 'Website', url: 'https://etacambridge.co.uk', icon: Globe, desc: 'Our main website - events, about us, and how to join' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/company/cambridge-eta-club/', icon: Briefcase, desc: 'Follow us for updates, articles, and event announcements' },
      { label: 'Instagram', url: 'https://www.instagram.com/cambridgeetaclub/', icon: Camera, desc: 'Behind the scenes, event photos, and community highlights' },
      { label: 'Email', url: 'mailto:team@etacambridge.co.uk', icon: Mail, desc: 'Get in touch with the team' },
    ],
  },
  {
    category: 'ETA Learning',
    items: [
      { label: 'Stanford Search Fund Primer', url: 'https://www.gsb.stanford.edu/experience/about/centers-institutes/ces/research/search-funds', icon: GraduationCap, desc: 'The foundational resource on search fund entrepreneurship' },
      { label: 'Search Fund Accelerator', url: 'https://www.searchfundaccelerator.com/', icon: BookOpen, desc: 'Resources and community for aspiring searchers' },
      { label: 'IESE Search Fund Study', url: 'https://www.iese.edu/entrepreneurship/search-funds/', icon: FileText, desc: 'Comprehensive data on search fund returns and trends' },
      { label: 'Acquired Podcast', url: 'https://www.acquired.fm/', icon: Video, desc: 'Deep dives into how great companies are built and bought' },
    ],
  },
  {
    category: 'Partner Organisations',
    items: [
      { label: 'Cambridge Judge Business School', url: 'https://www.jbs.cam.ac.uk/', icon: GraduationCap, desc: 'Our home institution' },
      { label: 'Spectra Search', url: 'https://www.spectrasearch.co.uk/', icon: Users, desc: 'Search fund investor and sponsor' },
      { label: 'Aven Capital', url: 'https://www.avencapital.com/', icon: Users, desc: 'Roll-up strategy specialists' },
      { label: 'Saffery', url: 'https://www.saffery.com/', icon: Users, desc: 'Diligence and transaction advisory' },
    ],
  },
];

export default function Resources() {
  return (
    <div style={{ padding: '32px 40px', maxWidth: 900 }}>
      <div style={{ borderBottom: '2px solid var(--border)', paddingBottom: 16, marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, margin: 0 }}>Resources</h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Key links, learning materials, and partner organisations</p>
      </div>

      {LINKS.map(section => (
        <div key={section.category} style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
            {section.category}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {section.items.map(item => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16,
                    border: '1px solid var(--border)', borderRadius: 8, textDecoration: 'none',
                    color: 'var(--text)', background: 'var(--bg)', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ padding: 8, borderRadius: 8, background: 'var(--bg-2)', flexShrink: 0 }}>
                    <Icon size={18} color="var(--accent)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</span>
                      <ExternalLink size={12} color="var(--text-3)" />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.4 }}>{item.desc}</div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
