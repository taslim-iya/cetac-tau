import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CheckSquare, Calendar, Handshake, BookOpen, Send, MessageSquare, Settings, Target, Upload, Download, Award, Trophy, UserPlus, Mail, Moon, Sun, Shield } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store';
import Notifications from './Notifications';

type Item = { path: string; icon: any; label: string };

const overview: Item[] = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/plan', icon: Target, label: '9-Week Plan' },
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
];

const workspace: Item[] = [
  { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { path: '/events', icon: Calendar, label: 'Events' },
  { path: '/team', icon: Users, label: 'Team' },
  { path: '/roles', icon: UserPlus, label: 'Roles' },
];

const growth: Item[] = [
  { path: '/partnerships', icon: Handshake, label: 'Partnerships' },
  { path: '/sponsors', icon: Award, label: 'Sponsors' },
  { path: '/crm', icon: Users, label: 'CRM' },
  { path: '/outreach', icon: Send, label: 'Outreach' },
];

const content: Item[] = [
  { path: '/content', icon: BookOpen, label: 'Content' },
  { path: '/templates', icon: Mail, label: 'Templates' },
  { path: '/search-day', icon: Trophy, label: 'Search Day' },
  { path: '/chat', icon: MessageSquare, label: 'AI Chat' },
];

const data: Item[] = [
  { path: '/import', icon: Upload, label: 'Import' },
  { path: '/export', icon: Download, label: 'Export' },
  { path: '/team-portal', icon: Shield, label: 'Team Portal' },
];

const mobileNav: Item[] = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/crm', icon: Users, label: 'CRM' },
  { path: '/chat', icon: MessageSquare, label: 'Chat' },
];

function NavGroup({ label, items, pathname }: { label?: string; items: Item[]; pathname: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {label && <div className="nav-section-label">{label}</div>}
      {items.map(({ path, icon: Icon, label }) => {
        const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
        return (
          <NavLink key={path} to={path} className={cn('nav-item', active && 'nav-item-active')}>
            <Icon size={14} strokeWidth={1.75} /> {label}
          </NavLink>
        );
      })}
    </div>
  );
}

export default function Sidebar() {
  const loc = useLocation();
  const { darkMode, toggleDarkMode } = useStore();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="desktop-sidebar glass"
        style={{
          width: 220,
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'sticky',
          top: 0,
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {/* Brand header */}
        <div style={{ padding: '16px 14px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="brand-mark">C</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.15, letterSpacing: '-0.01em' }}>CETAC</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500 }}>Cambridge ETA Club</div>
            </div>
          </div>
          <Notifications />
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 10px 12px', display: 'flex', flexDirection: 'column', gap: 4, overflow: 'auto' }}>
          <NavGroup items={overview} pathname={loc.pathname} />
          <NavGroup label="Workspace" items={workspace} pathname={loc.pathname} />
          <NavGroup label="Growth" items={growth} pathname={loc.pathname} />
          <NavGroup label="Content" items={content} pathname={loc.pathname} />
          <NavGroup label="Data" items={data} pathname={loc.pathname} />
        </nav>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '8px 10px' }}>
          <button onClick={toggleDarkMode} className="nav-item" style={{ marginBottom: 2 }}>
            {darkMode ? <Sun size={14} strokeWidth={1.75} /> : <Moon size={14} strokeWidth={1.75} />}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          <NavLink to="/settings" className={cn('nav-item', loc.pathname === '/settings' && 'nav-item-active')}>
            <Settings size={14} strokeWidth={1.75} /> Settings
          </NavLink>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav
        className="mobile-nav glass"
        style={{
          display: 'none',
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          borderTop: '1px solid var(--border)',
          zIndex: 100,
          justifyContent: 'space-around',
          padding: '8px 0 env(safe-area-inset-bottom, 8px)',
        }}
      >
        {mobileNav.map(({ path, icon: Icon, label }) => {
          const active = path === '/' ? loc.pathname === '/' : loc.pathname.startsWith(path);
          return (
            <NavLink key={path} to={path} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textDecoration: 'none', padding: '4px 8px', minWidth: 44 }}>
              <Icon size={18} color={active ? 'var(--accent)' : 'var(--text-3)'} strokeWidth={active ? 2 : 1.75} />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? 'var(--accent)' : 'var(--text-3)' }}>{label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
