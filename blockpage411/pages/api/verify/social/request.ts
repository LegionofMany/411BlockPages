import type { NextApiRequest, NextApiResponse } from 'next';

// This endpoint has been retired in favor of the simpler admin-review flow.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(410).json({ ok: false, message: 'This endpoint has been retired. Use /api/verify/social/request-simple to request admin review.' });
}
