import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Contact, TeamMember, Task, CETACEvent, Partnership, ContentItem, CalendarEvent, AppSettings, CETACUser, MemberTask, Outreach, Vertical, KPI } from './types';
import { id } from './lib/utils';
import { loadRemoteState, saveRemoteState, mergeState, markRemoteLoaded } from './lib/sync';
import type { RolePlaybook, BSPartner } from './data/playbook-data';
import { DEFAULT_PLAYBOOKS, DEFAULT_BS_PARTNERS } from './data/playbook-data';

interface S {
  contacts: Contact[]; team: TeamMember[]; tasks: Task[]; events: CETACEvent[];
  partnerships: Partnership[]; content: ContentItem[]; outreach: Outreach[];
  calendar: CalendarEvent[]; settings: AppSettings;
  users: CETACUser[]; currentUser: CETACUser | null;
  memberTasks: MemberTask[];
  roles: string[];
  verticals: Vertical[];
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
  addUser: (user: Omit<CETACUser, 'id'>) => void;
  removeUser: (userId: string) => void;
  addRole: (role: string) => void;
  removeRole: (role: string) => void;
  addVertical: (v: Omit<Vertical, 'id' | 'createdAt'>) => void;
  updateVertical: (vId: string, updates: Partial<Vertical>) => void;
  removeVertical: (vId: string) => void;
  playbooks: RolePlaybook[];
  bsPartners: BSPartner[];
  updatePlaybook: (playbookId: string, updates: Partial<RolePlaybook>) => void;
  updateBSPartner: (partnerId: string, updates: Partial<BSPartner>) => void;
}

const TEAM: TeamMember[] = [
  { id: id(), name: 'Taslim', role: 'President', responsibilities: 'Networking, Career Development & Sponsorships - leads external ecosystem, investor and sponsor relationships, alumni engagement, PPM mentoring. Newsletter Editor.', email: '', phone: '', linkedin: '', status: 'active', vertical: 'Executive', createdAt: new Date().toISOString() },
  { id: id(), name: 'Andres', role: 'VP Partnerships - External', responsibilities: 'Owns investor, accelerator, and business school relationships, sponsorship pipeline, and the ETA ecosystem database', email: '', phone: '', linkedin: '', status: 'active', vertical: 'Partnerships', createdAt: new Date().toISOString() },
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
  { id: id(), name: 'Foundation Week - Internal Setup', description: 'Finalise team structure, begin rebrand, draft LinkedIn post, start alumni mapping, outreach to business schools', date: '', time: '', venue: '', week: 1, status: 'planned', speakers: [], sponsors: [], attendeeCount: 0, format: 'Internal', postEventNotes: '', checklist: [], createdAt: new Date().toISOString() },
  { id: id(), name: 'Spectra Search: Investor Perspective', description: 'Investor talk/fireside - how they evaluate searchers. Moderated Q&A.', date: '', time: '', venue: 'CJBS', week: 2, status: 'planned', speakers: ['Spectra Search'], sponsors: [], attendeeCount: 0, format: 'Talk + Q&A', postEventNotes: '', checklist: [], createdAt: new Date().toISOString() },
  { id: id(), name: 'LBS Dinner + Co-Founder Coffee', description: 'LBS dinner (8-12 people), first co-founder coffee, alumni outreach begins, Search Day venue lock', date: '', time: '', venue: 'London/Cambridge', week: 3, status: 'planned', speakers: [], sponsors: [], attendeeCount: 0, format: 'Dinner + Networking', postEventNotes: '', checklist: [], createdAt: new Date().toISOString() },
  { id: id(), name: 'Aven Capital: Roll-up Strategy', description: 'Talk/workshop on roll-up strategy - thesis, sourcing, integration', date: '', time: '', venue: 'CJBS', week: 4, status: 'planned', speakers: ['Aven Capital'], sponsors: [], attendeeCount: 0, format: 'Workshop', postEventNotes: '', checklist: [], createdAt: new Date().toISOString() },
  { id: id(), name: 'Darren Coyne / debtadvisory.ai: Acquisition Finance', description: 'Joint session - deal structuring, debt options, lender relationships', date: '', time: '', venue: 'CJBS', week: 5, status: 'planned', speakers: ['Darren Coyne', 'Tom Greene'], sponsors: [], attendeeCount: 0, format: 'Joint Session', postEventNotes: '', checklist: [], createdAt: new Date().toISOString() },
  { id: id(), name: 'Saffery: Diligence & Transaction Execution', description: 'Financial/commercial diligence workshop. Saffery as sponsor.', date: '', time: '', venue: 'CJBS', week: 6, status: 'planned', speakers: ['Saffery'], sponsors: ['Saffery'], attendeeCount: 0, format: 'Workshop', postEventNotes: '', checklist: [], createdAt: new Date().toISOString() },
  { id: id(), name: 'Internal Prep Workshop', description: 'Search Day competition prep - deal evaluation, presentation skills, Q&A practice. Gustavo session.', date: '', time: '', venue: 'CJBS', week: 7, status: 'planned', speakers: ['Taslim', 'Gustavo (9T Capital)'], sponsors: [], attendeeCount: 0, format: 'Workshop', postEventNotes: '', checklist: [], createdAt: new Date().toISOString() },
  { id: id(), name: 'Search Day + Competition', description: 'Flagship half-day conference - panels, keynote, competition, networking drinks', date: '', time: '', venue: 'CJBS', week: 8, status: 'planned', speakers: ['Spectra Search', 'Aven Capital', 'Saffery', '9T Capital'], sponsors: ['Spectra Search', 'Aven Capital', 'Saffery', '9T Capital'], attendeeCount: 0, format: 'Conference', postEventNotes: '', checklist: [], createdAt: new Date().toISOString() },
  { id: id(), name: 'ETA Networking Social - Wrap-up', description: 'End-of-term social - alumni, members, LBS guests. Reflection + open networking.', date: '', time: '', venue: 'Cambridge', week: 9, status: 'planned', speakers: [], sponsors: [], attendeeCount: 0, format: 'Social', postEventNotes: '', checklist: [], createdAt: new Date().toISOString() },
];

