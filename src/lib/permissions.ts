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
 * Get the allowed module keys for a user. Permission sources, in order:
 *   1. super_admin → full access
 *   2. accessOverrides from the synced store (set in TeamPortal)
 *   3. Role preset based on the linked team member's role
 *   4. Fallback: Member preset
 *
 * `accessOverrides` is read from the Zustand store and passed in by callers
 * so this function stays a pure helper and the override is shared across all
 * browsers via the same Supabase sync as the rest of the app state.
 */
export function getUserModules(
  user: { id: string; role: string; teamMemberId?: string; name: string },
  teamMembers: { id: string; role: string }[],
  accessOverrides: { memberId: string; permissions: string[] }[] = [],
): string[] {
  if (user.role === 'super_admin') return Object.keys(MODULE_ROUTES);

  if (user.teamMemberId) {
    const match = accessOverrides.find(a => a.memberId === user.teamMemberId);
    if (match && match.permissions.length > 0) return match.permissions;
  }

  if (user.teamMemberId) {
    const member = teamMembers.find(m => m.id === user.teamMemberId);
    if (member?.role && ROLE_PRESETS[member.role]) return ROLE_PRESETS[member.role];
  }

  return ROLE_PRESETS['Member'] || ['dashboard', 'plan', 'calendar'];
}

export function canAccessRoute(path: string, allowedModules: string[]): boolean {
  const moduleKey = ROUTE_MODULES[path];
  if (!moduleKey) return true; // Unknown routes are allowed
  return allowedModules.includes(moduleKey);
}

/**
 * AI-style auto-assign: given a role string, determine which modules they should access.
 * Uses keyword matching (no API call needed).
 */
export function autoModulesForRole(role: string): string[] {
  // Check presets first
  const roles = role.split(',').map(r => r.trim()).filter(Boolean);
  const allModules = new Set<string>();
  
  for (const r of roles) {
    if (ROLE_PRESETS[r]) {
      ROLE_PRESETS[r].forEach(m => allModules.add(m));
      continue;
    }
    
    const lower = r.toLowerCase();
    
    if (lower.includes('president') || lower.includes('co-president') || lower.includes('chair') || lower.includes('director')) {
      Object.keys(MODULE_ROUTES).forEach(m => allModules.add(m));
      continue;
    }
    
    // Always give basics
    ['dashboard', 'plan', 'calendar', 'playbook', 'resources'].forEach(m => allModules.add(m));
    
    if (lower.includes('vp') || lower.includes('vice president') || lower.includes('head of')) {
      ['tasks', 'events', 'team', 'kpi', 'memberTasks', 'export'].forEach(m => allModules.add(m));
      if (lower.includes('partner') || lower.includes('external') || lower.includes('business')) ['partnerships', 'sponsors', 'crm', 'outreach', 'templates', 'searchDay'].forEach(m => allModules.add(m));
      if (lower.includes('comms') || lower.includes('communic') || lower.includes('marketing') || lower.includes('brand') || lower.includes('sponsor')) ['content', 'outreach', 'templates', 'crm', 'sponsors'].forEach(m => allModules.add(m));
      if (lower.includes('ops') || lower.includes('operation')) ['tasks', 'events', 'roles', 'teamPortal', 'import'].forEach(m => allModules.add(m));
      if (lower.includes('admin') || lower.includes('event')) ['events', 'searchDay', 'tasks'].forEach(m => allModules.add(m));
      if (lower.includes('community') || lower.includes('social')) ['crm', 'content', 'outreach', 'templates'].forEach(m => allModules.add(m));
      continue;
    }
    
    if (lower.includes('treasurer') || lower.includes('finance')) {
      ['sponsors', 'kpi', 'export', 'settings'].forEach(m => allModules.add(m));
      continue;
    }
    if (lower.includes('secretary') || lower.includes('clerk')) {
      ['tasks', 'events', 'team', 'export', 'import'].forEach(m => allModules.add(m));
      continue;
    }
    if (lower.includes('officer') || lower.includes('lead') || lower.includes('manager') || lower.includes('coordinator')) {
      ['tasks', 'events', 'crm', 'content', 'outreach', 'kpi', 'memberTasks'].forEach(m => allModules.add(m));
      continue;
    }
    if (lower.includes('intern') || lower.includes('potential') || lower.includes('prospect')) {
      // Just basics (already added above)
      continue;
    }
    
    // Default member
    ['tasks', 'events', 'chat', 'memberTasks'].forEach(m => allModules.add(m));
  }
  
  return [...allModules];
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
