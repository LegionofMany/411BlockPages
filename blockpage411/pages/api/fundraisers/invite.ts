import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import User from 'lib/userModel';
import Fundraiser from 'models/Fundraiser';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  let payload: unknown;
  try { payload = jwt.verify(token, JWT_SECRET); } catch { return res.status(401).json({ message: 'Invalid token' }); }
  const userAddress = typeof payload === 'object' && payload !== null ? (payload as { address?: string }).address : undefined;
  if (!userAddress) return res.status(401).json({ message: 'Invalid token payload' });
  const { id, list } = req.body as { id?: string; list?: string[] };
  if (!id || !Array.isArray(list)) return res.status(400).json({ message: 'Missing fields' });
  await dbConnect();
  const f = await Fundraiser.findOne({ id });
  if (!f) return res.status(404).json({ message: 'Fundraiser not found' });
  if ((String(f.owner ?? '')).toLowerCase() !== userAddress.toLowerCase()) return res.status(403).json({ message: 'Not owner' });
  const normalized = list.map((s: string) => String(s).trim()).filter(Boolean);
  const existing: string[] = Array.isArray(f.circle) ? (f.circle as string[]) : [];
  const merged = Array.from(new Set([...existing, ...normalized]));
  f.circle = merged as string[];
  await f.save();

  // keep embedded copy on user in sync if present
  const user = await User.findOne({ address: userAddress });
  if (user) {
    const idx = (user.fundraisers || []).findIndex((x: { id?: string }) => String(x.id) === String(id));
    if (idx !== -1) {
      (user.fundraisers as { id?: string; circle?: string[] }[])[idx].circle = merged;
      user.markModified('fundraisers');
      await user.save();
    }
  }

  res.status(200).json({ success: true });
}
