
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import Wallet from 'lib/walletModel';

interface Rating {
  user: string;
  score: number;
  text: string;
  date: Date;
  approved: boolean;
  flagged: boolean;
  flaggedReason: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const { address, chain, user } = req.body;
  if (!address || !chain || !user) return res.status(400).json({ message: 'Missing params' });
  await dbConnect();
  const wallet = await Wallet.findOne({ address, chain });
  if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
  const rating = wallet.ratings.find((r: Rating) => r.user === user);
  if (!rating) return res.status(404).json({ message: 'Review not found' });
  rating.approved = true;
  await wallet.save();
  res.status(200).json({ success: true });
}
