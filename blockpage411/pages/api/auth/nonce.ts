import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import User from 'lib/userModel';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET as string;

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const { address } = req.body;
  if (!address) {
    return res.status(400).json({ message: 'Address required' });
  }
  const nonce = randomBytes(16).toString('hex');
  const now = new Date();

  // Always set a short-lived, HttpOnly nonce cookie so auth can proceed even when
  // MongoDB is temporarily unreachable (common in dev networks that block SRV DNS).
  // The cookie value is a signed JWT so it can't be tampered with client-side.
  if (!JWT_SECRET) {
    return res.status(500).json({ message: 'Server misconfigured: missing JWT_SECRET' });
  }
  const nonceToken = jwt.sign({ address, nonce }, JWT_SECRET, { expiresIn: '5m' });
  const isProd = process.env.NODE_ENV === 'production';
  const cookieDomain = isProd ? inferCookieDomain(req) : undefined;
  const nonceCookie = serialize('login_nonce', nonceToken, {
    httpOnly: true,
    path: '/',
    secure: isProd,
    sameSite: 'lax',
    domain: cookieDomain,
    maxAge: 60 * 5,
  });
  res.setHeader('Set-Cookie', nonceCookie);

  // Respond immediately so the UI doesn't get stuck on "Verifying..." during
  // transient Mongo connectivity issues or cold starts.
  res.status(200).json({ nonce });

  // Best-effort persistence to MongoDB (kept for compatibility/auditability).
  // IMPORTANT: do not await; we don't want to block the response.
  setTimeout(() => {
    void (async () => {
      try {
        await dbConnect();
        let user = await User.findOne({ address });
        if (!user) {
          await User.create({ address, nonce, nonceCreatedAt: now });
        } else {
          user.nonce = nonce;
          user.nonceCreatedAt = now;
          await user.save();
        }
      } catch (e) {
        const code = (e as any)?.code;
        if (code !== 'MONGODB_DISABLED' && code !== 'MONGODB_URI_MISSING') {
          console.warn(
            'AUTH NONCE: DB unavailable; proceeding with cookie-based nonce.',
            (e as any)?.message || e
          );
        }
      }
    })();
  }, 0);
}
