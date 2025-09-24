import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Wallet from '../../../lib/walletModel';
import AdminAction from '../../../lib/adminActionModel';
import { withAdminAuth } from '../../../lib/adminMiddleware';

const ADMIN_WALLETS = process.env.ADMIN_WALLETS?.split(',').map(a => a.toLowerCase().trim()) || [];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const { wallet, flagId } = req.body;
  const admin = req.headers['x-admin-address']?.toString().toLowerCase();
  if (!admin || !ADMIN_WALLETS.includes(admin)) return res.status(403).json({ message: 'Not authorized' });
  if (!wallet || !flagId) return res.status(400).json({ message: 'Missing wallet or flagId' });
  await dbConnect();
  // Remove flag from Wallet
  await Wallet.updateOne({ address: wallet.toLowerCase() }, { $pull: { flags: { _id: flagId } } });
  // Log admin action
  await AdminAction.create({ admin, action: 'dismiss_flag', target: wallet, reason: `Flag ${flagId} dismissed` });
  return res.status(200).json({ message: 'Flag dismissed' });
}

export default withAdminAuth(handler);
