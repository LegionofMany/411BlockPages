import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Wallet from '../../../lib/walletModel';
import { withAdminAuth } from '../../../lib/adminMiddleware';

// PATCH /api/admin/kyc-status
// Body: { address, chain, kycStatus: 'verified' | 'rejected' | 'pending' }
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).json({ message: 'Method not allowed' });
  const { address, chain, kycStatus } = req.body;
  if (!address || !chain || !kycStatus) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  if (!['verified', 'rejected', 'pending'].includes(kycStatus)) {
    return res.status(400).json({ message: 'Invalid kycStatus' });
  }
  await dbConnect();
  const wallet = await Wallet.findOne({ address, chain });
  if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
  wallet.kycStatus = kycStatus;
  if (kycStatus === 'verified') wallet.kycVerifiedAt = new Date();
  if (kycStatus === 'pending') wallet.kycRequestedAt = new Date();
  await wallet.save();
  res.status(200).json({ success: true, kycStatus });
}

export default withAdminAuth(handler);
