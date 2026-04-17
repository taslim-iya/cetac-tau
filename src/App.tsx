import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
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
import Login from './pages/Login';
import { useStore } from './store';

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
            <Route path="/" element={<Dashboard />} />
            <Route path="/plan" element={<Plan />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/team" element={<Team />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/events" element={<Events />} />
            <Route path="/partnerships" element={<Partnerships />} />
            <Route path="/sponsors" element={<Sponsors />} />
            <Route path="/crm" element={<CRM />} />
            <Route path="/roles" element={<Roles />} />
            <Route path="/content" element={<Content />} />
            <Route path="/outreach" element={<Outreach />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/search-day" element={<SearchDay />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/import" element={<Import />} />
            <Route path="/export" element={<Export />} />
            <Route path="/team-portal" element={<TeamPortal />} />
            <Route path="/member-tasks" element={<MemberTasks />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
