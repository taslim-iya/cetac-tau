// Module key → route path mapping
export const MODULE_ROUTES: Record<string, string> = {
  dashboard: '/',
  plan: '/plan',
  calendar: '/calendar',
  tasks: '/tasks',
  events: '/events',
  partnerships: '/partnerships',
  sponsors: '/sponsors',
  crm: '/crm',
  roles: '/roles',
  content: '/content',
  outreach: '/outreach',
  memberTasks: '/member-tasks',
  kpi: '/kpi',
  templates: '/templates',
  searchDay: '/search-day',
  chat: '/chat',
  import: '/import',
  export: '/export',
  settings: '/settings',
  teamPortal: '/team-portal',
  team: '/team',
  playbook: '/playbook',
  resources: '/resources',
};

// Reverse: route path → module key
export const ROUTE_MODULES: Record<string, string> = Object.fromEntries(
  Object.entries(MODULE_ROUTES).map(([k, v]) => [v, k])
);

// Role → allowed module keys
export const ROLE_PRESETS: Record<string, string[]> = {
  'President': Object.keys(MODULE_ROUTES),
  'VP Partnerships — External': ['dashboard', 'plan', 'calendar', 'partnerships', 'sponsors', 'crm', 'outreach', 'templates', 'searchDay', 'export', 'team', 'kpi', 'playbook'],
  'VP Communications & Sponsorship': ['dashboard', 'plan', 'calendar', 'content', 'outreach', 'templates', 'crm', 'sponsors', 'export', 'team', 'kpi', 'playbook'],
  'VP Operations': ['dashboard', 'plan', 'calendar', 'tasks', 'events', 'roles', 'teamPortal', 'export', 'import', 'team', 'kpi', 'memberTasks', 'playbook'],
  'VP Administration & Events': ['dashboard', 'plan', 'calendar', 'events', 'searchDay', 'tasks', 'export', 'team', 'kpi', 'playbook'],
  'VP Community': ['dashboard', 'plan', 'calendar', 'crm', 'content', 'outreach', 'templates', 'team', 'kpi', 'playbook'],
  'Member': ['resources', 'dashboard', 'plan', 'calendar', 'tasks', 'events', 'chat', 'memberTasks', 'playbook'],
  'Potential Member': ['resources', 'dashboard', 'plan', 'calendar'],
};

/**
 * Get the allowed module keys for a user.
 * super_admin always gets full access.
 * team_member gets permissions from:
 *   1. cetac-access localStorage (if customised in TeamPortal)
 *   2. Role preset based on linked team member's role
 *   3. Fallback: Member preset
 */
export function getUserModules(user: { id: string; role: string; teamMemberId?: string; name: string }, teamMembers: { id: string; role: string }[]): string[] {
  // Super admin = full access
  if (user.role === 'super_admin') return Object.keys(MODULE_ROUTES);

  // Check TeamPortal custom permissions (cetac-access)
  try {
    const saved = localStorage.getItem('cetac-access');
    if (saved) {
      const accessList: { memberId: string; permissions: string[] }[] = JSON.parse(saved);
      // Match by teamMemberId or find by scanning
      const match = user.teamMemberId
        ? accessList.find(a => a.memberId === user.teamMemberId)
        : null;
      if (match && match.permissions.length > 0) return match.permissions;
    }
  } catch {}

  // Fall back to role preset from linked team member
  if (user.teamMemberId) {
    const member = teamMembers.find(m => m.id === user.teamMemberId);
    if (member?.role && ROLE_PRESETS[member.role]) return ROLE_PRESETS[member.role];
  }

  // Fallback: Member preset
  return ROLE_PRESETS['Member'] || ['dashboard', 'plan', 'calendar'];
}

export function canAccessRoute(path: string, allowedModules: string[]): boolean {
  const moduleKey = ROUTE_MODULES[path];
  if (!moduleKey) return true; // Unknown routes are allowed
  return allowedModules.includes(moduleKey);
}

export function canAccessPath(path: string, allowedModules: string[]): boolean {
  // Check exact match first
  if (ROUTE_MODULES[path] !== undefined) {
    return allowedModules.includes(ROUTE_MODULES[path]);
  }
  // For paths like /team-portal, check if starts with known route
  for (const [route, mod] of Object.entries(ROUTE_MODULES)) {
    if (route !== '/' && path.startsWith(route)) {
      return allowedModules.includes(mod);
    }
  }
  return true;
}
