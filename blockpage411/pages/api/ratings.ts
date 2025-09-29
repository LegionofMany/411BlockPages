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
  const token = req.cookies.token;
  let payload: JwtPayload | string | undefined;
  if (token) {
    try {
      payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      payload = undefined;
    }
  }
  await dbConnect();
  if (req.method === 'GET') {
    // GET ratings for a wallet
    const { address, chain } = req.query;
    if (!address || !chain) return res.status(400).json({ message: 'Address and chain required' });
    const wallet = await Wallet.findOne({ address, chain });
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
    return res.status(200).json({ ratings: wallet.ratings, avgRating: wallet.avgRating });
  }
  if (req.method === 'POST') {
    if (!token || !payload) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    const userAddress = typeof payload === 'object' && payload !== null ? payload.address : undefined;
    if (!userAddress) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }
    const { address, chain, rating, text } = req.body;
    if (!address || !chain || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Address, chain, and valid rating required' });
    }
    let wallet = await Wallet.findOne({ address, chain });
    if (!wallet) {
      wallet = await Wallet.create({ address, chain });
    }
    // Allow user to update their rating
    const existing = wallet.ratings.find((r: Rating) => r.user === userAddress);
    if (existing) {
      existing.score = rating;
      existing.text = text || '';
      existing.date = new Date();
    } else {
      wallet.ratings.push({ user: userAddress, score: rating, text: text || '', date: new Date(), approved: false, flagged: false, flaggedReason: '' });
    }
    // Update avgRating
    wallet.avgRating = wallet.ratings.length > 0 ? wallet.ratings.reduce((sum: number, r: Rating) => sum + r.score, 0) / wallet.ratings.length : 0;
    await wallet.save();
    res.status(200).json({ success: true, avgRating: wallet.avgRating });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
