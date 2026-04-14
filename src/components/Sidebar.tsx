import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CheckSquare, Calendar, Handshake, BookOpen, Send, MessageSquare, BarChart3, Settings, Target, Upload, Download } from 'lucide-react';
import { cn } from '../lib/utils';

const nav = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/plan', icon: Target, label: '9-Week Plan' },
  { path: '/team', icon: Users, label: 'Team' },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { path: '/events', icon: Calendar, label: 'Events' },
  { path: '/partnerships', icon: Handshake, label: 'Partnerships' },
  { path: '/crm', icon: BarChart3, label: 'CRM' },
  { path: '/content', icon: BookOpen, label: 'Content' },
  { path: '/outreach', icon: Send, label: 'Outreach' },
  { path: '/chat', icon: MessageSquare, label: 'AI Chat' },
  { path: '/import', icon: Upload, label: 'Import' },
  { path: '/export', icon: Download, label: 'Export' },
];

export default function Sidebar() {
  const loc = useLocation();
  return (
    <aside style={{ width: 220, borderRight: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>
      <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: '#5E6AD2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 800 }}>C</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>CETAC</div>
          <div style={{ fontSize: 10, color: 'var(--text-3)' }}>Cambridge ETA Club</div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: '4px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {nav.map(({ path, icon: Icon, label }) => {
          const active = path === '/' ? loc.pathname === '/' : loc.pathname.startsWith(path);
          return (
            <NavLink key={path} to={path} className={cn('nav-item', active && 'nav-item-active')}>
              <Icon size={15} strokeWidth={1.5} /> {label}
            </NavLink>
          );
        })}
      </nav>
      <div style={{ borderTop: '1px solid var(--border)', padding: '8px' }}>
        <NavLink to="/settings" className={cn('nav-item', loc.pathname === '/settings' && 'nav-item-active')}>
          <Settings size={15} strokeWidth={1.5} /> Settings
        </NavLink>
      </div>
    </aside>
  );
}
