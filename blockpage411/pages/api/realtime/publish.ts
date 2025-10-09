import type { NextApiRequest, NextApiResponse } from 'next';

const ABLY_API_KEY = process.env.ABLY_API_KEY; // secret key (set in Vercel)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!ABLY_API_KEY) return res.status(500).json({ error: 'Missing ABLY_API_KEY' });

  const { channel = 'transactions', event = 'tx', data } = req.body;

  try {
    const url = `https://rest.ably.io/channels/${encodeURIComponent(channel)}/messages`;
    const body = [{ name: event, data }];
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(ABLY_API_KEY).toString('base64'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const txt = await resp.text();
      return res.status(500).json({ error: 'Ably publish failed', detail: txt });
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('publish error', err);
    res.status(500).json({ error: 'publish error' });
  }
}
