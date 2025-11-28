import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import Wallet from 'lib/walletModel';
import { withAdminAuth } from '../../../lib/adminMiddleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const { address, chain } = req.body;
  if (!address || !chain) return res.status(400).json({ message: 'Address and chain required' });
  await dbConnect();
  await Wallet.deleteOne({ address, chain });
  res.status(200).json({ message: 'Wallet deleted' });
}

export default withAdminAuth(handler);
