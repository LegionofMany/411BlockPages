import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import User from 'lib/userModel';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import { verifyMessage } from 'ethers';

const JWT_SECRET = process.env.JWT_SECRET as string;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Avoid logging signatures or other sensitive fields.
  console.log('AUTH VERIFY: method', req.method, 'address', (req.body as any)?.address);
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const { address, signature } = req.body;
  if (!address || !signature) {
    return res.status(400).json({ message: 'Address and signature required' });
  }

  if (!JWT_SECRET) {
    return res.status(500).json({ message: 'Server misconfigured: missing JWT_SECRET' });
  }

  const isProd = process.env.NODE_ENV === 'production';
  const clearNonceCookie = serialize('login_nonce', '', {
    httpOnly: true,
    path: '/',
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 0,
  });

  // Prefer DB-backed nonce when available; fall back to cookie-backed nonce.
  let nonceFromDb: string | null = null;
  let nonceCreatedAtFromDb: Date | null = null;
  let dbAvailable = false;

  try {
    await dbConnect();
    dbAvailable = true;
    const user = await User.findOne({ address });
    if (user) {
      nonceFromDb = user.nonce;
      nonceCreatedAtFromDb = new Date(user.nonceCreatedAt);
    }
  } catch (e) {
    dbAvailable = false;
    const code = (e as any)?.code;
    if (code !== 'MONGODB_DISABLED' && code !== 'MONGODB_URI_MISSING') {
      console.warn('AUTH VERIFY: DB unavailable; attempting cookie-based nonce.', (e as any)?.message || e);
    }
  }

  let nonceToUse: string | null = null;
  let nonceIssuedAt: Date | null = null;

  if (nonceFromDb && nonceCreatedAtFromDb) {
    nonceToUse = nonceFromDb;
    nonceIssuedAt = nonceCreatedAtFromDb;
  } else {
    const cookieToken = req.cookies?.login_nonce;
    if (!cookieToken) {
      res.setHeader('Set-Cookie', clearNonceCookie);
      return res.status(400).json({ message: 'Missing login nonce. Refresh and try again.' });
    }
    try {
      const payload = jwt.verify(cookieToken, JWT_SECRET) as any;
      const cookieAddress = String(payload?.address || '');
      const cookieNonce = String(payload?.nonce || '');
      if (!cookieAddress || !cookieNonce) {
        res.setHeader('Set-Cookie', clearNonceCookie);
        return res.status(400).json({ message: 'Invalid nonce cookie. Refresh and try again.' });
      }
      if (cookieAddress.toLowerCase() !== String(address).toLowerCase()) {
        res.setHeader('Set-Cookie', clearNonceCookie);
        return res.status(400).json({ message: 'Nonce does not match address. Refresh and try again.' });
      }
      nonceToUse = cookieNonce;
      // jwt.verify already enforces expiry; we keep nonceIssuedAt null here.
    } catch {
      res.setHeader('Set-Cookie', clearNonceCookie);
      return res.status(400).json({ message: 'Nonce expired. Please request a new nonce.' });
    }
  }

  // Check nonce expiry (5 min) only for DB-backed nonce where we have a timestamp.
  if (nonceIssuedAt) {
    const now = new Date();
    if (now.getTime() - nonceIssuedAt.getTime() > 5 * 60 * 1000) {
      res.setHeader('Set-Cookie', clearNonceCookie);
      return res.status(400).json({ message: 'Nonce expired' });
    }
  }

  const message = `Login nonce: ${nonceToUse}`;
  let recovered;
  try {
    recovered = verifyMessage(message, signature);
  } catch {
    res.setHeader('Set-Cookie', clearNonceCookie);
    return res.status(400).json({ message: 'Invalid signature' });
  }
  if (String(recovered).toLowerCase() !== String(address).toLowerCase()) {
    res.setHeader('Set-Cookie', clearNonceCookie);
    return res.status(400).json({ message: 'Signature does not match address' });
  }

  // If DB is available but user doesn't exist yet (cookie-flow), create them now.
  if (dbAvailable) {
    try {
      const now = new Date();
      const existing = await User.findOne({ address });
      if (!existing) {
        await User.create({ address, nonce: '', nonceCreatedAt: now });
      }
    } catch (e) {
      console.warn('AUTH VERIFY: failed to upsert user after successful verify.', (e as any)?.message || e);
    }
  }

  // Issue JWT
  const token = jwt.sign({ address }, JWT_SECRET, { expiresIn: '1d' });
  // Use cookie.serialize to ensure correct formatting across browsers
  const serialized = serialize('token', token, {
    httpOnly: true,
    path: '/',
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 60 * 60 * 24, // 1 day
  });

  // Set auth cookie and clear the nonce cookie.
  res.setHeader('Set-Cookie', [serialized, clearNonceCookie]);
  res.status(200).json({ success: true });
}
