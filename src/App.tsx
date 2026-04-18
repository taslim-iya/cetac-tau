import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Plan from './pages/Plan';
import CalendarView from './pages/Calendar';
import Team from './pages/Team';
import Tasks from './pages/Tasks';
import Events from './pages/Events';
import Partnerships from './pages/Partnerships';
import Sponsors from './pages/Sponsors';
import CRM from './pages/CRM';
import Roles from './pages/Roles';
import Content from './pages/Content';
import Templates from './pages/Templates';
import SearchDay from './pages/SearchDay';
import Chat from './pages/Chat';
import Import from './pages/Import';
import Export from './pages/Export';
import TeamPortal from './pages/TeamPortal';
import Outreach from './pages/Outreach';
import Settings from './pages/Settings';
import MemberTasks from './pages/MemberTasks';
import KPITracker from './pages/KPITracker';
import Playbook from './pages/Playbook';
import Login from './pages/Login';
import { useStore } from './store';
import { getUserModules, canAccessPath } from './lib/permissions';

function ProtectedRoute({ moduleKey, children }: { moduleKey: string; children: React.ReactNode }) {
  const currentUser = useStore(s => s.currentUser);
  const team = useStore(s => s.team);

  const allowed = useMemo(() => {
    if (!currentUser) return false;
    const modules = getUserModules(currentUser, team);
    return modules.includes(moduleKey);
  }, [currentUser, team, moduleKey]);

  if (!allowed) {
    return (
      <div style={{ padding: '60px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Access Restricted</h2>
        <p style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 400, margin: '0 auto' }}>
          You don't have permission to view this page. Contact your team admin to request access.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  const darkMode = useStore(s => s.darkMode);
  const currentUser = useStore(s => s.currentUser);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  if (!currentUser) return <Login />;

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
        <Sidebar />
        <main style={{ flex: 1, overflow: 'auto', paddingBottom: 72 }}>
          <Routes>
            <Route path="/" element={<ProtectedRoute moduleKey="dashboard"><Dashboard /></ProtectedRoute>} />
            <Route path="/plan" element={<ProtectedRoute moduleKey="plan"><Plan /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute moduleKey="calendar"><CalendarView /></ProtectedRoute>} />
            <Route path="/team" element={<ProtectedRoute moduleKey="team"><Team /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute moduleKey="tasks"><Tasks /></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute moduleKey="events"><Events /></ProtectedRoute>} />
            <Route path="/partnerships" element={<ProtectedRoute moduleKey="partnerships"><Partnerships /></ProtectedRoute>} />
            <Route path="/sponsors" element={<ProtectedRoute moduleKey="sponsors"><Sponsors /></ProtectedRoute>} />
            <Route path="/crm" element={<ProtectedRoute moduleKey="crm"><CRM /></ProtectedRoute>} />
            <Route path="/roles" element={<ProtectedRoute moduleKey="roles"><Roles /></ProtectedRoute>} />
            <Route path="/content" element={<ProtectedRoute moduleKey="content"><Content /></ProtectedRoute>} />
            <Route path="/outreach" element={<ProtectedRoute moduleKey="outreach"><Outreach /></ProtectedRoute>} />
            <Route path="/templates" element={<ProtectedRoute moduleKey="templates"><Templates /></ProtectedRoute>} />
            <Route path="/search-day" element={<ProtectedRoute moduleKey="searchDay"><SearchDay /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute moduleKey="chat"><Chat /></ProtectedRoute>} />
            <Route path="/import" element={<ProtectedRoute moduleKey="import"><Import /></ProtectedRoute>} />
            <Route path="/export" element={<ProtectedRoute moduleKey="export"><Export /></ProtectedRoute>} />
            <Route path="/team-portal" element={<ProtectedRoute moduleKey="teamPortal"><TeamPortal /></ProtectedRoute>} />
            <Route path="/member-tasks" element={<ProtectedRoute moduleKey="memberTasks"><MemberTasks /></ProtectedRoute>} />
            <Route path="/kpi" element={<ProtectedRoute moduleKey="kpi"><KPITracker /></ProtectedRoute>} />
            <Route path="/playbook" element={<ProtectedRoute moduleKey="playbook"><Playbook /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute moduleKey="settings"><Settings /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
