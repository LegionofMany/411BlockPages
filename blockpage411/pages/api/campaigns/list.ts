import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Wallet from '../../../lib/walletModel';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  // Return active campaigns across wallets
  const wallets = await Wallet.find({ 'campaigns.0': { $exists: true } }).lean();
  const campaigns: unknown[] = [];
  wallets.forEach((raw) => {
    const w = raw as Record<string, unknown>;
    const campaignsList = Array.isArray(w.campaigns) ? (w.campaigns as unknown[]) : [];
    campaignsList.forEach((rawC) => {
      const c = rawC as Record<string, unknown>;
      const active = Boolean(c.active);
      const expiry = c.expiry ? new Date(String(c.expiry)) : null;
      if (active && (!expiry || expiry > new Date())) {
        campaigns.push({ walletAddress: w.address, chain: w.chain, ...c } as unknown);
      }
    });
  });
  res.status(200).json({ campaigns });
}
