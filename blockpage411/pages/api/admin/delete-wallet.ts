import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import Wallet from 'lib/walletModel';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  // Only allow admin wallets
  const adminWallets = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || '').split(',').map(a => a.toLowerCase().trim());
  const userWallet = req.headers['x-admin-address'] || '';
  if (!userWallet || !adminWallets.includes((userWallet as string).toLowerCase())) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const { address, chain } = req.body;
  if (!address || !chain) return res.status(400).json({ message: 'Address and chain required' });
  await dbConnect();
  await Wallet.deleteOne({ address, chain });
  res.status(200).json({ message: 'Wallet deleted' });
}
