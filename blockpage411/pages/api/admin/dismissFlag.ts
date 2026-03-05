import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Wallet from '../../../lib/walletModel';
import AdminAction from '../../../lib/adminActionModel';
import recordAdminAction from '../../../lib/logAdminAction';
import { getVerifiedAdminAddress, withAdminAuth } from '../../../lib/adminMiddleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const { wallet, flagId } = req.body;
  const admin = getVerifiedAdminAddress(req) || 'admin';
  if (!wallet || !flagId) return res.status(400).json({ message: 'Missing wallet or flagId' });
  await dbConnect();
  // Remove flag from Wallet
  await Wallet.updateOne({ address: wallet.toLowerCase() }, { $pull: { flags: { _id: flagId } } });
  // Log admin action (best-effort)
  await recordAdminAction({ admin, action: 'dismiss_flag', target: wallet, reason: `Flag ${flagId} dismissed` });
  return res.status(200).json({ message: 'Flag dismissed' });
}

export default withAdminAuth(handler);
