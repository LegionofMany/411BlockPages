import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import User from 'lib/userModel';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  address: string;
}

const JWT_SECRET = process.env.JWT_SECRET as string;

// PATCH/PUT endpoint to update user profile fields
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH' && req.method !== 'PUT') {
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
  const userAddress = typeof payload === 'object' && payload !== null ? payload.address : undefined;
  if (!userAddress) {
    return res.status(401).json({ message: 'Invalid token payload' });
  }
  await dbConnect();
  const user = await User.findOne({ address: userAddress });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  // Only allow updating certain fields
  const alwaysAllowed: (keyof import('../../lib/types').UserProfile)[] = ['displayName', 'avatarUrl', 'bio', 'donationRequests'];
  const kycGated: (keyof import('../../lib/types').UserProfile)[] = ['telegram', 'twitter', 'discord', 'website', 'phoneApps'];
  const updatedFields: (keyof import('../../lib/types').UserProfile)[] = [];

  // Rate limit: max 5 profile updates per day
  const now = new Date();
  user.profileUpdateHistory = user.profileUpdateHistory || [];
  // Remove entries older than 24h
  user.profileUpdateHistory = user.profileUpdateHistory.filter((d: Date) => now.getTime() - new Date(d).getTime() < 24 * 60 * 60 * 1000);
  if (user.profileUpdateHistory.length >= 5) {
    return res.status(429).json({ message: 'Profile update limit reached (5 per day)' });
  }

  // Always-allowed fields
  for (const field of alwaysAllowed) {
    if ((req.body as Partial<import('../../lib/types').UserProfile>)[field] !== undefined) {
      user[field] = (req.body as Partial<import('../../lib/types').UserProfile>)[field];
      updatedFields.push(field);
    }
  }

  // KYC-gated fields
  for (const field of kycGated) {
    if ((req.body as Partial<import('../../lib/types').UserProfile>)[field] !== undefined) {
      if (user.kycStatus !== 'verified') {
        return res.status(403).json({ message: `KYC verification required to update ${field}` });
      }
      user[field] = (req.body as Partial<import('../../lib/types').UserProfile>)[field];
      updatedFields.push(field);
    }
  }

  user.updatedAt = now;
  user.profileUpdateHistory.push(now);
  await user.save();
  res.status(200).json({ success: true, updated: updatedFields });
}
