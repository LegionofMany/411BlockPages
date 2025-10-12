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
  const userAddress = typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>)['address'] as string | undefined : undefined;
  if (!userAddress) return res.status(401).json({ message: 'Invalid token payload' });
  await dbConnect();
  const user = await User.findOne({ address: userAddress });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const { title, description, target, durationDays, walletAddress, privacy, circle } = req.body as { title?: string; description?: string; target?: number; durationDays?: number; walletAddress?: string; privacy?: 'public' | 'circle'; circle?: string[] };
  if (!title || !target || !walletAddress) return res.status(400).json({ message: 'Missing required fields' });
  // basic validation
  const targ = Number(target);
  if (!isFinite(targ) || targ <= 0) return res.status(400).json({ message: 'Invalid target amount' });
  const wa = String(walletAddress || '').trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(wa)) {
    // not necessarily fatal; allow non-eth addresses but warn
    // return res.status(400).json({ message: 'Invalid wallet address format' });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + (Number(durationDays || 90) * 24 * 60 * 60 * 1000));
  const id = `f_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;

  const doc = await Fundraiser.create({
    id,
    title,
    description: description ?? '',
    target: Number(target),
    raised: 0,
    walletAddress,
    owner: userAddress,
    createdAt: now,
    expiresAt,
    active: true,
    privacy: privacy ?? 'public',
    circle: Array.isArray(circle) ? circle : [],
  });

  // keep embedded copy for compatibility (optional)
  user.fundraisers = user.fundraisers || [];
  user.fundraisers.push({ id: doc.id, title: doc.title, description: doc.description, target: doc.target, raised: doc.raised, walletAddress: doc.walletAddress, owner: doc.owner, createdAt: doc.createdAt, expiresAt: doc.expiresAt, active: doc.active, privacy: doc.privacy, circle: doc.circle });
  user.updatedAt = now;
  await user.save();

  return res.status(200).json({ success: true, fundraiser: doc });
}
