import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import User from '../../../lib/userModel';
import { withAdminAuth } from '../../../lib/adminMiddleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const { address, platform, handle } = req.body as { address?: string; platform?: string; handle?: string };
  if (!address || !platform || !handle) return res.status(400).json({ message: 'Missing fields' });
  await dbConnect();
  // perform an atomic update to avoid VersionError from concurrent modifications
  const update: any = {
    $pull: { pendingSocialVerifications: { platform, handle } },
    $set: { updatedAt: new Date() },
  };
  try {
    const updated = await User.findOneAndUpdate({ address }, update, { new: true });
    if (!updated) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[admin/reject-social] update error', e);
    return res.status(500).json({ message: 'Update failed' });
  }
}

export default withAdminAuth(handler);
