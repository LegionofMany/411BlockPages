import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import User from 'lib/userModel';
// require jsonwebtoken at runtime to allow tests to mock it via jest
let JWT_SECRET = process.env.JWT_SECRET as string;

// simple in-memory rate limiter per-address (safeguard, not a replacement for redis/DB-backed limits)
const lastKycRequestAt: Record<string, number> = {};
const MIN_REQUEST_INTERVAL_MS = Number(process.env.KYC_MIN_REQUEST_INTERVAL_MS || 24 * 60 * 60 * 1000); // default 24h

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  // accept token from cookie or Authorization header (Bearer)
  const token = req.cookies?.token || (() => {
    const h = req.headers?.authorization || req.headers?.Authorization;
    if (!h || typeof h !== 'string') return undefined;
    const m = h.match(/^Bearer\s+(.*)$/i);
    return m ? m[1] : undefined;
  })();
  if (!token) return res.status(401).json({ message: 'Not authenticated' });

  // dynamic require so test mocks take effect
  const jwt = require('jsonwebtoken');
  JWT_SECRET = process.env.JWT_SECRET as string;
  let payload: any;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  const userAddress = payload && typeof payload === 'object' ? String(payload.address || '').toLowerCase() : '';
  if (!userAddress) return res.status(401).json({ message: 'Invalid token payload' });

  await dbConnect();
  const user = await User.findOne({ address: userAddress });
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Client request: KYC requests must prompt Base wallet sign-in first.
  // We enforce that the user has completed Base verification.
  if (!(user as any).baseVerifiedAt) {
    return res.status(400).json({ message: 'Base wallet sign-in required before requesting KYC.' });
  }

  // rate limiting: prevent repeated requests from same address within interval
  const now = Date.now();
  const last = lastKycRequestAt[userAddress] || 0;
  if (now - last < MIN_REQUEST_INTERVAL_MS) {
    const wait = Math.ceil((MIN_REQUEST_INTERVAL_MS - (now - last)) / 1000);
    return res.status(429).json({ message: `KYC request rate limit - try again in ${wait} seconds` });
  }

  // If already requested/verified, return an informative response
  if (user.kycStatus === 'pending') {
    return res.status(200).json({ success: true, kycStatus: 'pending', message: 'KYC already requested — waiting for admin review' });
  }
  if (user.kycStatus === 'verified') {
    return res.status(200).json({ success: true, kycStatus: 'verified', message: 'Already verified' });
  }

  // persist pending state
  user.kycStatus = 'pending';
  user.kycRequestedAt = new Date();
  await user.save();
  lastKycRequestAt[userAddress] = now;

  // Audit log + robust admin notifications (email + webhook fallback)
  try {
    const AuditLog = require('../../lib/auditLogModel').default;
    await AuditLog.create({ type: 'kyc.request', actor: userAddress, target: userAddress, action: 'request', meta: { requestedAt: user.kycRequestedAt } });
  } catch (e) {
    console.warn('Failed to write audit log for KYC request', e);
  }

  try {
    const { notifyAdmin } = require('../../lib/notify');
    // send lightweight payload to webhook
    await Promise.resolve(notifyAdmin(`KYC requested for ${userAddress}`, { address: userAddress, requestedAt: user.kycRequestedAt }));
  } catch (e) {
    console.warn('notifyAdmin error', e);
    try {
      const notifyEmail = require('../../lib/notifyEmail').default;
      if (process.env.ADMIN_NOTIFICATION_EMAIL) {
        await notifyEmail(`KYC requested: ${userAddress}`, `KYC requested for ${userAddress} at ${user.kycRequestedAt}`);
      }
    } catch (ee) {
      console.warn('notifyEmail fallback failed', ee);
    }
  }

  return res.status(200).json({ success: true, kycStatus: user.kycStatus, message: 'KYC requested — an admin will review and verify.' });
}
