import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Contact, TeamMember, Task, CETACEvent, Partnership, ContentItem, CalendarEvent, AppSettings, CETACUser, MemberTask, Outreach } from './types';
import { id } from './lib/utils';

interface S {
  contacts: Contact[]; team: TeamMember[]; tasks: Task[]; events: CETACEvent[];
  partnerships: Partnership[]; content: ContentItem[]; outreach: Outreach[];
  calendar: CalendarEvent[]; settings: AppSettings;
  users: CETACUser[]; currentUser: CETACUser | null;
  memberTasks: MemberTask[];
  darkMode: boolean;
  toggleDarkMode: () => void;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  add: <T extends { id: string }>(key: string, item: Omit<T, 'id' | 'createdAt'>) => void;
  update: (key: string, itemId: string, updates: Record<string, any>) => void;
  remove: (key: string, itemId: string) => void;
  updateSettings: (s: Partial<AppSettings>) => void;
  addMemberTask: (task: Omit<MemberTask, 'id' | 'createdAt'>) => void;
  updateMemberTask: (taskId: string, updates: Partial<MemberTask>) => void;
  removeMemberTask: (taskId: string) => void;
}

const TEAM: TeamMember[] = [
  { id: id(), name: 'Taslim', role: 'President', responsibilities: 'Networking, Career Development & Sponsorships — leads external ecosystem, investor and sponsor relationships, alumni engagement, PPM mentoring. Newsletter Editor.', email: '', phone: '', linkedin: '', status: 'active', vertical: 'Executive', createdAt: new Date().toISOString() },
  { id: id(), name: 'Andres', role: 'VP Partnerships — External', responsibilities: 'Owns investor, accelerator, and business school relationships, sponsorship pipeline, and the ETA ecosystem database', email: '', phone: '', linkedin: '', status: 'active', vertical: 'Partnerships', createdAt: new Date().toISOString() },
  { id: id(), name: 'Armaan', role: 'VP Communications & Sponsorship', responsibilities: 'Manages LinkedIn, branding, member communications, newsletter, and sponsor support', email: '', phone: '', linkedin: '', status: 'active', vertical: 'Communications', createdAt: new Date().toISOString() },
  { id: id(), name: 'Isbah', role: 'VP Operations', responsibilities: 'Operations, team coordination, execution tracking', email: '', phone: '', linkedin: '', status: 'active', vertical: 'Operations', createdAt: new Date().toISOString() },
  { id: id(), name: 'Masa', role: 'VP Administration & Events', responsibilities: 'Treasury, Admin, event logistics', email: '', phone: '', linkedin: '', status: 'active', vertical: 'Admin', createdAt: new Date().toISOString() },
  { id: id(), name: 'Oscar', role: 'VP Community', responsibilities: 'Community engagement and growth', email: '', phone: '', linkedin: '', status: 'active', vertical: 'Community', createdAt: new Date().toISOString() },
  { id: id(), name: 'Heza', role: 'Member', responsibilities: 'Outreach support', email: '', phone: '', linkedin: '', status: 'active', vertical: '', createdAt: new Date().toISOString() },
  { id: id(), name: 'Hizkia', role: 'Member', responsibilities: '', email: '', phone: '', linkedin: '', status: 'active', vertical: '', createdAt: new Date().toISOString() },
  { id: id(), name: 'Elisa', role: 'Member', responsibilities: 'Outreach support', email: '', phone: '', linkedin: '', status: 'active', vertical: '', createdAt: new Date().toISOString() },
  { id: id(), name: 'Turab', role: 'Member', responsibilities: '', email: '', phone: '', linkedin: '', status: 'active', vertical: '', createdAt: new Date().toISOString() },
  { id: id(), name: 'Vishisht', role: 'Member', responsibilities: '', email: '', phone: '', linkedin: '', status: 'active', vertical: '', createdAt: new Date().toISOString() },
  { id: id(), name: 'Justin', role: 'Member', responsibilities: '', email: '', phone: '', linkedin: '', status: 'active', vertical: '', createdAt: new Date().toISOString() },
  { id: id(), name: 'Juswank', role: 'Member', responsibilities: '', email: '', phone: '', linkedin: '', status: 'active', vertical: '', createdAt: new Date().toISOString() },
  { id: id(), name: 'Rounak', role: 'Member', responsibilities: '', email: '', phone: '', linkedin: '', status: 'active', vertical: '', createdAt: new Date().toISOString() },
  { id: id(), name: 'Ravin', role: 'Potential Member', responsibilities: '', email: '', phone: '', linkedin: '', status: 'potential', vertical: '', createdAt: new Date().toISOString() },
  { id: id(), name: 'Jai', role: 'Potential Member (MBA)', responsibilities: '', email: '', phone: '', linkedin: '', status: 'potential', vertical: '', createdAt: new Date().toISOString() },
];