const TASKS: Task[] = [
  { id: id(), title: 'Get ETA email address from Cecile', description: '', status: 'todo', priority: 'urgent', assignees: ['Isbah'], dueDate: '', week: 1, category: 'Admin', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Message Gustavo (9T Capital) - invite to Search Day, request case studies', description: '', status: 'todo', priority: 'urgent', assignees: ['Taslim'], dueDate: '', week: 1, category: 'Partnerships', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Get Steve to join the club and define his role', description: '', status: 'todo', priority: 'urgent', assignees: ['Taslim', 'Isbah'], dueDate: '', week: 1, category: 'Team', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Brief full team on execution plan and assign vacant roles', description: 'Event Manager Internal, Event Manager External, Partnerships Lead Business Schools, Marketing Officers', status: 'todo', priority: 'urgent', assignees: ['Taslim', 'Isbah'], dueDate: '', week: 1, category: 'Operations', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Begin rebrand - commission logo, colour palette, Canva templates', description: '', status: 'todo', priority: 'high', assignees: ['Taslim'], dueDate: '', week: 1, category: 'Brand', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Draft LinkedIn founding post and co-president bios', description: '', status: 'todo', priority: 'high', assignees: ['Taslim'], dueDate: '', week: 1, category: 'Communications', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Outreach to investors and advisers - build target list from ETA Ecosystem Database', description: '', status: 'todo', priority: 'high', assignees: ['Taslim', 'Armaan', 'Isbah', 'Elisa', 'Heza'], dueDate: '', week: 1, category: 'Outreach', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Get LBS Database and do outreach to everyone', description: 'LinkedIn and Searchfunder outreach', status: 'todo', priority: 'high', assignees: ['Isbah', 'Taslim', 'Heza', 'Oscar'], dueDate: '', week: 1, category: 'Outreach', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Send inter-club emails to INSEAD, IESE, HBS, IE, ESADE presidents', description: '', status: 'todo', priority: 'high', assignees: ['Taslim', 'Isbah', 'Andres'], dueDate: '', week: 1, category: 'Partnerships', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Reach out to LBS ETA club president - propose dinner and partnership', description: '', status: 'todo', priority: 'high', assignees: ['Taslim'], dueDate: '', week: 1, category: 'Partnerships', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Begin identifying alumni via LinkedIn and CJBS alumni office', description: '', status: 'todo', priority: 'medium', assignees: ['Taslim'], dueDate: '', week: 1, category: 'Alumni', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Partner with PE/VC Club, Entrepreneurship Centre, Finance Societies', description: '', status: 'todo', priority: 'medium', assignees: ['Taslim'], dueDate: '', week: 1, category: 'Partnerships', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Launch LinkedIn page with founding post', description: '', status: 'todo', priority: 'high', assignees: ['Armaan', 'Taslim'], dueDate: '', week: 2, category: 'Communications', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Launch WhatsApp group and email list', description: '', status: 'todo', priority: 'medium', assignees: ['Armaan'], dueDate: '', week: 2, category: 'Communications', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Confirm LBS dinner date and send formal invitation', description: '', status: 'todo', priority: 'high', assignees: ['Taslim', 'Andres'], dueDate: '', week: 2, category: 'Events', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Confirm Spectra Search event - format, venue, date, AV', description: '', status: 'todo', priority: 'urgent', assignees: ['Taslim'], dueDate: '', week: 2, category: 'Events', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Begin June Search Day planning - venue, sponsors, judges', description: '', status: 'todo', priority: 'high', assignees: ['Taslim', 'Isbah'], dueDate: '', week: 2, category: 'Events', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'First case study interview conducted', description: '', status: 'todo', priority: 'medium', assignees: ['Taslim', 'Isbah'], dueDate: '', week: 3, category: 'Content', completedAt: '', createdAt: new Date().toISOString() },
  { id: id(), title: 'Confirm Aven Capital event - format, venue, date', description: '', status: 'todo', priority: 'high', assignees: ['Taslim'], dueDate: '', week: 4, category: 'Events', completedAt: '', createdAt: new Date().toISOString() },
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

// Auto-generate credentials from name
function makeEmail(name: string) { return `${name.toLowerCase().replace(/\s+/g, '.')}@etacambridge.co.uk`; }
function makePassword(name: string) { return `cetac-${name.toLowerCase()}26`; }

// Role-based permission presets
const ROLE_PERMS: Record<string, Record<string, 'edit' | 'view'>> = {
  'President': { dashboard: 'edit', plan: 'edit', calendar: 'edit', team: 'edit', tasks: 'edit', memberTasks: 'edit', events: 'edit', partnerships: 'edit', sponsors: 'edit', crm: 'edit', roles: 'edit', content: 'edit', outreach: 'edit', templates: 'edit', searchDay: 'edit', chat: 'edit', import: 'edit', export: 'edit', teamPortal: 'edit', settings: 'edit' },
  'VP Partnerships - External': { dashboard: 'view', plan: 'view', calendar: 'view', partnerships: 'edit', sponsors: 'edit', crm: 'edit', outreach: 'edit', templates: 'edit', searchDay: 'view', export: 'view', tasks: 'view', events: 'view' },
  'VP Communications & Sponsorship': { dashboard: 'view', plan: 'view', calendar: 'view', content: 'edit', outreach: 'edit', templates: 'edit', crm: 'view', sponsors: 'edit', tasks: 'view', events: 'view', export: 'view' },
  'VP Operations': { dashboard: 'view', plan: 'edit', calendar: 'edit', tasks: 'edit', events: 'edit', roles: 'edit', memberTasks: 'edit', team: 'edit', teamPortal: 'view', export: 'edit', import: 'edit', settings: 'view' },
  'VP Administration & Events': { dashboard: 'view', plan: 'view', calendar: 'edit', events: 'edit', searchDay: 'edit', tasks: 'edit', export: 'view', import: 'view' },
  'VP Community': { dashboard: 'view', plan: 'view', calendar: 'view', crm: 'edit', content: 'edit', outreach: 'edit', templates: 'view', tasks: 'view', events: 'view' },
  'Member': { dashboard: 'view', plan: 'view', calendar: 'view', tasks: 'view', events: 'view', memberTasks: 'view', chat: 'edit' },
  'Potential Member': { dashboard: 'view', plan: 'view', calendar: 'view' },
};

export function permsForRole(role: string): Record<string, 'edit' | 'view'> {
  if (ROLE_PERMS[role]) return ROLE_PERMS[role];
  if (role.startsWith('VP')) return ROLE_PERMS['Member'];
  if (role.includes('Potential')) return ROLE_PERMS['Potential Member'];
  return ROLE_PERMS['Member'];
}

const DEFAULT_USERS: CETACUser[] = [
  { id: id(), email: 'admin@etacambridge.co.uk', name: 'Admin', password: 'cetac2026', role: 'super_admin', permissions: {} },
  // Auto-generated team accounts
  ...TEAM.map(m => ({
    id: id(),
    email: makeEmail(m.name),
    name: m.name,
    password: makePassword(m.name),
    role: (m.role === 'President' ? 'super_admin' : 'team_member') as 'super_admin' | 'team_member',
    permissions: permsForRole(m.role),
    teamMemberId: m.id,
  })),
];

const DEFAULT_ROLES = ['President', 'VP Partnerships - External', 'VP Communications & Sponsorship', 'VP Operations', 'VP Administration & Events', 'VP Community', 'Member', 'Potential Member'];

const DEFAULT_VERTICALS: Vertical[] = [
  { id: id(), name: 'Marketing', description: 'Brand, social media, LinkedIn, content', leadId: '', kpis: [
    { id: id(), name: 'LinkedIn Followers', target: 500, current: 0, unit: 'followers' },
    { id: id(), name: 'Posts Published', target: 20, current: 0, unit: 'posts' },
    { id: id(), name: 'Newsletter Subscribers', target: 200, current: 0, unit: 'subscribers' },
  ], createdAt: new Date().toISOString() },
  { id: id(), name: 'Events', description: 'Speaker events, workshops, Search Day', leadId: '', kpis: [
    { id: id(), name: 'Events Hosted', target: 9, current: 0, unit: 'events' },
    { id: id(), name: 'Total Attendees', target: 200, current: 0, unit: 'people' },
    { id: id(), name: 'Speaker Satisfaction', target: 90, current: 0, unit: '%' },
  ], createdAt: new Date().toISOString() },
  { id: id(), name: 'Partnerships', description: 'Business schools, investors, sponsors', leadId: '', kpis: [
    { id: id(), name: 'Active Partnerships', target: 10, current: 0, unit: 'partnerships' },
    { id: id(), name: 'MOUs Signed', target: 3, current: 0, unit: 'MOUs' },
    { id: id(), name: 'Sponsor Revenue', target: 5000, current: 0, unit: '£' },
  ], createdAt: new Date().toISOString() },
  { id: id(), name: 'Membership', description: 'Recruitment, engagement, retention', leadId: '', kpis: [
    { id: id(), name: 'Active Members', target: 30, current: 16, unit: 'members' },
    { id: id(), name: 'WhatsApp Group Size', target: 50, current: 0, unit: 'members' },
    { id: id(), name: 'Member Retention', target: 90, current: 0, unit: '%' },
  ], createdAt: new Date().toISOString() },
  { id: id(), name: 'Content', description: 'Case studies, playbooks, newsletters', leadId: '', kpis: [
    { id: id(), name: 'Case Studies Published', target: 4, current: 0, unit: 'articles' },
    { id: id(), name: 'Playbook Progress', target: 100, current: 0, unit: '%' },
  ], createdAt: new Date().toISOString() },
  { id: id(), name: 'Outreach', description: 'Alumni, investor, school outreach', leadId: '', kpis: [
    { id: id(), name: 'Outreach Emails Sent', target: 100, current: 0, unit: 'emails' },
    { id: id(), name: 'Response Rate', target: 30, current: 0, unit: '%' },
    { id: id(), name: 'Meetings Booked', target: 15, current: 0, unit: 'meetings' },
  ], createdAt: new Date().toISOString() },
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
      roles: DEFAULT_ROLES,
      verticals: DEFAULT_VERTICALS,
      playbooks: DEFAULT_PLAYBOOKS,
      bsPartners: DEFAULT_BS_PARTNERS,
      darkMode: false,
      toggleDarkMode: () => set(s => ({ darkMode: !s.darkMode })),

      login: (email: string, password: string) => {
        const user = get().users.find(u => u.email === email && u.password === password);
        if (user) { set({ currentUser: user }); return true; }
        return false;
      },
      logout: () => set({ currentUser: null }),

      add: (key, item) => {
        const newId = id();
        const newItem = { ...item, id: newId, createdAt: new Date().toISOString() };
        set(s => {
          const updated: any = { [key]: [newItem, ...(s as any)[key]] };
          // Auto-create user account when adding a team member
          if (key === 'team' && (item as any).name) {
            const name = (item as any).name;
            const role = (item as any).role || 'Member';
            const email = makeEmail(name);
            // Don't create duplicate
            if (!s.users.find(u => u.email === email)) {
              updated.users = [...s.users, {
                id: id(), email, name, password: makePassword(name),
                role: (role === 'President' ? 'super_admin' : 'team_member') as 'super_admin' | 'team_member',
                permissions: permsForRole(role), teamMemberId: newId,
              }];
            }
          }
          return updated;
        });
      },
      update: (key, itemId, updates) => set(s => {
        const result: any = { [key]: (s as any)[key].map((i: any) => i.id === itemId ? { ...i, ...updates } : i) };
        if (key === 'team') {
          const member = s.team.find(m => m.id === itemId);
          if (member) {
            // Auto-update user permissions when team member role changes
            if (updates.role) {
              result.users = s.users.map(u => {
                if (u.name === member.name || u.teamMemberId === itemId) {
                  return { ...u, permissions: permsForRole(updates.role), role: updates.role === 'President' ? 'super_admin' as const : 'team_member' as const };
                }
                return u;
              });
            }
            // Sync name changes across playbooks, users, assignedTo, tasks, memberTasks
            if (updates.name && updates.name !== member.name) {
              const oldName = member.name;
              const newName = updates.name;
              result.playbooks = (result.playbooks || s.playbooks).map((p: any) => ({
                ...p,
                holder: p.holder === oldName ? newName : p.holder,
                assignedTo: (p.assignedTo || []).map((n: string) => n === oldName ? newName : n),
              }));
              result.users = (result.users || s.users).map((u: any) => u.teamMemberId === itemId || u.name === oldName ? { ...u, name: newName } : u);
              result.tasks = s.tasks.map((t: any) => ({ ...t, assignedTo: t.assignedTo === oldName ? newName : t.assignedTo }));
              result.memberTasks = s.memberTasks.map((t: any) => ({ ...t, assignedTo: t.assignedTo === oldName ? newName : t.assignedTo }));
            }
            // Sync role changes to playbook holder's role label
            if (updates.role && updates.role !== member.role) {
              result.playbooks = (result.playbooks || s.playbooks).map((p: any) => {
                if (p.holder === member.name || (updates.name && p.holder === updates.name)) {
                  return p; // holder stays the person's name, not the role title
                }
                return p;
              });
            }
          }
        }
        return result;
      }),
      remove: (key, itemId) => set(s => ({ [key]: (s as any)[key].filter((i: any) => i.id !== itemId) })),
      updateSettings: (upd) => set(s => ({ settings: { ...s.settings, ...upd } })),

      addMemberTask: (task) => set(s => ({ memberTasks: [{ ...task, id: id(), createdAt: new Date().toISOString() }, ...s.memberTasks] })),
      updateMemberTask: (taskId, updates) => set(s => ({ memberTasks: s.memberTasks.map(t => t.id === taskId ? { ...t, ...updates } : t) })),
      removeMemberTask: (taskId) => set(s => ({ memberTasks: s.memberTasks.filter(t => t.id !== taskId) })),
      addUser: (user) => set(s => ({ users: [...s.users, { ...user, id: id() }] })),
      removeUser: (userId) => set(s => ({ users: s.users.filter(u => u.id !== userId) })),
      addRole: (role) => set(s => s.roles.includes(role) ? {} : { roles: [...s.roles, role] }),
      removeRole: (role) => set(s => ({ roles: s.roles.filter(r => r !== role) })),
      addVertical: (v) => set(s => ({ verticals: [...s.verticals, { ...v, id: id(), createdAt: new Date().toISOString() }] })),
      updateVertical: (vId, updates) => set(s => ({ verticals: s.verticals.map(v => v.id === vId ? { ...v, ...updates } : v) })),
      removeVertical: (vId) => set(s => ({ verticals: s.verticals.filter(v => v.id !== vId) })),
      updatePlaybook: (playbookId, updates) => set(s => {
        const result: any = { playbooks: s.playbooks.map(p => p.id === playbookId ? { ...p, ...updates } : p) };
        // When holder changes, update the corresponding team member's role to match playbook role
        if (updates.holder) {
          const pb = s.playbooks.find(p => p.id === playbookId);
          if (pb) {
            const teamMember = s.team.find(m => m.name === updates.holder);
            if (teamMember && teamMember.role !== pb.role) {
              result.team = s.team.map(m => m.id === teamMember.id ? { ...m, role: pb.role } : m);
              // Also update user perms
              result.users = s.users.map(u => u.name === updates.holder || u.teamMemberId === teamMember.id
                ? { ...u, permissions: permsForRole(pb.role), role: pb.role === 'President' ? 'super_admin' as const : 'team_member' as const }
                : u);
            }
          }
        }
        return result;
      }),
      updateBSPartner: (partnerId, updates) => set(s => ({ bsPartners: s.bsPartners.map(p => p.id === partnerId ? { ...p, ...updates } : p) })),
    }),
    {
      name: 'cetac-store',
      partialize: (s) => ({ contacts: s.contacts, team: s.team, tasks: s.tasks, events: s.events, partnerships: s.partnerships, content: s.content, outreach: s.outreach, calendar: s.calendar, settings: s.settings, darkMode: s.darkMode, users: s.users, currentUser: s.currentUser, memberTasks: s.memberTasks, roles: s.roles, verticals: s.verticals, playbooks: s.playbooks, bsPartners: s.bsPartners }),
      onRehydrate: () => {
        // After localStorage rehydration, initialize missing fields and fetch remote
        setTimeout(async () => {
          try {
            const local = useStore.getState();
            // Backfill playbooks/bsPartners - merge new defaults into existing without wiping
            if (!local.playbooks || local.playbooks.length === 0) {
              useStore.setState({ playbooks: DEFAULT_PLAYBOOKS });
            } else {
              const existingIds = new Set(local.playbooks.map((p: any) => p.id));
              const newPbs = DEFAULT_PLAYBOOKS.filter(p => !existingIds.has(p.id));
              const patched = local.playbooks.map((p: any) => p.assignedTo ? p : { ...p, assignedTo: [] });
              useStore.setState({ playbooks: newPbs.length > 0 ? [...patched, ...newPbs] : patched });
            }
            if (!local.bsPartners || local.bsPartners.length === 0) {
              useStore.setState({ bsPartners: DEFAULT_BS_PARTNERS });
            }
            const remote = await loadRemoteState();
            if (remote) {
              const updated = useStore.getState();
              const merged = mergeState(updated as any, remote);
              useStore.setState(merged);
            }
            // Now safe to start syncing changes back to remote
            markRemoteLoaded();
          } catch {
            markRemoteLoaded(); // Even on error, allow saving
          }
        }, 500);
      },
    }
  )
);

// Subscribe to changes and sync to remote (debounced)
useStore.subscribe((state) => {
  const { contacts, team, tasks, events, partnerships, content, outreach, calendar, settings, users, memberTasks, roles, verticals, playbooks, bsPartners } = state;
  saveRemoteState({ contacts, team, tasks, events, partnerships, content, outreach, calendar, settings, users, memberTasks, roles, verticals, playbooks, bsPartners });
});
