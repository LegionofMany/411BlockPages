import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import Wallet from 'lib/walletModel';
import { withAdminAuth } from '../../../lib/adminMiddleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect();
    const wallets = await Wallet.find({}, '-_id address chain kycStatus kycDetails flags blacklisted');
    res.status(200).json({ wallets });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch wallets', error: (err as Error).message });
  }
}

export default withAdminAuth(handler);
