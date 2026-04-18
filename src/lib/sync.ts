// Sync layer: load from Supabase on init, save on changes (debounced)

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let lastSavedJson = '';

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

// Merge remote state with local state (remote wins for arrays, local wins for scalars)
export function mergeState(local: Record<string, any>, remote: Record<string, any>): Record<string, any> {
  const merged: Record<string, any> = { ...local };
  
  // For each collection, use whichever has more items (simple heuristic)
  // In production you'd use timestamps per-item
  const collections = ['contacts', 'team', 'tasks', 'events', 'partnerships', 'content', 'outreach', 'calendar', 'users', 'memberTasks'];
  
  for (const key of collections) {
    if (remote[key] && Array.isArray(remote[key])) {
      if (!local[key] || remote[key].length > local[key].length) {
        merged[key] = remote[key];
      } else {
        // Merge: combine unique items by id
        const localIds = new Set((local[key] as any[]).map(i => i.id));
        const remoteOnly = (remote[key] as any[]).filter(i => !localIds.has(i.id));
        merged[key] = [...local[key], ...remoteOnly];
      }
    }
  }
  
  // Settings: merge
  if (remote.settings) merged.settings = { ...local.settings, ...remote.settings };
  
  return merged;
}
