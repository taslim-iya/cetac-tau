import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Contact, TeamMember, Task, CETACEvent, Partnership, ContentItem, CalendarEvent, AppSettings, CETACUser, MemberTask, Outreach, Vertical, KPI } from './types';
import { id } from './lib/utils';
import { loadRemoteState, saveRemoteState, mergeState, markRemoteLoaded, markUserEdit, startRemotePolling, flushRemoteState } from './lib/sync';
import type { RolePlaybook, BSPartner } from './data/playbook-data';
import { DEFAULT_PLAYBOOKS, DEFAULT_BS_PARTNERS } from './data/playbook-data';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  authorName?: string;
}

export interface AccessOverride {
  memberId: string;
  permissions: string[];
  isAdmin: boolean;
  pin: string;
}

interface S {
  contacts: Contact[]; team: TeamMember[]; tasks: Task[]; events: CETACEvent[];
  partnerships: Partnership[]; content: ContentItem[]; outreach: Outreach[];
  calendar: CalendarEvent[]; settings: AppSettings;
  users: CETACUser[]; currentUser: CETACUser | null;
  memberTasks: MemberTask[];
  roles: string[];
  verticals: Vertical[];
  chatMessages: ChatMessage[];
  accessOverrides: AccessOverride[];
  // Tombstone log: per-collection list of recently-deleted item ids. Lets
  // deletions replicate across browsers when paired with the additive merge
  // in mergeState / api/sync.js.
  _deletedIds: Record<string, string[]>;
  darkMode: boolean;
  toggleDarkMode: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  add: <T extends { id: string }>(key: string, item: Omit<T, 'id' | 'createdAt'>) => void;
  update: (key: string, itemId: string, updates: Record<string, any>) => void;
  remove: (key: string, itemId: string) => void;
  updateSettings: (s: Partial<AppSettings>) => void;
  addMemberTask: (task: Omit<MemberTask, 'id' | 'createdAt'>) => void;
  updateMemberTask: (taskId: string, updates: Partial<MemberTask>) => void;
  removeMemberTask: (taskId: string) => void;
  addUser: (user: Omit<CETACUser, 'id'>) => void;
  updateUser: (userId: string, updates: Partial<CETACUser>) => void;
  removeUser: (userId: string) => void;
  addRole: (role: string) => void;
  removeRole: (role: string) => void;
  addVertical: (v: Omit<Vertical, 'id' | 'createdAt'>) => void;
  updateVertical: (vId: string, updates: Partial<Vertical>) => void;
  removeVertical: (vId: string) => void;
  playbooks: RolePlaybook[];
  bsPartners: BSPartner[];
  updatePlaybook: (playbookId: string, updates: Partial<RolePlaybook>) => void;
  addPlaybook: (playbook: RolePlaybook) => void;
  updateBSPartner: (partnerId: string, updates: Partial<BSPartner>) => void;
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChatMessages: () => void;
  setAccessOverrides: (next: AccessOverride[]) => void;
  upsertAccessOverride: (memberId: string, patch: Partial<AccessOverride>) => void;
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

// Auto-generate credentials from name. Strip whitespace from the password so
// users can actually type/paste it — most password fields swallow spaces.
function slug(name: string) { return name.toLowerCase().replace(/[^a-z0-9]+/g, ''); }
function makeEmail(name: string) { return `${name.toLowerCase().replace(/\s+/g, '.')}@etacambridge.co.uk`; }
function makePassword(name: string) { return `cetac-${slug(name)}26`; }

// Flag set true while we're writing remote state into the local store. Lets
// the bottom subscriber distinguish "user just edited something" (debounce a
// remote save, suppress the next poll) from "we just merged a remote pull"
// (no save needed; don't suppress polling).
let applyingRemoteState = false;

// Cap the tombstone log so it doesn't grow forever. 500 most-recent deletions
// per collection is plenty to outlive the longest realistic offline window
// while keeping payloads small.
const TOMBSTONE_CAP = 500;
function pushTombstone(log: Record<string, string[]> | undefined, key: string, itemId: string): Record<string, string[]> {
  const current = log?.[key] || [];
  const next = current.includes(itemId) ? current : [...current, itemId];
  const trimmed = next.length > TOMBSTONE_CAP ? next.slice(next.length - TOMBSTONE_CAP) : next;
  return { ...(log || {}), [key]: trimmed };
}

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
  // Exact match first
  if (ROLE_PERMS[role]) return ROLE_PERMS[role];
  
