import type { NextApiRequest, NextApiResponse } from 'next';
import { createAblyTokenRequest } from '../../../lib/ably';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const start = Date.now();
    // If Ably isn't configured, return a 503 with helpful guidance
    if (!process.env.ABLY_API_KEY) {
      return res.status(503).json({ error: 'Realtime not configured (ABLY_API_KEY missing)' });
    }
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
    // surface a diagnostic message but avoid leaking secret content
    const message = (err as Error)?.message || 'Failed to create Ably token';
    res.status(500).json({ error: message });
  }
}