const EVENTS: CETACEvent[] = [
  { id: id(), name: 'Foundation Week — Internal Setup', description: 'Finalise team structure, begin rebrand, draft LinkedIn post, start alumni mapping, outreach to business schools', date: '', time: '', venue: '', week: 1, status: 'planned', speakers: [], sponsors: [], attendeeCount: 0, format: 'Internal', postEventNotes: '', checklist: [], createdAt: new Date().toISOString() },
  { id: id(), name: 'Spectra Search: Investor Perspective', description: 'Investor talk/fireside — how they evaluate searchers. Moderated Q&A.', date: '', time: '', venue: 'CJBS', week: 2, status: 'planned', speakers: ['Spectra Search'], sponsors: [], attendeeCount: 0, format: 'Talk + Q&A', postEventNotes: '', checklist: [], createdAt: new Date().toISOString() },
  { id: id(), name: 'LBS Dinner + Co-Founder Coffee', description: 'LBS dinner (8-12 people), first co-founder coffee, alumni outreach begins, Search Day venue lock', date: '', time: '', venue: 'London/Cambridge', week: 3, status: 'planned', speakers: [], sponsors: [], attendeeCount: 0, format: 'Dinner + Networking', postEventNotes: '', checklist: [], createdAt: new Date().toISOString() },
  { id: id(), name: 'Aven Capital: Roll-up Strategy', description: 'Talk/workshop on roll-up strategy — thesis, sourcing, integration', date: '', time: '', venue: 'CJBS', week: 4, status: 'planned', speakers: ['Aven Capital'], sponsors: [], attendeeCount: 0, format: 'Workshop', postEventNotes: '', checklist: [], createdAt: new Date().toISOString() },
  { id: id(), name: 'Darren Coyne / debtadvisory.ai: Acquisition Finance', description: 'Joint session — deal structuring, debt options, lender relationships', date: '', time: '', venue: 'CJBS', week: 5, status: 'planned', speakers: ['Darren Coyne', 'Tom Greene'], sponsors: [], attendeeCount: 0, format: 'Joint Session', postEventNotes: '', checklist: [], createdAt: new Date().toISOString() },
  { id: id(), name: 'Saffery: Diligence & Transaction Execution', description: 'Financial/commercial diligence workshop. Saffery as sponsor.', date: '', time: '', venue: 'CJBS', week: 6, status: 'planned', speakers: ['Saffery'], sponsors: ['Saffery'], attendeeCount: 0, format: 'Workshop', postEventNotes: '', checklist: [], createdAt: new Date().toISOString() },
  { id: id(), name: 'Internal Prep Workshop', description: 'Search Day competition prep — deal evaluation, presentation skills, Q&A practice. Gustavo session.', date: '', time: '', venue: 'CJBS', week: 7, status: 'planned', speakers: ['Taslim', 'Gustavo (9T Capital)'], sponsors: [], attendeeCount: 0, format: 'Workshop', postEventNotes: '', checklist: [], createdAt: new Date().toISOString() },
  { id: id(), name: 'Search Day + Competition', description: 'Flagship half-day conference — panels, keynote, competition, networking drinks', date: '', time: '', venue: 'CJBS', week: 8, status: 'planned', speakers: ['Spectra Search', 'Aven Capital', 'Saffery', '9T Capital'], sponsors: ['Spectra Search', 'Aven Capital', 'Saffery', '9T Capital'], attendeeCount: 0, format: 'Conference', postEventNotes: '', checklist: [], createdAt: new Date().toISOString() },
  { id: id(), name: 'ETA Networking Social — Wrap-up', description: 'End-of-term social — alumni, members, LBS guests. Reflection + open networking.', date: '', time: '', venue: 'Cambridge', week: 9, status: 'planned', speakers: [], sponsors: [], attendeeCount: 0, format: 'Social', postEventNotes: '', checklist: [], createdAt: new Date().toISOString() },
];

