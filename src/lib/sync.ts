// Sync layer: load from Supabase on init, save on changes (debounced)

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let lastSavedJson = '';
let remoteLoaded = false; // Don't save until we've loaded remote state first

export function markRemoteLoaded() { remoteLoaded = true; }
export function isRemoteLoaded() { return remoteLoaded; }

export async function loadRemoteState(): Promise<Record<string, any> | null> {
  try {
    const r = await fetch('/api/sync');
    if (!r.ok) return null;
    const { state } = await r.json();
    return state;
  } catch {
    return null;
  }
}

export function saveRemoteState(state: Record<string, any>) {
  if (!remoteLoaded) return; // Don't push local defaults before we've loaded remote
  const json = JSON.stringify(state);
  if (json === lastSavedJson) return; // No changes
  
  // Debounce: save 2 seconds after last change
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      lastSavedJson = json;
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: json,
      });
    } catch {
      // Silent fail — localStorage is the fallback
    }
  }, 2000);
}

// Merge remote state with local state
// REMOTE WINS for all collections — this is the shared source of truth
export function mergeState(local: Record<string, any>, remote: Record<string, any>): Record<string, any> {
  const merged: Record<string, any> = { ...local };
  
  const collections = ['contacts', 'team', 'tasks', 'events', 'partnerships', 'content', 'outreach', 'calendar', 'users', 'memberTasks', 'roles', 'verticals', 'playbooks', 'bsPartners'];
  
  for (const key of collections) {
    if (remote[key] && Array.isArray(remote[key]) && remote[key].length > 0) {
      // Remote wins — it's the shared state from Supabase
      merged[key] = remote[key];
    }
  }
  
  // Settings: remote wins
  if (remote.settings) merged.settings = { ...local.settings, ...remote.settings };
  // Scalar values
  if (remote.darkMode !== undefined) merged.darkMode = remote.darkMode;
  
  return merged;
}
