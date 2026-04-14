import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CheckSquare, Calendar, Handshake, BookOpen, Send, MessageSquare, Settings, Target, Upload, Download, Award, Trophy, UserPlus, Mail, Moon, Sun, Shield } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store';
import Notifications from './Notifications';

const nav = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/plan', icon: Target, label: '9-Week Plan' },
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/team', icon: Users, label: 'Team' },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { path: '/events', icon: Calendar, label: 'Events' },
  { path: '/partnerships', icon: Handshake, label: 'Partnerships' },
  { path: '/sponsors', icon: Award, label: 'Sponsor Pipeline' },
  { path: '/crm', icon: Users, label: 'CRM' },
  { path: '/roles', icon: UserPlus, label: 'Roles' },
  { path: '/content', icon: BookOpen, label: 'Content' },
  { path: '/outreach', icon: Send, label: 'Outreach' },
  { path: '/templates', icon: Mail, label: 'Templates' },
  { path: '/search-day', icon: Trophy, label: 'Search Day' },
  { path: '/chat', icon: MessageSquare, label: 'AI Chat' },
  { path: '/import', icon: Upload, label: 'Import' },
  { path: '/export', icon: Download, label: 'Export' },
  { path: '/team-portal', icon: Shield, label: 'Team Portal' },
];

const mobileNav = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/crm', icon: Users, label: 'CRM' },
  { path: '/chat', icon: MessageSquare, label: 'Chat' },
];

export default function Sidebar() {
  const loc = useLocation();
  const { darkMode, toggleDarkMode } = useStore();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="desktop-sidebar" style={{ width: 200, borderRight: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, flexShrink: 0, overflow: 'auto' }}>
        <div style={{ padding: '14px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 800 }}>C</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>CETAC</div>
              <div style={{ fontSize: 9, color: 'var(--text-3)' }}>Cambridge ETA Club</div>
            </div>
          </div>
          <Notifications />
        </div>

        <nav style={{ flex: 1, padding: '4px 6px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {nav.map(({ path, icon: Icon, label }) => {
            const active = path === '/' ? loc.pathname === '/' : loc.pathname.startsWith(path);
            return (
              <NavLink key={path} to={path} className={cn('nav-item', active && 'nav-item-active')}>
                <Icon size={14} strokeWidth={1.5} /> {label}
              </NavLink>
            );
          })}
        </nav>

        <div style={{ borderTop: '1px solid var(--border)', padding: '6px' }}>
          <button onClick={toggleDarkMode} className="nav-item" style={{ marginBottom: 2 }}>
            {darkMode ? <Sun size={14} /> : <Moon size={14} />} {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          <NavLink to="/settings" className={cn('nav-item', loc.pathname === '/settings' && 'nav-item-active')}>
            <Settings size={14} strokeWidth={1.5} /> Settings
          </NavLink>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav" style={{ display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg)', borderTop: '1px solid var(--border)', zIndex: 100, justifyContent: 'space-around', padding: '6px 0 env(safe-area-inset-bottom, 6px)' }}>
        {mobileNav.map(({ path, icon: Icon, label }) => {
          const active = path === '/' ? loc.pathname === '/' : loc.pathname.startsWith(path);
          return (
            <NavLink key={path} to={path} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textDecoration: 'none', padding: '4px 8px', minWidth: 44 }}>
              <Icon size={18} color={active ? 'var(--accent)' : 'var(--text-3)'} />
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, color: active ? 'var(--accent)' : 'var(--text-3)' }}>{label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