const TASKS: Task[] = [
  { id: id(), title: 'Get ETA email address from Cecile', description: '', status: 'todo', priority: 'urgent', assignees: ['Isbah'], dueDate: '', week: 1, category: 'Admin', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Message Gustavo (9T Capital) — invite to Search Day, request case studies', description: '', status: 'todo', priority: 'urgent', assignees: ['Taslim'], dueDate: '', week: 1, category: 'Partnerships', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Get Steve to join the club and define his role', description: '', status: 'todo', priority: 'urgent', assignees: ['Taslim', 'Isbah'], dueDate: '', week: 1, category: 'Team', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Brief full team on execution plan and assign vacant roles', description: 'Event Manager Internal, Event Manager External, Partnerships Lead Business Schools, Marketing Officers', status: 'todo', priority: 'urgent', assignees: ['Taslim', 'Isbah'], dueDate: '', week: 1, category: 'Operations', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Begin rebrand — commission logo, colour palette, Canva templates', description: '', status: 'todo', priority: 'high', assignees: ['Taslim'], dueDate: '', week: 1, category: 'Brand', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Draft LinkedIn founding post and co-president bios', description: '', status: 'todo', priority: 'high', assignees: ['Taslim'], dueDate: '', week: 1, category: 'Communications', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Outreach to investors and advisers — build target list from ETA Ecosystem Database', description: '', status: 'todo', priority: 'high', assignees: ['Taslim', 'Armaan', 'Isbah', 'Elisa', 'Heza'], dueDate: '', week: 1, category: 'Outreach', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Get LBS Database and do outreach to everyone', description: 'LinkedIn and Searchfunder outreach', status: 'todo', priority: 'high', assignees: ['Isbah', 'Taslim', 'Heza', 'Oscar'], dueDate: '', week: 1, category: 'Outreach', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Send inter-club emails to INSEAD, IESE, HBS, IE, ESADE presidents', description: '', status: 'todo', priority: 'high', assignees: ['Taslim', 'Isbah', 'Andres'], dueDate: '', week: 1, category: 'Partnerships', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Reach out to LBS ETA club president — propose dinner and partnership', description: '', status: 'todo', priority: 'high', assignees: ['Taslim'], dueDate: '', week: 1, category: 'Partnerships', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Begin identifying alumni via LinkedIn and CJBS alumni office', description: '', status: 'todo', priority: 'medium', assignees: ['Taslim'], dueDate: '', week: 1, category: 'Alumni', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Partner with PE/VC Club, Entrepreneurship Centre, Finance Societies', description: '', status: 'todo', priority: 'medium', assignees: ['Taslim'], dueDate: '', week: 1, category: 'Partnerships', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Launch LinkedIn page with founding post', description: '', status: 'todo', priority: 'high', assignees: ['Armaan', 'Taslim'], dueDate: '', week: 2, category: 'Communications', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Launch WhatsApp group and email list', description: '', status: 'todo', priority: 'medium', assignees: ['Armaan'], dueDate: '', week: 2, category: 'Communications', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Confirm LBS dinner date and send formal invitation', description: '', status: 'todo', priority: 'high', assignees: ['Taslim', 'Andres'], dueDate: '', week: 2, category: 'Events', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Confirm Spectra Search event — format, venue, date, AV', description: '', status: 'todo', priority: 'urgent', assignees: ['Taslim'], dueDate: '', week: 2, category: 'Events', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Begin June Search Day planning — venue, sponsors, judges', description: '', status: 'todo', priority: 'high', assignees: ['Taslim', 'Isbah'], dueDate: '', week: 2, category: 'Events', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'First case study interview conducted', description: '', status: 'todo', priority: 'medium', assignees: ['Taslim', 'Isbah'], dueDate: '', week: 3, category: 'Content', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Confirm Aven Capital event — format, venue, date', description: '', status: 'todo', priority: 'high', assignees: ['Taslim'], dueDate: '', week: 4, category: 'Events', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Business school MOU confirmed with at least 2 clubs', description: '', status: 'todo', priority: 'medium', assignees: ['Andres', 'Taslim'], dueDate: '', week: 4, category: 'Partnerships', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Confirm Darren Coyne / Tom Greene event', description: '', status: 'todo', priority: 'high', assignees: ['Taslim'], dueDate: '', week: 5, category: 'Events', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Alumni reception held before end of May', description: '', status: 'todo', priority: 'medium', assignees: ['Taslim'], dueDate: '', week: 6, category: 'Alumni', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'First case study published on LinkedIn', description: '', status: 'todo', priority: 'medium', assignees: ['Taslim', 'Isbah'], dueDate: '', week: 6, category: 'Content', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'ETA Playbook first draft started', description: '', status: 'todo', priority: 'low', assignees: ['Taslim'], dueDate: '', week: 7, category: 'Content', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Search Day: full logistics finalised, invitations sent', description: '', status: 'todo', priority: 'urgent', assignees: ['Taslim', 'Isbah', 'Armaan'], dueDate: '', week: 7, category: 'Events', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Post-Search Day write-up on LinkedIn within 3 days', description: '', status: 'todo', priority: 'high', assignees: ['Armaan'], dueDate: '', week: 8, category: 'Communications', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Full team debrief and handover notes drafted', description: '', status: 'todo', priority: 'medium', assignees: ['Taslim', 'Isbah'], dueDate: '', week: 9, category: 'Operations', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Begin planning for next term', description: '', status: 'todo', priority: 'low', assignees: ['Taslim'], dueDate: '', week: 9, category: 'Operations', completedAt: '', createdAt: new Date().toISOString() },
];

