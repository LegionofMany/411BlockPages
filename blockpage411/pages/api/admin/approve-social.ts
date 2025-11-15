import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import User from '../../../lib/userModel';
import { withAdminAuth } from '../../../lib/adminMiddleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const { address, platform, handle } = req.body as { address?: string; platform?: string; handle?: string };
  if (!address || !platform || !handle) return res.status(400).json({ message: 'Missing fields' });
  await dbConnect();
  const user = await User.findOne({ address });
  if (!user) return res.status(404).json({ message: 'User not found' });
  // apply social field
  if (platform.toLowerCase() === 'twitter') user.twitter = handle;
  if (platform.toLowerCase() === 'telegram') user.telegram = handle;
  // remove pending entries for this platform/handle
  user.pendingSocialVerifications = (user.pendingSocialVerifications || []).filter((p: any) => !(p.platform === platform && p.handle === handle));
  user.updatedAt = new Date();
  await user.save();
  return res.status(200).json({ ok: true });
}

export default withAdminAuth(handler);
