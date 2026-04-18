import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CheckSquare, Calendar, Handshake, BookOpen, Send, MessageSquare, Settings, Target, Upload, Download, Award, Trophy, UserPlus, Mail, Moon, Sun, Shield, ClipboardList, LogOut, BarChart3 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store';
import Notifications from './Notifications';

const nav = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/plan', icon: Target, label: '9-Week Plan' },
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/team', icon: Users, label: 'Team' },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { path: '/member-tasks', icon: ClipboardList, label: 'Member Tasks' },
  { path: '/kpi', icon: BarChart3, label: 'KPI Tracker' },
  { path: '/events', icon: Calendar, label: 'Events' },
  { path: '/partnerships', icon: Handshake, label: 'Partnerships' },
  { path: '/sponsors', icon: Award, label: 'Sponsors' },
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
  { path: '/chat', icon: MessageSquare, label: 'Chat' },
  { path: '/crm', icon: Users, label: 'CRM' },
  { path: '/settings', icon: Settings, label: 'More' },
];

export default function Sidebar() {
  const loc = useLocation();
  const { darkMode, toggleDarkMode, currentUser, logout } = useStore();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="desktop-sidebar" style={{ width: 200, borderRight: '1px solid var(--border)', background: 'var(--bg)', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, flexShrink: 0, overflow: 'auto' }}>
        {/* Logo — WPDS editorial style */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <img src="/logo.jpg" alt="Cambridge ETA Club" style={{ height: 32, objectFit: 'contain' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--sans)', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Management</span>
            <Notifications />
          </div>
        </div>

        <nav style={{ flex: 1, padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {nav.map(({ path, icon: Icon, label }) => {
            const active = path === '/' ? loc.pathname === '/' : loc.pathname.startsWith(path);
            return (
              <NavLink key={path} to={path} className={cn('nav-item', active && 'nav-item-active')}>
                <Icon size={14} strokeWidth={1.5} /> {label}
              </NavLink>
            );
          })}
        </nav>

        <div style={{ borderTop: '1px solid var(--border)', padding: '8px 0' }}>
          <button onClick={toggleDarkMode} className="nav-item">
            {darkMode ? <Sun size={14} /> : <Moon size={14} />} {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          <NavLink to="/settings" className={cn('nav-item', loc.pathname === '/settings' && 'nav-item-active')}>
            <Settings size={14} strokeWidth={1.5} /> Settings
          </NavLink>
          <button onClick={logout} className="nav-item">
            <LogOut size={14} /> Sign Out
          </button>
          {currentUser && (
            <div style={{ padding: '8px 16px', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {currentUser.name}
            </div>
          )}
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg)', borderTop: '1px solid var(--border)', zIndex: 100, justifyContent: 'space-around', padding: '8px 0 max(8px, env(safe-area-inset-bottom))' }}>
        {mobileNav.map(({ path, icon: Icon, label }) => {
          const active = path === '/' ? loc.pathname === '/' : loc.pathname.startsWith(path);
          return (
            <NavLink key={path} to={path} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textDecoration: 'none', padding: '4px 12px' }}>
              <Icon size={20} strokeWidth={1.5} color={active ? 'var(--text)' : 'var(--text-3)'} />
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, color: active ? 'var(--text)' : 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
