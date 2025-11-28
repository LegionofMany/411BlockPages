import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import Wallet from 'lib/walletModel';
import { withAdminAuth } from '../../../lib/adminMiddleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  // Request must be from an authenticated admin (checked by wrapper)
  const { address, chain, blacklisted } = req.body;
  if (!address || !chain || typeof blacklisted !== 'boolean') return res.status(400).json({ message: 'Address, chain, and blacklisted required' });
  await dbConnect();
  await Wallet.findOneAndUpdate({ address, chain }, { $set: { blacklisted } });
  res.status(200).json({ message: `Wallet ${blacklisted ? 'blacklisted' : 'un-blacklisted'}` });
}

export default withAdminAuth(handler);
