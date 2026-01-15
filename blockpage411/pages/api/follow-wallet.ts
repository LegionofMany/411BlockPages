import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from 'lib/db';
import User from 'lib/userModel';

type JwtPayload = { address?: string };

const JWT_SECRET = process.env.JWT_SECRET as string;

function normalizeChain(chain: unknown): string {
  const c = String(chain || '').toLowerCase().trim();
  if (!c) return 'ethereum';
  return c;
}

function normalizeAddress(address: unknown): string {
  return String(address || '').toLowerCase().trim();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });

  let payload: JwtPayload | string;
  try {
    payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }

  const userAddress = typeof payload === 'object' && payload ? payload.address : undefined;
  if (!userAddress) return res.status(401).json({ message: 'Invalid token payload' });

  const { chain, address } = req.body || {};
  const chainNorm = normalizeChain(chain);
  const addrNorm = normalizeAddress(address);
  if (!addrNorm) return res.status(400).json({ message: 'address is required' });

  await dbConnect();

  const user = await User.findOne({ address: String(userAddress).toLowerCase() });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const entry = { chain: chainNorm, address: addrNorm, createdAt: new Date() };

  const existing = Array.isArray((user as any).followedWallets)
    ? (user as any).followedWallets.find((w: any) => String(w?.chain || '').toLowerCase() === chainNorm && String(w?.address || '').toLowerCase() === addrNorm)
    : null;

  if (!existing) {
    (user as any).followedWallets = Array.isArray((user as any).followedWallets) ? (user as any).followedWallets : [];
    (user as any).followedWallets.unshift(entry);
    await user.save();
  }

  return res.status(200).json({ success: true, followed: true });
}
