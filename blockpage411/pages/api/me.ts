import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import User from 'lib/userModel';
import Wallet from 'lib/walletModel';
import { computeTrustScore } from 'services/trustScoreService';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  address: string;
}

const JWT_SECRET = process.env.JWT_SECRET as string;
const DEBUG_AUTH = process.env.DEBUG_AUTH === 'true';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (DEBUG_AUTH) console.log('API/ME: cookies', req.cookies);
  const token = req.cookies.token;
  if (!token) {
    if (DEBUG_AUTH) console.log('API/ME: No token cookie');
    return res.status(401).json({ message: 'Not authenticated' });
  }
  let payload: JwtPayload | string;
  try {
    payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (e) {
    if (DEBUG_AUTH) console.log('API/ME: Invalid token', e);
    return res.status(401).json({ message: 'Invalid token' });
  }
  const userAddress = typeof payload === 'object' && payload !== null ? payload.address : undefined;
  if (!userAddress) {
    if (DEBUG_AUTH) console.log('API/ME: Invalid token payload', payload);
    return res.status(401).json({ message: 'Invalid token payload' });
  }
  try {
    await dbConnect();
  } catch (err) {
    console.error('API/ME: dbConnect failed', err);
    return res.status(503).json({ message: 'Database unavailable' });
  }
  const user = await User.findOne({ address: userAddress });
  if (!user) {
    if (DEBUG_AUTH) console.log('API/ME: User not found', userAddress);
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

  // Compute trustScore based on social verification and wallet flags
  const social = (user as any).socialLinks || {};
  const verified = social.verified as Map<string, boolean> | Record<string, boolean> | undefined;
  let verifiedLinksCount = 0;
  if (verified) {
    const entries = verified instanceof Map ? Array.from(verified.entries()) : Object.entries(verified);
    verifiedLinksCount = entries.filter(([, v]) => !!v).length;
  }
  let flagsCount = 0;
  try {
    const walletDoc = await Wallet.findOne({ address: user.address.toLowerCase(), chain: 'eth' }).lean() as any;
    if (walletDoc?.flagsCount != null) flagsCount = walletDoc.flagsCount;
    else if (Array.isArray(walletDoc?.flags)) flagsCount = walletDoc.flags.length;
  } catch {
    // ignore wallet lookup errors
  }
  const trustScore = computeTrustScore({ verifiedLinksCount, flagsCount });

  if (!user.socialLinks) (user as any).socialLinks = {};
  (user as any).socialLinks.trustScore = trustScore;
  await user.save();
  // Badge logic
  let badge = 'Bronze';
  if (score >= 80) badge = 'Diamond';
  else if (score >= 60) badge = 'Gold';
  else if (score >= 40) badge = 'Silver';

  res.status(200).json({
    address: user.address,
    email: (user as any).email,
    emailVerified: (user as any).emailVerified || false,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    nftAvatarUrl: (user as any).nftAvatarUrl,
    bio: user.bio,
    telegram: user.telegram,
    twitter: user.twitter,
    discord: user.discord,
    website: user.website,
    phoneApps: user.phoneApps,
    socialLinks: (user as any).socialLinks || undefined,
    kycStatus: user.kycStatus,
    kycRequestedAt: user.kycRequestedAt,
    kycVerifiedAt: user.kycVerifiedAt,
    donationRequests: user.donationRequests as import('../../lib/types').DonationRequest[],
    featuredCharityId: (user as any).featuredCharityId,
    activeEventId: (user as any).activeEventId,
    donationLink: (user as any).donationLink,
    donationWidgetEmbed: (user as any).donationWidgetEmbed,
    verificationScore: score,
    verificationBadge: badge,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
}
