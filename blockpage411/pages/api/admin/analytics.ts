import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Wallet from '../../../lib/walletModel';
import { withAdminAuth } from '../../../lib/adminMiddleware';

// GET /api/admin/analytics
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  await dbConnect();
  const totalWallets = await Wallet.countDocuments();
  const blacklisted = await Wallet.countDocuments({ blacklisted: true });
  const flagged = await Wallet.countDocuments({ flags: { $exists: true, $not: { $size: 0 } } });
  const kycVerified = await Wallet.countDocuments({ kycStatus: 'verified' });
  const kycPending = await Wallet.countDocuments({ kycStatus: 'pending' });
  const kycRejected = await Wallet.countDocuments({ kycStatus: 'rejected' });
  res.status(200).json({
    totalWallets,
    blacklisted,
    flagged,
    kycVerified,
    kycPending,
    kycRejected
  });
}

export default withAdminAuth(handler);
