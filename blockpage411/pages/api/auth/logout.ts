import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

function inferCookieDomain(req: NextApiRequest): string | undefined {
  const explicit = process.env.COOKIE_DOMAIN;
  if (explicit) return explicit;

  const hostHeader = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim().toLowerCase();
  const host = hostHeader.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1' || host === '[::1]') return undefined;
  if (host.endsWith('.vercel.app')) return undefined;
  if (host === 'blockpages411.com' || host === 'www.blockpages411.com' || host.endsWith('.blockpages411.com')) {
    return '.blockpages411.com';
  }
  return undefined;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Vary', 'Cookie');
  const isProd = process.env.NODE_ENV === 'production';
  const cookieDomain = isProd ? inferCookieDomain(req) : undefined;
  const serialized = serialize('token', '', {
    httpOnly: true,
    path: '/',
    secure: isProd,
    sameSite: 'lax',
    domain: cookieDomain,
    maxAge: 0,
  });
  res.setHeader('Set-Cookie', serialized);
  res.status(200).json({ success: true });
}
