import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Plan from './pages/Plan';
import Team from './pages/Team';
import Tasks from './pages/Tasks';
import Events from './pages/Events';
import Partnerships from './pages/Partnerships';
import CRM from './pages/CRM';
import Content from './pages/Content';
import Outreach from './pages/Outreach';
import Chat from './pages/Chat';
import Import from './pages/Import';
import Export from './pages/Export';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main style={{ flex: 1, overflow: 'auto' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/plan" element={<Plan />} />
            <Route path="/team" element={<Team />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/events" element={<Events />} />
            <Route path="/partnerships" element={<Partnerships />} />
            <Route path="/crm" element={<CRM />} />
            <Route path="/content" element={<Content />} />
            <Route path="/outreach" element={<Outreach />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/import" element={<Import />} />
            <Route path="/export" element={<Export />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
