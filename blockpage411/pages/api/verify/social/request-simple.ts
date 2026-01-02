import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../lib/db';
import User from '../../../../lib/userModel';
import redisRateLimit from '../../../../lib/redisRateLimit';
import { socialVerifyRequestSchema } from '../../../../lib/validation/schemas';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  const jwt = await import('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET as string;
  let payload: any;
  try { payload = jwt.verify(token, JWT_SECRET); } catch { return res.status(401).json({ message: 'Invalid token' }); }
  const userAddress = typeof payload === 'object' && payload !== null ? payload.address as string : undefined;
  if (!userAddress) return res.status(401).json({ message: 'Invalid token payload' });

  const allowed = await redisRateLimit(req, res, { windowSec: 300, max: 5, keyPrefix: 'rl:verify:request:' });
  if (!allowed) return;

  let parsed;
  try {
    parsed = socialVerifyRequestSchema.parse(req.body || {});
  } catch (err: any) {
    return res.status(400).json({ message: 'Invalid payload', details: err?.errors ?? String(err) });
  }

  const { platform, handle } = parsed;
  await dbConnect();
  const user = await User.findOne({ address: userAddress });
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.pendingSocialVerifications = user.pendingSocialVerifications || [];
  // mark as admin-requested so no code required
  user.pendingSocialVerifications.push({ platform, handle, adminRequested: true, createdAt: new Date() } as any);
  user.updatedAt = new Date();
  await user.save();

  res.status(200).json({ ok: true, message: 'Verification review requested. Administrators will review and respond within 48 hours.' });
}
