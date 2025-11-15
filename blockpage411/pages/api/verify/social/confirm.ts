import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../lib/db';
import User from '../../../../lib/userModel';
import redisRateLimit from '../../../../lib/redisRateLimit';
import { socialVerifyRequestSchema } from '../../../../lib/validation/schemas';

async function fetchText(url: string) {
  try {
    const res = await fetch(url, { headers: { Accept: 'text/html' } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

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

  const allowed = await redisRateLimit(req, res, { windowSec: 300, max: 10, keyPrefix: 'rl:verify:confirm:' });
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
  const pending = (user.pendingSocialVerifications || []).find((p: any) => p.platform === platform && p.handle === handle);
  if (!pending) return res.status(400).json({ message: 'No pending verification found' });

  // build public URL to check
  let url: string | null = null;
  if (platform.toLowerCase() === 'twitter') url = `https://twitter.com/${encodeURIComponent(handle)}`;
  if (platform.toLowerCase() === 'telegram') url = `https://t.me/${encodeURIComponent(handle)}`;
  if (!url) return res.status(400).json({ message: 'Unsupported platform for automated verification' });

  const text = await fetchText(url);
  if (!text) return res.status(500).json({ message: 'Failed to fetch profile to verify' });
  if (!text.includes(pending.code)) return res.status(400).json({ message: 'Verification code not found on profile. Please add the code and try again.' });

  // Mark the user's social field as the handle and remove pending
  if (platform.toLowerCase() === 'twitter') user.twitter = handle;
  if (platform.toLowerCase() === 'telegram') user.telegram = handle;
  user.pendingSocialVerifications = (user.pendingSocialVerifications || []).filter((p: any) => !(p.platform === platform && p.handle === handle));
  user.updatedAt = new Date();
  await user.save();

  res.status(200).json({ ok: true, message: `${platform} verified.` });
}
