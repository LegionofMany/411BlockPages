import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Wallet from '../../../lib/walletModel';
import { withAdminAuth } from '../../../lib/adminMiddleware';

// PATCH /api/admin/role
// Body: { address, chain, role: 'user' | 'moderator' | 'admin' }
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).json({ message: 'Method not allowed' });
  const { address, chain, role } = req.body;
  if (!address || !chain || !role) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  if (!['user', 'moderator', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  await dbConnect();
  const wallet = await Wallet.findOne({ address, chain });
  if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
  wallet.role = role;
  await wallet.save();
  res.status(200).json({ success: true, role });
}

export default withAdminAuth(handler);
