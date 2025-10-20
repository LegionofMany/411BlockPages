import type { NextApiRequest, NextApiResponse } from 'next';
import { createAblyTokenRequest } from '../../../lib/ably';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  // quick guard for config issues — avoid calling into Ably SDK when obviously misconfigured
  const key = process.env.ABLY_API_KEY;
  if (!key || !key.includes(':')) {
    return res.status(503).json({ error: 'Realtime not configured (ABLY_API_KEY missing or malformed). Set ABLY_API_KEY in .env.local or Vercel env vars.' });
  }

  try {
    const start = Date.now();
    const tokenRequest = await createAblyTokenRequest(3600);
    const elapsed = Date.now() - start;
    // add a header so browser-network tools can see server-side elapsed time
    res.setHeader('x-token-ms', String(elapsed));
    // include server timestamp to aid debugging
    const payload = { serverTimestamp: Date.now(), elapsedMs: elapsed, tokenRequest };
    const tokenReqRecord = tokenRequest as Record<string, unknown> | undefined;
    console.debug('[/api/realtime/token] created token', { elapsed, tokenRequestSummary: { keyName: tokenReqRecord?.['keyName'] } });
    res.status(200).json(payload);
  } catch (err) {
    console.error('token error', err);
    // If Ably is temporarily unavailable, return 503 so a caller can retry later
    const message = (err as Error)?.message || 'Failed to create Ably token';
    if (message.toLowerCase().includes('unavailable') || message.toLowerCase().includes('missing or invalid')) {
      return res.status(503).json({ error: message });
    }
    res.status(500).json({ error: message });
  }
}
