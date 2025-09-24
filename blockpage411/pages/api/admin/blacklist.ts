import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Wallet from '../../../lib/walletModel';
import User from '../../../lib/userModel';
import AdminAction from '../../../lib/adminActionModel';
import { withAdminAuth } from '../../../lib/adminMiddleware';

const ADMIN_WALLETS = process.env.ADMIN_WALLETS?.split(',').map(a => a.toLowerCase().trim()) || [];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const { wallet, reason } = req.body;
  const admin = req.headers['x-admin-address']?.toString().toLowerCase();
  if (!admin || !ADMIN_WALLETS.includes(admin)) return res.status(403).json({ message: 'Not authorized' });
  if (!wallet) return res.status(400).json({ message: 'Missing wallet' });
  await dbConnect();
  // Blacklist in Wallet
  await Wallet.updateOne({ address: wallet.toLowerCase() }, { $set: { blacklisted: true, blacklistReason: reason, blacklistedAt: new Date() } });
  // Blacklist in User
  await User.updateOne({ address: wallet.toLowerCase() }, { $set: { blacklisted: true, blacklistReason: reason, blacklistedAt: new Date() } });
  // Log admin action
  await AdminAction.create({ admin, action: 'blacklist_wallet', target: wallet, reason });
  return res.status(200).json({ message: 'Wallet blacklisted' });
}

export default withAdminAuth(handler);
