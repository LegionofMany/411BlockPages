import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Wallet from '../../../lib/walletModel';
import { withAdminAuth } from '../../../lib/adminMiddleware';

// PATCH /api/admin/dismiss-wallet-flag
// Body: { address, chain, flagIndex }
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).json({ message: 'Method not allowed' });
  const { address, chain, flagIndex } = req.body;
  if (!address || !chain || flagIndex === undefined) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  await dbConnect();
  const wallet = await Wallet.findOne({ address, chain });
  if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
  if (!Array.isArray(wallet.flags) || wallet.flags.length <= flagIndex) {
    return res.status(400).json({ message: 'Invalid flag index' });
  }
  wallet.flags.splice(flagIndex, 1);
  if (wallet.flags.length === 0) wallet.flagged = false;
  await wallet.save();
  res.status(200).json({ success: true, flags: wallet.flags });
}

export default withAdminAuth(handler);
