import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import User from 'lib/userModel';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  address: string;
}

const JWT_SECRET = process.env.JWT_SECRET as string;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
  // Compute verification score and badge
  let score = 0;
  if (user.address) score += 10;
  if (user.displayName) score += 10;
  if (user.avatarUrl) score += 10;
  if (user.bio) score += 5;
  if (user.telegram) score += 10;
  if (user.twitter) score += 10;
  if (user.discord) score += 10;
  if (user.website) score += 5;
  if (user.phoneApps && user.phoneApps.length > 0) score += 10;
  if (user.kycStatus === 'verified') score += 20;
  // Add points for donationRequests
  if (user.donationRequests && (user.donationRequests as import('../../lib/types').DonationRequest[]).some((d) => d.active)) score += 10;
  // Badge logic
  let badge = 'Bronze';
  if (score >= 80) badge = 'Diamond';
  else if (score >= 60) badge = 'Gold';
  else if (score >= 40) badge = 'Silver';

  res.status(200).json({
    address: user.address,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    telegram: user.telegram,
    twitter: user.twitter,
    discord: user.discord,
    website: user.website,
    phoneApps: user.phoneApps,
    kycStatus: user.kycStatus,
    kycRequestedAt: user.kycRequestedAt,
    kycVerifiedAt: user.kycVerifiedAt,
    donationRequests: user.donationRequests as import('../../lib/types').DonationRequest[],
    verificationScore: score,
    verificationBadge: badge,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
}
