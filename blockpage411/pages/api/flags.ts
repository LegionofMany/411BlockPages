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
  const { address, reason } = req.body;
  if (!address || !reason) {
    return res.status(400).json({ message: 'Address and reason required' });
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
  // Rate limit: max 5 flags/day per user
  const today = new Date();
  today.setHours(0,0,0,0);
  const userFlagsToday = wallet.flags.filter((f: any) => f.user === userAddress && new Date(f.date) >= today);
  if (userFlagsToday.length >= 5) {
    return res.status(429).json({ message: 'Flag limit reached' });
  }
  wallet.flags.push({ user: userAddress, reason, date: new Date() });
  await wallet.save();
  res.status(200).json({ success: true });
}
