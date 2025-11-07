import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import User from '../../../lib/userModel';
import AdminAction from '../../../lib/adminActionModel';
import recordAdminAction from '../../../lib/logAdminAction';
import { withAdminAuth } from '../../../lib/adminMiddleware';

const ADMIN_WALLETS = process.env.ADMIN_WALLETS?.split(',').map(a => a.toLowerCase().trim()) || [];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const { donationId } = req.body;
  const admin = req.headers['x-admin-address']?.toString().toLowerCase();
  if (!admin || !ADMIN_WALLETS.includes(admin)) return res.status(403).json({ message: 'Not authorized' });
  if (!donationId) return res.status(400).json({ message: 'Missing donationId' });
  await dbConnect();
  // Deactivate donation in User
  await User.updateOne({ 'donationRequests._id': donationId }, { $set: { 'donationRequests.$.active': false } });
  // Log admin action (best-effort)
  await recordAdminAction({ admin, action: 'deactivate_donation', target: donationId });
  return res.status(200).json({ message: 'Donation deactivated' });
}

export default withAdminAuth(handler);