const PARTNERSHIPS: Partnership[] = [
  { id: id(), name: 'LBS ETA Club', type: 'business_school', contactPerson: '', contactEmail: '', status: 'prospect', notes: 'Propose dinner, contact list swap, partner club MOU', lastContactDate: '', nextAction: 'Reach out to president', createdAt: new Date().toISOString() },
  { id: id(), name: 'INSEAD ETA Club', type: 'business_school', contactPerson: '', contactEmail: '', status: 'prospect', notes: '', lastContactDate: '', nextAction: 'Send intro email', createdAt: new Date().toISOString() },
  { id: id(), name: 'IESE ETA Club', type: 'business_school', contactPerson: '', contactEmail: '', status: 'prospect', notes: '', lastContactDate: '', nextAction: 'Send intro email', createdAt: new Date().toISOString() },
  { id: id(), name: 'HBS ETA Club', type: 'business_school', contactPerson: '', contactEmail: '', status: 'prospect', notes: '', lastContactDate: '', nextAction: 'Send intro email', createdAt: new Date().toISOString() },
  { id: id(), name: 'IE ETA Club', type: 'business_school', contactPerson: '', contactEmail: '', status: 'prospect', notes: '', lastContactDate: '', nextAction: 'Send intro email', createdAt: new Date().toISOString() },
  { id: id(), name: 'ESADE ETA Club', type: 'business_school', contactPerson: '', contactEmail: '', status: 'prospect', notes: '', lastContactDate: '', nextAction: 'Send intro email', createdAt: new Date().toISOString() },
  { id: id(), name: 'PE/VC Club', type: 'cambridge_internal', contactPerson: '', contactEmail: '', status: 'prospect', notes: 'Co-branded event, shared speaker list, cross-promotion', lastContactDate: '', nextAction: 'Propose partnership', createdAt: new Date().toISOString() },
  { id: id(), name: 'Kings Lab (Entrepreneurship Centre)', type: 'cambridge_internal', contactPerson: '', contactEmail: '', status: 'prospect', notes: 'Co-hosted events, network access, facility use', lastContactDate: '', nextAction: 'Propose partnership', createdAt: new Date().toISOString() },
  { id: id(), name: 'Finance Society', type: 'cambridge_internal', contactPerson: '', contactEmail: '', status: 'prospect', notes: 'Joint workshops or panels', lastContactDate: '', nextAction: 'Propose partnership', createdAt: new Date().toISOString() },
  { id: id(), name: 'Entrepreneurship Society', type: 'cambridge_internal', contactPerson: '', contactEmail: '', status: 'prospect', notes: 'Co-founder networking crossover', lastContactDate: '', nextAction: 'Propose partnership', createdAt: new Date().toISOString() },
  { id: id(), name: 'Spectra Search', type: 'investor', contactPerson: '', contactEmail: '', status: 'prospect', notes: 'Week 2 event confirmed. Investor perspective talk.', lastContactDate: '', nextAction: 'Confirm event details', createdAt: new Date().toISOString() },
  { id: id(), name: 'Aven Capital', type: 'investor', contactPerson: '', contactEmail: '', status: 'prospect', notes: 'Week 4 event. Roll-up strategy.', lastContactDate: '', nextAction: 'Confirm event details', createdAt: new Date().toISOString() },
  { id: id(), name: '9T Capital / Gustavo', type: 'investor', contactPerson: 'Gustavo', contactEmail: '', status: 'prospect', notes: 'Invite to Search Day, request case studies, propose teaching session, sponsorship', lastContactDate: '', nextAction: 'Message Gustavo', createdAt: new Date().toISOString() },
  { id: id(), name: 'Saffery', type: 'sponsor', contactPerson: '', contactEmail: '', status: 'prospect', notes: 'End of May event. Diligence workshop. Potential sponsor.', lastContactDate: '', nextAction: 'Confirm event + sponsorship', createdAt: new Date().toISOString() },
  { id: id(), name: 'debtadvisory.ai', type: 'advisor', contactPerson: 'Darren Coyne / Tom Greene', contactEmail: '', status: 'prospect', notes: 'Week 5 event. Acquisition finance.', lastContactDate: '', nextAction: 'Confirm event details', createdAt: new Date().toISOString() },
];

