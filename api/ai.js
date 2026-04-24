const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { messages, prompt, model, temperature, max_tokens, apiKey } = req.body || {};
  const key = apiKey || OPENAI_KEY;
  if (!key) return res.status(500).json({ error: 'No API key configured' });

  // Support both `messages` array and single `prompt` string
  const msgs = messages || (prompt ? [{ role: 'user', content: prompt }] : null);
  if (!msgs) return res.status(400).json({ error: 'messages or prompt required' });

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify({
        model: model || 'gpt-4o',
        messages: msgs,
        temperature: temperature || 0.3,
        max_tokens: max_tokens || 4000,
      }),
    });
    const data = await r.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
};
