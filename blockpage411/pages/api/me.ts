import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import User from 'lib/userModel';
import Wallet from 'lib/walletModel';
import { computeTrustScore } from 'services/trustScoreService';
import { computeSocialCreditScore } from 'services/socialCreditScore';
import { resolveNames } from 'services/nameResolution';
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
  let walletRiskScore: number | null = null;
  let walletRiskCategory: string | null = null;
  let walletAvgRating: number | null = null;
  let walletRatingsCount: number | null = null;
  try {
    const walletDoc = await Wallet.findOne({
      address: user.address.toLowerCase(),
      chain: { $in: ['eth', 'ethereum', 'base'] },
    }).lean() as any;
    if (walletDoc?.flagsCount != null) flagsCount = walletDoc.flagsCount;
    else if (Array.isArray(walletDoc?.flags)) flagsCount = walletDoc.flags.length;

    if (typeof walletDoc?.riskScore === 'number') walletRiskScore = walletDoc.riskScore;
    if (typeof walletDoc?.riskCategory === 'string') walletRiskCategory = walletDoc.riskCategory;

    if (typeof walletDoc?.avgRating === 'number') walletAvgRating = walletDoc.avgRating;
    if (Array.isArray(walletDoc?.ratings)) walletRatingsCount = walletDoc.ratings.length;
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

  // Resolve human-friendly names (ENS / Base). Best-effort; do not block the request.
  let names: { ensName: string | null; baseName: string | null; primaryName: string | null } = {
    ensName: null,
    baseName: null,
    primaryName: null,
  };
  try {
    names = await resolveNames(user.address);
  } catch {
    // ignore
  }

  // Reputation: 0..100 where higher is better. Avoid accusatory language.
  const risk = typeof walletRiskScore === 'number' && Number.isFinite(walletRiskScore) ? Math.max(0, Math.min(100, Math.round(walletRiskScore))) : null;
  const reputationScore = risk == null ? null : Math.max(0, Math.min(100, 100 - risk));
  const reputationLabel =
    reputationScore == null ? 'Unknown' :
    reputationScore >= 80 ? 'Strong' :
    reputationScore >= 60 ? 'Good' :
    reputationScore >= 40 ? 'Mixed' :
    reputationScore >= 20 ? 'Caution' :
    'High risk signals';

  const reputationTooltip =
    'Automated signal based on on-chain patterns and community reports. This is informational and may be incomplete.';

  // Lightweight activity feed (best-effort).
  const followedWallets = Array.isArray((user as any).followedWallets) ? (user as any).followedWallets : [];
  const activity = [...followedWallets]
    .sort((a: any, b: any) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime())
    .slice(0, 10)
    .map((w: any) => ({
      type: 'follow',
      createdAt: w.createdAt || null,
      chain: w.chain,
      address: w.address,
      summary: `Followed ${String(w.address || '').slice(0, 6)}...${String(w.address || '').slice(-4)} on ${w.chain}`,
    }));

  const connectedChains = Array.from(new Set(followedWallets.map((w: any) => String(w.chain || '')).filter(Boolean)));

  const socialCredit = computeSocialCreditScore({
    baseVerifiedAt: (user as any).baseVerifiedAt || null,
    kycStatus: user.kycStatus,
    telegram: (user as any).telegram || (user as any).socialLinks?.telegram,
    twitter: (user as any).twitter || (user as any).socialLinks?.twitter,
    discord: (user as any).discord || (user as any).socialLinks?.discord,
    instagram: (user as any).instagram || (user as any).socialLinks?.instagram,
    facebook: (user as any).facebook || (user as any).socialLinks?.facebook,
    linkedin: (user as any).linkedin,
    website: (user as any).website,
    email: (user as any).email,
    emailVerified: !!(user as any).emailVerified,
    avatarUrl: (user as any).avatarUrl,
    nftAvatarUrl: (user as any).nftAvatarUrl,
    connectedChains,
    walletAvgRating,
    walletRatingsCount,
  });

  res.status(200).json({
    address: user.address,
    ensName: names.ensName,
    baseName: names.baseName,
    primaryName: names.primaryName,
    email: (user as any).email,
    emailVerified: (user as any).emailVerified || false,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    nftAvatarUrl: (user as any).nftAvatarUrl,
    udDomain: (user as any).udDomain,
    directoryOptIn: Boolean((user as any).directoryOptIn),
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
    baseVerifiedAt: (user as any).baseVerifiedAt || null,
    baseVerifiedAddress: (user as any).baseVerifiedAddress || null,
    socialCredit,
    donationRequests: user.donationRequests as import('../../lib/types').DonationRequest[],
    featuredCharityId: (user as any).featuredCharityId,
    activeEventId: (user as any).activeEventId,
    donationLink: (user as any).donationLink,
    donationWidgetEmbed: (user as any).donationWidgetEmbed,
    followedWallets: (user as any).followedWallets || [],
    connectedChains,
    reputation: {
      score: reputationScore,
      label: reputationLabel,
      tooltip: reputationTooltip,
      riskScore: risk,
      riskCategory: walletRiskCategory,
    },
    activity,
    verificationScore: score,
    verificationBadge: badge,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
}
