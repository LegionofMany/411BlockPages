import type { NextApiRequest, NextApiResponse } from 'next';
import Wallet from '../../../lib/walletModel';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
}
