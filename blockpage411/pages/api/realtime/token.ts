import type { NextApiRequest, NextApiResponse } from 'next';
import { createAblyTokenRequest } from '../../../lib/ably';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const tokenRequest = await createAblyTokenRequest(3600);
    res.status(200).json(tokenRequest);
  } catch (err) {
    console.error('token error', err);
    res.status(500).json({ error: 'Failed to create token' });
  }
}
