const SB_URL = 'https://ankwzeyreaisahdubwlt.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const BUCKET = 'cetac';
const FILE = 'state.json';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const headers = {
    'apikey': SB_KEY,
    'Authorization': 'Bearer ' + SB_KEY,
  };

  if (req.method === 'GET') {
    try {
      const r = await fetch(SB_URL + '/storage/v1/object/public/' + BUCKET + '/' + FILE);
      if (!r.ok) return res.json({ state: null });
      const state = await r.json();
      return res.json({ state });
    } catch (e) {
      return res.json({ state: null, error: String(e) });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = JSON.stringify(req.body);
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
