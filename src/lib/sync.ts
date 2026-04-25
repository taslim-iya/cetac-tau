// Sync layer: load from Supabase on init, save on changes (debounced),
// and poll the remote so other browsers' edits show up without a reload.

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let lastSavedJson = '';
let remoteLoaded = false; // Don't save until we've loaded remote state first
let lastUserEditAt = 0;
let lastSavedAt = 0;
let pollTimer: ReturnType<typeof setInterval> | null = null;

// Bundle a public secret at build time so the API can reject anonymous
// requests. It's still extractable from the JS bundle, so this is "lock the
// front door" hardening — proper auth would need Supabase Auth or similar.
const SYNC_SECRET = (import.meta as any).env?.VITE_SYNC_SECRET || '';

const ID_COLLECTIONS = [
  'contacts', 'team', 'tasks', 'events', 'partnerships', 'content', 'outreach',
  'calendar', 'users', 'memberTasks', 'verticals', 'playbooks', 'bsPartners',
  'chatMessages', 'accessOverrides',
];
const SCALAR_LIST_COLLECTIONS = ['roles']; // arrays of strings — string is the identity

export function markRemoteLoaded() { remoteLoaded = true; }
export function isRemoteLoaded() { return remoteLoaded; }
export function markUserEdit() { lastUserEditAt = Date.now(); }

function authHeaders(): Record<string, string> {
  return SYNC_SECRET ? { Authorization: `Bearer ${SYNC_SECRET}` } : {};
}

export async function loadRemoteState(): Promise<Record<string, any> | null> {
  try {
    const r = await fetch('/api/sync', { headers: authHeaders() });
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
    saveTimeout = null;
    try {
      lastSavedJson = json;
      lastSavedAt = Date.now();
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: json,
      });
    } catch {
      // Silent fail — localStorage is the fallback
    }
  }, 2000);
}

// Push the supplied state to the remote immediately, no debounce. Use this
// after the very first rehydrate so any local-only data accumulated while
// sync was broken (the original "members can't see each other's edits" bug)
// gets uploaded without waiting for the user to make another change.
export async function flushRemoteState(state: Record<string, any>): Promise<void> {
  if (!remoteLoaded) return;
  const json = JSON.stringify(state);
  if (json === lastSavedJson) return;
  if (saveTimeout) { clearTimeout(saveTimeout); saveTimeout = null; }
  try {
    lastSavedJson = json;
    lastSavedAt = Date.now();
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: json,
    });
  } catch {
    // localStorage is the fallback
  }
}

// Merge a remote state snapshot into our local state.
//
// Strategy per collection (anything keyed by `id`): union by id. When the same
// id exists on both sides, prefer the remote copy — it's the most recently
// agreed shared state. Anything in either side's `_deletedIds[col]` tombstone
// log is removed from the result, which lets deletions actually replicate
// across browsers (the previous behaviour of "if local still has it, keep it"
// silently undid every delete).
export function mergeState(local: Record<string, any>, remote: Record<string, any>): Record<string, any> {
  if (!remote || typeof remote !== 'object') return local;
  const merged: Record<string, any> = { ...local };

  const localTomb = (local._deletedIds || {}) as Record<string, string[]>;
  const remoteTomb = (remote._deletedIds || {}) as Record<string, string[]>;
  const mergedTomb: Record<string, string[]> = {};
  const tombKeys = new Set([...Object.keys(localTomb), ...Object.keys(remoteTomb)]);
  for (const k of tombKeys) {
    const set = new Set([...(localTomb[k] || []), ...(remoteTomb[k] || [])]);
    mergedTomb[k] = [...set];
  }
  merged._deletedIds = mergedTomb;

  for (const key of ID_COLLECTIONS) {
    const localItems = Array.isArray(local[key]) ? local[key] : [];
    const remoteItems = Array.isArray(remote[key]) ? remote[key] : null;
    if (remoteItems === null) {
      merged[key] = localItems;
      continue;
    }
    const tomb = new Set(mergedTomb[key] || []);
    const byId = new Map<string, any>();
    for (const item of localItems) {
      if (item && item.id && !tomb.has(item.id)) byId.set(item.id, item);
    }
    // Remote wins on collision (it's the agreed shared state).
    for (const item of remoteItems) {
      if (item && item.id && !tomb.has(item.id)) byId.set(item.id, item);
    }
    merged[key] = [...byId.values()];
  }

  for (const key of SCALAR_LIST_COLLECTIONS) {
    const localItems = Array.isArray(local[key]) ? local[key] : [];
    const remoteItems = Array.isArray(remote[key]) ? remote[key] : null;
    if (remoteItems === null) { merged[key] = localItems; continue; }
    const tomb = new Set(mergedTomb[key] || []);
    const seen = new Set<string>();
    const out: string[] = [];
    for (const v of [...localItems, ...remoteItems]) {
      if (typeof v !== 'string' || tomb.has(v) || seen.has(v)) continue;
      seen.add(v);
      out.push(v);
    }
    merged[key] = out;
  }

  if (remote.settings) merged.settings = { ...local.settings, ...remote.settings };
  if (remote.darkMode !== undefined) merged.darkMode = remote.darkMode;
  // currentUser is always per-browser — never inherit it from remote.
  delete merged.currentUser;
  if (local.currentUser) merged.currentUser = local.currentUser;

  return merged;
}

// Periodically pull remote state so other browsers' edits show up without a
// manual reload. Skipped while the user is actively editing or while a save is
// in flight, so a poll never clobbers in-progress local changes.
export function startRemotePolling(onMerged: (remote: Record<string, any>) => void, intervalMs = 15000) {
  if (pollTimer) return;
  pollTimer = setInterval(async () => {
    if (!remoteLoaded) return;
    const now = Date.now();
    if (saveTimeout) return;
    if (now - lastUserEditAt < 5000) return;
    if (now - lastSavedAt < 3000) return;
    const remote = await loadRemoteState();
    if (!remote) return;
    onMerged(remote);
  }, intervalMs);
}

export function stopRemotePolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}
