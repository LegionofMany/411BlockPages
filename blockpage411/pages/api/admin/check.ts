import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { getAddress } from 'ethers';

const JWT_SECRET = process.env.JWT_SECRET as string;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  const token = req.cookies?.token as string | undefined;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  let payload: unknown;
  try { payload = jwt.verify(token, JWT_SECRET); } catch { return res.status(401).json({ message: 'Invalid token' }); }
  let address: string | undefined;
  // extract address in a type-safe manner
  if (payload && typeof payload === 'object' && payload !== null && 'address' in payload) {
    const maybe = (payload as { [k: string]: unknown }).address;
    if (typeof maybe === 'string') address = maybe;
  }
  if (!address) return res.status(401).json({ message: 'Invalid token payload' });

  // build allowed admins list from env
  const allowedRaw = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || '').split(',').map(s => s.trim()).filter(Boolean);
  const allowedNormalized = allowedRaw.map(a => {
    try { return getAddress(a); } catch { return a.toLowerCase(); }
  });

  const isAdmin = allowedNormalized.map(a => a.toLowerCase()).includes((address || '').toLowerCase());

  res.status(200).json({ isAdmin, address, allowed: allowedRaw });
}
