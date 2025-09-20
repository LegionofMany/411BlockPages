import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import Wallet from 'lib/walletModel';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  address: string;
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
  const { address, chain, reason } = req.body;
  if (!address || !chain || !reason) {
    return res.status(400).json({ message: 'Address, chain, and reason required' });
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
  // Rate limit: max 5 flags/day per user across all chains
  const today = new Date();
  today.setHours(0,0,0,0);
  const userFlagsToday = await Wallet.aggregate([
    { $unwind: "$flags" },
    { $match: { "flags.user": userAddress, "flags.date": { $gte: today } } },
  ]);
  if (userFlagsToday.length >= 5) {
    return res.status(429).json({ message: 'Flag limit reached' });
  }
  wallet.flags.push({ user: userAddress, reason, date: new Date() });
  await wallet.save();
  res.status(200).json({ success: true });
}
