const SB_URL = 'https://ankwzeyreaisahdubwlt.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const BUCKET = 'cetac';
const FILE = 'state.json';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const headers: Record<string, string> = {
    'apikey': SB_KEY,
    'Authorization': `Bearer ${SB_KEY}`,
  };

  if (req.method === 'GET') {
    try {
      const r = await fetch(`${SB_URL}/storage/v1/object/public/${BUCKET}/${FILE}`);
      if (!r.ok) return res.json({ state: null });
      const state = await r.json();
      return res.json({ state });
    } catch (e: any) {
      return res.json({ state: null, error: e.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = JSON.stringify(req.body);
      // Upsert: PUT to overwrite existing
      const r = await fetch(`${SB_URL}/storage/v1/object/${BUCKET}/${FILE}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body,
      });
      if (!r.ok) {
        const r2 = await fetch(`${SB_URL}/storage/v1/object/${BUCKET}/${FILE}`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body,
        });
        if (!r2.ok) {
          const err = await r2.text();
          return res.status(500).json({ error: err });
        }
      }
      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
