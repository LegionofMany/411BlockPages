import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import User from '../../../lib/userModel';
import AdminAction from '../../../lib/adminActionModel';
import recordAdminAction from '../../../lib/logAdminAction';
import { getVerifiedAdminAddress, withAdminAuth } from '../../../lib/adminMiddleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const { donationId } = req.body;
  const admin = getVerifiedAdminAddress(req) || 'admin';
  if (!donationId) return res.status(400).json({ message: 'Missing donationId' });
  await dbConnect();
  // Deactivate donation in User
  await User.updateOne({ 'donationRequests._id': donationId }, { $set: { 'donationRequests.$.active': false } });
  // Log admin action (best-effort)
  await recordAdminAction({ admin, action: 'deactivate_donation', target: donationId });
  return res.status(200).json({ message: 'Donation deactivated' });
}

export default withAdminAuth(handler);