  // Multi-role: split by comma and merge permissions (highest access wins)
  const roles = role.split(',').map(r => r.trim()).filter(Boolean);
  if (roles.length > 1) {
    const merged: Record<string, 'edit' | 'view'> = {};
    for (const r of roles) {
      const p = permsForRole(r);
      for (const [k, v] of Object.entries(p)) {
        if (!merged[k] || v === 'edit') merged[k] = v;
      }
    }
    return merged;
  }
  
  // Smart keyword matching for unknown roles
  const lower = role.toLowerCase();
  if (lower.includes('president') || lower.includes('co-president') || lower.includes('chair') || lower.includes('director')) {
    return ROLE_PERMS['President'] || {};
  }
  if (lower.includes('vp') || lower.includes('vice president') || lower.includes('head of')) {
    // Determine which VP based on keywords
    if (lower.includes('partner') || lower.includes('external') || lower.includes('business dev')) return ROLE_PERMS['VP Partnerships - External'] || ROLE_PERMS['Member'];
    if (lower.includes('comms') || lower.includes('communic') || lower.includes('sponsor') || lower.includes('marketing') || lower.includes('brand')) return ROLE_PERMS['VP Communications & Sponsorship'] || ROLE_PERMS['Member'];
    if (lower.includes('ops') || lower.includes('operation')) return ROLE_PERMS['VP Operations'] || ROLE_PERMS['Member'];
    if (lower.includes('admin') || lower.includes('event')) return ROLE_PERMS['VP Administration & Events'] || ROLE_PERMS['Member'];
    if (lower.includes('community') || lower.includes('social') || lower.includes('engagement')) return ROLE_PERMS['VP Community'] || ROLE_PERMS['Member'];
    // Generic VP: give broad access
    return { dashboard: 'edit', plan: 'edit', calendar: 'edit', tasks: 'edit', events: 'view', crm: 'view', content: 'view', outreach: 'view', team: 'view', kpi: 'view', playbook: 'edit', export: 'view', memberTasks: 'edit' } as any;
  }
  if (lower.includes('treasurer') || lower.includes('finance')) {
    return { dashboard: 'edit', plan: 'view', calendar: 'view', sponsors: 'edit', kpi: 'edit', export: 'edit', settings: 'edit', playbook: 'edit' } as any;
  }
  if (lower.includes('secretary') || lower.includes('clerk')) {
    return { dashboard: 'edit', plan: 'edit', calendar: 'edit', tasks: 'edit', events: 'edit', team: 'view', export: 'edit', import: 'edit', playbook: 'edit' } as any;
  }
  if (lower.includes('intern') || lower.includes('potential') || lower.includes('prospect') || lower.includes('applicant')) {
    return ROLE_PERMS['Potential Member'] || { dashboard: 'view', plan: 'view', calendar: 'view' };
  }
  if (lower.includes('officer') || lower.includes('lead') || lower.includes('manager') || lower.includes('coordinator')) {
    return { dashboard: 'edit', plan: 'view', calendar: 'edit', tasks: 'edit', events: 'view', crm: 'view', content: 'view', outreach: 'view', kpi: 'view', playbook: 'edit', memberTasks: 'edit' } as any;
  }
  
  return ROLE_PERMS['Member'] || { dashboard: 'view', plan: 'view', calendar: 'view', tasks: 'view', events: 'view', chat: 'view', memberTasks: 'view', playbook: 'view' };
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
      chatMessages: [],
      accessOverrides: [],
      _deletedIds: {},
      darkMode: false,
      toggleDarkMode: () => set(s => ({ darkMode: !s.darkMode })),

