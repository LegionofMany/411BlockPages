import type { NextApiRequest, NextApiResponse } from 'next';

// Retired endpoint: social confirm is now handled by admins via the admin-review flow.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(410).json({ ok: false, message: 'This endpoint is retired. Use admin review via /api/verify/social/request-simple and the admin KYC UI.' });
}
