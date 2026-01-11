import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Vary', 'Cookie');
  const isProd = process.env.NODE_ENV === 'production';
  const serialized = serialize('token', '', {
    httpOnly: true,
    path: '/',
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 0,
  });
  res.setHeader('Set-Cookie', serialized);
  res.status(200).json({ success: true });
}
