import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import Wallet from 'lib/walletModel';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  address: string;
}

interface Rating {
  user: string;
  score: number;
  text?: string;
  date: Date;
  approved?: boolean;
  flagged?: boolean;
  flaggedReason?: string;
}

const JWT_SECRET = process.env.JWT_SECRET as string;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  let payload: JwtPayload | string;
  try {
    payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
  const { address, chain, score, text } = req.body;
  if (!address || !chain || typeof score !== 'number' || score < 1 || score > 5) {
    return res.status(400).json({ message: 'Address, chain, and valid score required' });
  }
  const userAddress = typeof payload === 'object' && payload !== null ? payload.address : undefined;
  if (!userAddress) {
    return res.status(401).json({ message: 'Invalid token payload' });
  }
  await dbConnect();
  let wallet = await Wallet.findOne({ address, chain });
  if (!wallet) {
    wallet = await Wallet.create({ address, chain });
  }
  // Only 1 rating per user per wallet per chain
  const existing = wallet.ratings.find((r: Rating) => r.user === userAddress);
  if (existing) {
    return res.status(429).json({ message: 'Already rated' });
  }
  wallet.ratings.push({ user: userAddress, score, text: text || '', date: new Date(), approved: false, flagged: false, flaggedReason: '' });
  // Update avgRating
  wallet.avgRating = wallet.ratings.reduce((sum: number, r: Rating) => sum + r.score, 0) / wallet.ratings.length;
  await wallet.save();
  res.status(200).json({ success: true });
}
