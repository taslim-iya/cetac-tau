const SB_URL = 'https://ankwzeyreaisahdubwlt.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const BUCKET = 'cetac';
const FILE = 'state.json';

// Optional shared secret. When set, every request must include
// `Authorization: Bearer <SYNC_SECRET>` — this stops drive-by anonymous reads
// and writes against this Supabase service-role-backed endpoint. The client
// reads the same value from VITE_SYNC_SECRET at build time. It is not strong
// auth (anyone with the JS bundle can extract it) but it removes "literally
// open to the internet".
const SYNC_SECRET = process.env.SYNC_SECRET || '';

const ID_COLLECTIONS = [
  'contacts', 'team', 'tasks', 'events', 'partnerships', 'content', 'outreach',
  'calendar', 'users', 'memberTasks', 'verticals', 'playbooks', 'bsPartners',
  'chatMessages', 'accessOverrides',
];
const SCALAR_LIST_COLLECTIONS = ['roles'];
const SCALAR_FIELDS = ['settings', 'darkMode', 'resources'];
const TOMBSTONE_CAP = 1000;

function isAuthorized(req) {
  if (!SYNC_SECRET) return true;
  const header = req.headers['authorization'] || req.headers['Authorization'] || '';
  const provided = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : '';
  return provided === SYNC_SECRET;
}

// Server-side merge: union by id, last-writer-wins per item, and respect the
// `_deletedIds` tombstone log so deletions actually replicate. Without this,
// two clients PUTting the full state seconds apart would silently clobber
// each other's adds.
function mergeStates(current, incoming) {
  if (!current || typeof current !== 'object') return incoming;
  if (!incoming || typeof incoming !== 'object') return current;

  const out = { ...current, ...incoming };

  const curTomb = (current._deletedIds && typeof current._deletedIds === 'object') ? current._deletedIds : {};
  const incTomb = (incoming._deletedIds && typeof incoming._deletedIds === 'object') ? incoming._deletedIds : {};
  const mergedTomb = {};
  const tombKeys = new Set([...Object.keys(curTomb), ...Object.keys(incTomb)]);
  for (const k of tombKeys) {
    const set = new Set([...(curTomb[k] || []), ...(incTomb[k] || [])]);
    const list = [...set];
    mergedTomb[k] = list.length > TOMBSTONE_CAP ? list.slice(list.length - TOMBSTONE_CAP) : list;
  }
  out._deletedIds = mergedTomb;

  for (const key of ID_COLLECTIONS) {
    const cur = Array.isArray(current[key]) ? current[key] : [];
    const inc = Array.isArray(incoming[key]) ? incoming[key] : null;
    const tomb = new Set(mergedTomb[key] || []);
    const byId = new Map();
    // current first
    for (const item of cur) {
      if (item && item.id && !tomb.has(item.id)) byId.set(item.id, item);
    }
    // incoming wins on collision
    if (inc) {
      for (const item of inc) {
        if (item && item.id && !tomb.has(item.id)) byId.set(item.id, item);
      }
    }
    out[key] = [...byId.values()];
  }

  for (const key of SCALAR_LIST_COLLECTIONS) {
    const cur = Array.isArray(current[key]) ? current[key] : [];
    const inc = Array.isArray(incoming[key]) ? incoming[key] : null;
    const tomb = new Set(mergedTomb[key] || []);
    const seen = new Set();
    const list = [];
    for (const v of [...cur, ...(inc || [])]) {
      if (typeof v !== 'string' || tomb.has(v) || seen.has(v)) continue;
      seen.add(v);
      list.push(v);
    }
    out[key] = list;
  }

  for (const f of SCALAR_FIELDS) {
    if (incoming[f] !== undefined) out[f] = incoming[f];
    else if (current[f] !== undefined) out[f] = current[f];
  }

  return out;
}

async function fetchCurrent(headers) {
  try {
    const r = await fetch(SB_URL + '/storage/v1/object/' + BUCKET + '/' + FILE, { headers });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const headers = {
    'apikey': SB_KEY,
    'Authorization': 'Bearer ' + SB_KEY,
  };

  if (req.method === 'GET') {
    const state = await fetchCurrent(headers);
    return res.json({ state: state });
  }

  if (req.method === 'POST') {
    try {
      const incoming = req.body && typeof req.body === 'object' ? req.body : null;
      if (!incoming) return res.status(400).json({ error: 'Invalid body' });
      const current = await fetchCurrent(headers);
      const merged = mergeStates(current, incoming);
      const body = JSON.stringify(merged);
      const r = await fetch(SB_URL + '/storage/v1/object/' + BUCKET + '/' + FILE, {
        method: 'PUT',
        headers: Object.assign({}, headers, { 'Content-Type': 'application/json' }),
        body: body,
      });
      if (!r.ok) {
        const r2 = await fetch(SB_URL + '/storage/v1/object/' + BUCKET + '/' + FILE, {
          method: 'POST',
          headers: Object.assign({}, headers, { 'Content-Type': 'application/json' }),
          body: body,
        });
        if (!r2.ok) {
          const err = await r2.text();
          return res.status(500).json({ error: err });
        }
      }
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: String(e) });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