const DEFAULT_USERS: CETACUser[] = [
  { id: id(), email: 'admin@etacambridge.co.uk', name: 'Admin', password: 'cetac2026', role: 'super_admin', permissions: {} },
];

export const useStore = create<S>()(
  persist(
    (set, get) => ({
      contacts: [], team: TEAM, tasks: TASKS, events: EVENTS,
      partnerships: PARTNERSHIPS, content: [], outreach: [], calendar: [],
      settings: { openaiApiKey: '', clubEmail: '', notifyEmail: '' },
      users: DEFAULT_USERS,
      currentUser: null,
      memberTasks: [],
      darkMode: true,
      toggleDarkMode: () => set(s => ({ darkMode: !s.darkMode })),

      login: (email: string, password: string) => {
        const user = get().users.find(u => u.email === email && u.password === password);
        if (user) { set({ currentUser: user }); return true; }
        return false;
      },
      logout: () => set({ currentUser: null }),

      add: (key, item) => set(s => ({ [key]: [{ ...item, id: id(), createdAt: new Date().toISOString() }, ...(s as any)[key]] })),
      update: (key, itemId, updates) => set(s => ({ [key]: (s as any)[key].map((i: any) => i.id === itemId ? { ...i, ...updates } : i) })),
      remove: (key, itemId) => set(s => ({ [key]: (s as any)[key].filter((i: any) => i.id !== itemId) })),
      updateSettings: (upd) => set(s => ({ settings: { ...s.settings, ...upd } })),

      addMemberTask: (task) => set(s => ({ memberTasks: [{ ...task, id: id(), createdAt: new Date().toISOString() }, ...s.memberTasks] })),
      updateMemberTask: (taskId, updates) => set(s => ({ memberTasks: s.memberTasks.map(t => t.id === taskId ? { ...t, ...updates } : t) })),
      removeMemberTask: (taskId) => set(s => ({ memberTasks: s.memberTasks.filter(t => t.id !== taskId) })),
    }),
    { name: 'cetac-store', partialize: (s) => ({ contacts: s.contacts, team: s.team, tasks: s.tasks, events: s.events, partnerships: s.partnerships, content: s.content, outreach: s.outreach, calendar: s.calendar, settings: s.settings, darkMode: s.darkMode, users: s.users, currentUser: s.currentUser, memberTasks: s.memberTasks }) }
  )
);
