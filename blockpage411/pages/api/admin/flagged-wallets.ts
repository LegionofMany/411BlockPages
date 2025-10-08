import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import Wallet from 'lib/walletModel';
import { withAdminAuth } from '../../../lib/adminMiddleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect();
    // Find all wallets with flags
    const flaggedWallets = await Wallet.find({ flags: { $exists: true, $not: { $size: 0 } } }, '-_id address chain flags');
    res.status(200).json({ flaggedWallets });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch flagged wallets', error: (err as Error).message });
  }
}

export default withAdminAuth(handler);
