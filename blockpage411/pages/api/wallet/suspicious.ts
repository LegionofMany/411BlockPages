import type { NextApiRequest, NextApiResponse } from 'next';
import Wallet from '../../../lib/walletModel';
import dbConnect from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect();
    // List wallets marked as suspicious
    const suspiciousWallets = await Wallet.find({ suspicious: true });
    // Map to include suspicionReason and suspiciousAt
    const wallets = suspiciousWallets.map(w => ({
      address: w.address,
      suspicionReason: w.suspicionReason || '',
      suspiciousAt: w.suspiciousAt || w.updatedAt || null,
      flagged: w.flagged || false,
      transactions: w.transactions || [],
    }));
    res.status(200).json({ wallets });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch suspicious wallets.' });
  }
}
