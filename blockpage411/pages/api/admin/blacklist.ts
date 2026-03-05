import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Wallet from '../../../lib/walletModel';
import User from '../../../lib/userModel';
import AdminAction from '../../../lib/adminActionModel';
import recordAdminAction from '../../../lib/logAdminAction';
import { getVerifiedAdminAddress, withAdminAuth } from '../../../lib/adminMiddleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const { wallet, reason } = req.body;
  const admin = getVerifiedAdminAddress(req) || 'admin';
  if (!wallet) return res.status(400).json({ message: 'Missing wallet' });
  await dbConnect();
  // Blacklist in Wallet
  await Wallet.updateOne({ address: wallet.toLowerCase() }, { $set: { blacklisted: true, blacklistReason: reason, blacklistedAt: new Date() } });
  // Blacklist in User
  await User.updateOne({ address: wallet.toLowerCase() }, { $set: { blacklisted: true, blacklistReason: reason, blacklistedAt: new Date() } });
  // Log admin action (best-effort)
  await recordAdminAction({ admin, action: 'blacklist_wallet', target: wallet, reason });
  return res.status(200).json({ message: 'Wallet blacklisted' });
}

export default withAdminAuth(handler);
