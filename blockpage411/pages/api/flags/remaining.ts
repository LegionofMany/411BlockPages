import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import Wallet from 'lib/walletModel';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  let payload: unknown;
  try {
    payload = jwt.verify(token, JWT_SECRET) as unknown;
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
  const obj = payload as Record<string, unknown> | null;
  const userAddress = obj && typeof obj.address === 'string' ? obj.address : null;
  if (!userAddress) return res.status(401).json({ message: 'Invalid token payload' });
  await dbConnect();
  const today = new Date();
  today.setHours(0,0,0,0);
  // Count flags across all wallets for this user since midnight
  const userFlagsToday = await Wallet.aggregate([
    { $unwind: '$flags' },
    { $match: { 'flags.user': userAddress, 'flags.date': { $gte: today } } },
    { $count: 'n' }
  ]);
  const count = Array.isArray(userFlagsToday) && userFlagsToday[0] && userFlagsToday[0].n ? userFlagsToday[0].n : 0;
  const remaining = Math.max(0, 5 - count);
  res.status(200).json({ remaining, limit: 5, usedToday: count });
}
