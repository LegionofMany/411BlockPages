import type { NextApiRequest, NextApiResponse } from 'next';
import { createAblyTokenRequest } from '../../../lib/ably';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
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
    res.status(500).json({ error: 'Failed to create token' });
  }
}
