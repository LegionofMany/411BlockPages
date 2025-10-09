import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Transaction from '../../../lib/transactionModel';
import Wallet from '../../../lib/walletModel';
import { withAdminAuth } from '../../../lib/adminMiddleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect();

    const totalWallets = await Wallet.countDocuments();
    const flaggedTxCount = await Transaction.countDocuments({ flagged: true });
    const flaggedWallets = await Wallet.countDocuments({ $or: [{ flags: { $exists: true, $ne: [] } }, { suspicious: true }, { blacklisted: true }] });

    return res.status(200).json({
      totalWallets,
      flaggedTxCount,
      flaggedWallets,
    });
  } catch (err) {
    console.error('admin/stats error', err);
    return res.status(500).json({ error: 'failed to collect stats' });
  }
}

export default withAdminAuth(handler);
