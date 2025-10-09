import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Return all cookies the server sees for quick debugging
  try {
    return res.status(200).json({ cookies: req.cookies || {}, headers: req.headers['cookie'] || null });
  } catch (err) {
    return res.status(500).json({ error: 'failed to read cookies', details: String(err) });
  }
}
