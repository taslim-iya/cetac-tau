export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { prompt, apiKey } = req.body || {};
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) return res.status(400).json({ error: 'No API key' });

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 4000,
      }),
    });
    const data = await r.json();
    return res.status(200).json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
