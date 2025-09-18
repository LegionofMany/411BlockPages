import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import Wallet from 'lib/walletModel';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
  const { address, score } = req.body;
  if (!address || typeof score !== 'number' || score < 1 || score > 5) {
    return res.status(400).json({ message: 'Address and valid score required' });
  }
  const userAddress = typeof payload === 'object' && payload !== null && 'address' in payload ? (payload as any).address : undefined;
  if (!userAddress) {
    return res.status(401).json({ message: 'Invalid token payload' });
  }
  await dbConnect();
  let wallet = await Wallet.findOne({ address });
  if (!wallet) {
    wallet = await Wallet.create({ address });
  }
  // Only 1 rating per user per wallet
  const existing = wallet.ratings.find((r: any) => r.user === userAddress);
  if (existing) {
    return res.status(429).json({ message: 'Already rated' });
  }
  wallet.ratings.push({ user: userAddress, score, date: new Date() });
  // Update avgRating
  wallet.avgRating = wallet.ratings.reduce((sum: number, r: any) => sum + r.score, 0) / wallet.ratings.length;
  await wallet.save();
  res.status(200).json({ success: true });
}
