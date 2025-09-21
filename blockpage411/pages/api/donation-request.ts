import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import User from 'lib/userModel';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  address: string;
}

const JWT_SECRET = process.env.JWT_SECRET as string;

// POST endpoint to add a donation request
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
  const userAddress = typeof payload === 'object' && payload !== null ? payload.address : undefined;
  if (!userAddress) {
    return res.status(401).json({ message: 'Invalid token payload' });
  }
  await dbConnect();
  const user = await User.findOne({ address: userAddress });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  const { platform, url, description } = req.body;
  if (!platform || !url) {
    return res.status(400).json({ message: 'Platform and URL required' });
  }
  user.donationRequests = user.donationRequests || [];
  // Expire old donations (set active=false if >60 days old)
  const now = new Date();
  (user.donationRequests as (import('../../lib/types').DonationRequest & { createdAt?: string | Date })[]).forEach((don) => {
    if (don.active && don.createdAt) {
      const created = new Date(don.createdAt);
      if (now.getTime() - created.getTime() > 60 * 24 * 60 * 60 * 1000) {
        don.active = false;
      }
    }
  });
  // Enforce max 1 active donation
  const activeDonations = (user.donationRequests as import('../../lib/types').DonationRequest[]).filter((d) => d.active !== false);
  if (activeDonations.length >= 1) {
    return res.status(400).json({ message: 'Only 1 active donation allowed at a time' });
  }
  // Add new donation with createdAt
  user.donationRequests.push({ platform, url, description, active: true, createdAt: now } as import('../../lib/types').DonationRequest & { createdAt: Date });
  user.updatedAt = now;
  await user.save();
  res.status(200).json({ success: true, donationRequests: user.donationRequests });
}
