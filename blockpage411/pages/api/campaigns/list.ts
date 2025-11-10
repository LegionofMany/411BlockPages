import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Wallet from '../../../lib/walletModel';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  // Return active campaigns across wallets
  const wallets = await Wallet.find({ 'campaigns.0': { $exists: true } }).lean();
  const campaigns: any[] = [];
  wallets.forEach(w => {
    (w.campaigns || []).forEach((c: any) => {
      if (c.active && (!c.expiry || new Date(c.expiry) > new Date())) {
        campaigns.push({ walletAddress: w.address, chain: w.chain, ...c });
      }
    });
  });
  res.status(200).json({ campaigns });
}