      login: async (email: string, password: string) => {
        const e = email.trim().toLowerCase();
        const p = password.trim();
        const matches = (u: { email: string; password: string }) =>
          u.email.trim().toLowerCase() === e && u.password.trim() === p;

        const local = get().users.find(matches);
        if (local) { set({ currentUser: local }); return true; }

        // Miss locally — try one fresh remote pull before giving up. This
        // catches the case where another browser created the account very
        // recently and our cached users list is just stale.
        try {
          const remote = await loadRemoteState();
          if (remote) {
            applyingRemoteState = true;
            try {
              const merged = mergeState(get() as any, remote);
              useStore.setState(merged);
            } finally {
              applyingRemoteState = false;
            }
            const refetched = get().users.find(matches);
            if (refetched) { set({ currentUser: refetched }); return true; }
          }
        } catch {}
        console.log('[CETAC login] failed for:', e, '| users:', get().users.map(u => u.email));
        return false;
      },
      logout: () => set({ currentUser: null }),

      add: (key, item) => {
        // Reject team members with blank names
        if (key === 'team' && !(item as any).name?.trim()) return;
        const newId = id();
        // Ensure team members always have status defaulting to 'active'
        const defaults = key === 'team' ? { status: 'active', vertical: '', email: '', phone: '', linkedin: '', responsibilities: '' } : {};
        const newItem = { ...defaults, ...item, id: newId, createdAt: new Date().toISOString() };
        set(s => {
          const updated: any = { [key]: [newItem, ...(s as any)[key]] };
          // Auto-create user account when adding a team member
          if (key === 'team' && (item as any).name) {
            const name = (item as any).name;
            const role = (item as any).role || 'Member';
            // If two members share a first name, append a numeric suffix so each
            // gets a unique login instead of the second one being silently dropped.
            let email = makeEmail(name);
            let suffix = 2;
            while (s.users.find(u => u.email === email)) {
              const base = name.toLowerCase().replace(/\s+/g, '.');
              email = `${base}${suffix}@etacambridge.co.uk`;
              suffix++;
            }
            updated.users = [...s.users, {
              id: id(), email, name, password: makePassword(name) + (suffix > 2 ? String(suffix - 1) : ''),
              role: (role === 'President' ? 'super_admin' : 'team_member') as 'super_admin' | 'team_member',
              permissions: permsForRole(role), teamMemberId: newId,
            }];
            // Auto-generate playbook for this role if one doesn't exist (async, non-blocking)
            if (role && !role.toLowerCase().includes('member')) {
              const hasPlaybook = s.playbooks.some(p => p.role.toLowerCase() === role.toLowerCase());
              if (!hasPlaybook) {
                setTimeout(async () => {
                  try {
                    const { generatePlaybookForRole } = await import('./lib/ai-role');
                    const state = useStore.getState();
                    const pb = await generatePlaybookForRole(role, state.playbooks);
                    pb.holder = name;
                    pb.assignedTo = [name];
                    useStore.getState().addPlaybook(pb);
                  } catch (e) { console.error('Auto playbook gen failed:', e); }
                }, 100);
              }
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
              result.users = (result.users || s.users).map((u: any) => u.teamMemberId === itemId || u.name === oldName ? { ...u, name: newName, email: makeEmail(newName), password: makePassword(newName) } : u);
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
      remove: (key, itemId) => set(s => ({
        [key]: (s as any)[key].filter((i: any) => i.id !== itemId),
        _deletedIds: pushTombstone(s._deletedIds, key, itemId),
      } as any)),
      updateSettings: (upd) => set(s => ({ settings: { ...s.settings, ...upd } })),

      addMemberTask: (task) => set(s => ({ memberTasks: [{ ...task, id: id(), createdAt: new Date().toISOString() }, ...s.memberTasks] })),
      updateMemberTask: (taskId, updates) => set(s => ({ memberTasks: s.memberTasks.map(t => t.id === taskId ? { ...t, ...updates } : t) })),
      removeMemberTask: (taskId) => set(s => ({
        memberTasks: s.memberTasks.filter(t => t.id !== taskId),
        _deletedIds: pushTombstone(s._deletedIds, 'memberTasks', taskId),
      })),
      addUser: (user) => set(s => ({ users: [...s.users, { ...user, id: id() }] })),
      updateUser: (userId, updates) => set(s => ({ users: s.users.map(u => u.id === userId ? { ...u, ...updates } : u) })),
      removeUser: (userId) => set(s => ({
        users: s.users.filter(u => u.id !== userId),
        _deletedIds: pushTombstone(s._deletedIds, 'users', userId),
      })),
      addRole: (role) => set(s => {
        if (s.roles.includes(role)) return {};
        return { roles: [...s.roles, role] };
      }),
      // Roles use the role string itself as the identity. The tombstone log
      // therefore needs the role text, not a uuid.
      removeRole: (role) => set(s => ({
        roles: s.roles.filter(r => r !== role),
        _deletedIds: pushTombstone(s._deletedIds, 'roles', role),
      })),
      addVertical: (v) => set(s => ({ verticals: [...s.verticals, { ...v, id: id(), createdAt: new Date().toISOString() }] })),
      updateVertical: (vId, updates) => set(s => ({ verticals: s.verticals.map(v => v.id === vId ? { ...v, ...updates } : v) })),
      removeVertical: (vId) => set(s => ({
        verticals: s.verticals.filter(v => v.id !== vId),
        _deletedIds: pushTombstone(s._deletedIds, 'verticals', vId),
      })),
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
      addPlaybook: (playbook) => set(s => {
        // Don't add if one with same role already exists
        if (s.playbooks.some(p => p.role.toLowerCase() === playbook.role.toLowerCase())) return {};
        return { playbooks: [...s.playbooks, playbook] };
      }),
      updateBSPartner: (partnerId, updates) => set(s => ({ bsPartners: s.bsPartners.map(p => p.id === partnerId ? { ...p, ...updates } : p) })),

      addChatMessage: (msg) => set(s => {
        const next = [...s.chatMessages, { ...msg, id: id(), timestamp: new Date().toISOString() }];
        // Cap chat history at 500 messages so the synced state stays bounded.
        return { chatMessages: next.length > 500 ? next.slice(next.length - 500) : next };
      }),
      clearChatMessages: () => set({ chatMessages: [] }),

      setAccessOverrides: (next) => set({ accessOverrides: next }),
      upsertAccessOverride: (memberId, patch) => set(s => {
        const idx = s.accessOverrides.findIndex(a => a.memberId === memberId);
        if (idx === -1) {
          return {
            accessOverrides: [
              ...s.accessOverrides,
              { memberId, permissions: [], isAdmin: false, pin: '', ...patch },
            ],
          };
        }
        const next = [...s.accessOverrides];
        next[idx] = { ...next[idx], ...patch };
        return { accessOverrides: next };
      }),
    }),
    {
      name: 'cetac-store',
      partialize: (s) => ({ contacts: s.contacts, team: s.team, tasks: s.tasks, events: s.events, partnerships: s.partnerships, content: s.content, outreach: s.outreach, calendar: s.calendar, settings: s.settings, darkMode: s.darkMode, users: s.users, currentUser: s.currentUser, memberTasks: s.memberTasks, roles: s.roles, verticals: s.verticals, playbooks: s.playbooks, bsPartners: s.bsPartners, resources: (s as any).resources, chatMessages: s.chatMessages, accessOverrides: s.accessOverrides, _deletedIds: s._deletedIds }),
      // Zustand v5 expects `onRehydrateStorage`, which returns a callback invoked
      // after rehydration completes. The previous `onRehydrate` key was silently
      // ignored, so remote state never loaded and `markRemoteLoaded` was never
      // called — meaning saves were also blocked, leaving every browser stuck
      // on its own localStorage.
      onRehydrateStorage: () => () => {
        setTimeout(async () => {
          try {
            applyingRemoteState = true;
            const local = useStore.getState();
            if (!local.playbooks || local.playbooks.length === 0) {
              useStore.setState({ playbooks: DEFAULT_PLAYBOOKS });
            } else {
              const patched = local.playbooks.map((p: any) => p.assignedTo ? p : { ...p, assignedTo: [] });
              if (patched.some((p: any, i: number) => p !== local.playbooks[i])) {
                useStore.setState({ playbooks: patched });
              }
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
            markRemoteLoaded();
            applyingRemoteState = false;
            // Force one immediate save so any local-only data the user
            // accumulated while sync was broken (members added before the
            // sync fix landed) reaches Supabase even if they don't touch
            // anything else this session.
            flushRemoteState(buildSyncPayload(useStore.getState() as any));
            syncTeamRolesToPlaybooks();
            startRemotePolling((remoteState) => {
              applyingRemoteState = true;
              try {
                const merged = mergeState(useStore.getState() as any, remoteState);
                useStore.setState(merged);
              } finally {
                applyingRemoteState = false;
              }
            });
          } catch {
            markRemoteLoaded();
            applyingRemoteState = false;
          }
        }, 500);
      },
    }
  )
);

// Auto-sync team roles → playbooks (runs once on load)
async function syncTeamRolesToPlaybooks() {
  const { team, playbooks, addPlaybook } = useStore.getState();
  const activeTeam = team.filter(m => !m.status || m.status === 'active');
  
  // Get unique roles from team (skip generic "Member" and "Potential Member")
  const teamRoles = [...new Set(activeTeam.map(m => m.role).filter(r => r && !r.toLowerCase().includes('member')))];
  
  // Find roles without a matching playbook (using AI-style fuzzy matching)
  const playbookRoles = playbooks.map(p => p.role.toLowerCase());
  
  for (const role of teamRoles) {
    const roleLower = role.toLowerCase();
    // Check for exact or close match
    const hasMatch = playbookRoles.some(pr => {
      // Exact match
      if (pr === roleLower) return true;
      // One contains the other
      if (pr.includes(roleLower) || roleLower.includes(pr)) return true;
      // Keyword overlap (at least 2 significant words match)
      const roleWords = roleLower.split(/[\s\/&,\-–]+/).filter(w => w.length > 2 && !['and','the','for','lead','vp','vice','president'].includes(w));
      const pbWords = pr.split(/[\s\/&,\-–]+/).filter(w => w.length > 2 && !['and','the','for','lead','vp','vice','president'].includes(w));
      const overlap = roleWords.filter(w => pbWords.some(pw => pw.includes(w) || w.includes(pw)));
      return overlap.length >= 1;
    });
    
    if (!hasMatch) {
      // Auto-generate a playbook for this team role
      try {
        const { generatePlaybookForRole, matchTeamToPlaybook } = await import('./lib/ai-role');
        const pb = await generatePlaybookForRole(role, playbooks);
        // Find the team member(s) with this role
        const membersWithRole = activeTeam.filter(m => m.role === role);
        if (membersWithRole.length > 0) {
          pb.holder = membersWithRole[0].name;
          pb.assignedTo = membersWithRole.map(m => m.name);
        }
        addPlaybook(pb);
      } catch (e) {
        console.error('Auto-sync playbook generation failed for role:', role, e);
      }
    }
  }
}

// Build the slice of state we ship to Supabase. Kept in one place so the
// subscribe-driven save and the post-rehydrate flush stay in lockstep.
function buildSyncPayload(state: any) {
  const { contacts, team, tasks, events, partnerships, content, outreach, calendar, settings, users, memberTasks, roles, verticals, playbooks, bsPartners, chatMessages, accessOverrides, _deletedIds } = state;
  return {
    contacts, team, tasks, events, partnerships, content, outreach, calendar, settings,
    users, memberTasks, roles, verticals, playbooks, bsPartners,
    chatMessages, accessOverrides, _deletedIds,
    resources: state.resources,
  };
}

// Subscribe to changes and sync to remote (debounced).
useStore.subscribe((state) => {
  if (!applyingRemoteState) markUserEdit();
  saveRemoteState(buildSyncPayload(state));
});
