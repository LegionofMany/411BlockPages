// pages/api/admin/summary.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import Wallet from 'lib/walletModel';
import { withAdminAuth } from '../../../lib/adminMiddleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  await dbConnect();
  const suspicious = await Wallet.find({ suspicious: true });
  const popular = await Wallet.find({ popular: true });
  // Recent flags and ratings
  const flags: any[] = [];
  const ratings: any[] = [];
  for (const wallet of await Wallet.find({})) {
    for (const flag of wallet.flags || []) {
      flags.push({ ...flag._doc, address: wallet.address, chain: wallet.chain });
    }
    for (const rating of wallet.ratings || []) {
      ratings.push({ ...rating._doc, address: wallet.address, chain: wallet.chain });
    }
  }
  // Sort by date, show latest 10
  flags.sort((a, b) => (b.date || 0) - (a.date || 0));
  ratings.sort((a, b) => (b.date || 0) - (a.date || 0));
  res.status(200).json({
    suspicious,
    popular,
    flags: flags.slice(0, 10),
    ratings: ratings.slice(0, 10)
  });
}

export default withAdminAuth(handler);
