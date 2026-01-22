import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import User from 'lib/userModel';
import WalletRisk from 'lib/walletriskmodel';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  const { address } = req.query as { address?: string };
  if (!address) return res.status(400).json({ message: 'Address required' });
  const norm = String(address).toLowerCase();
  await dbConnect();
  const user = (await User.findOne({ address: norm }).lean()) as any;
  if (!user) return res.status(404).json({ message: 'Profile not found' });
  // return only public fields
  const out: any = {
    address: user.address,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl || user.nftAvatarUrl,
    udDomain: user.udDomain,
    directoryOptIn: Boolean(user.directoryOptIn),
    bio: user.bio,
    socialLinks: user.socialLinks || {
      twitter: user.twitter,
      telegram: user.telegram,
      discord: user.discord,
      website: user.website,
      instagram: user.instagram,
      facebook: user.facebook,
      whatsapp: user.whatsapp,
    },
    featuredCharityId: user.featuredCharityId,
    updatedAt: user.updatedAt,
  };
  // Attach WalletRisk data (additive, non-breaking): per-chain entries with source attribution
  try {
    const risks = (await WalletRisk.find({ address: norm }).lean()) || [];
    if (risks.length > 0) {
      out['walletRisks'] = risks.map((r: any) => ({
        chain: r.chain,
        risk_score: typeof r.risk_score === 'number' ? r.risk_score : r.risk_score || 0,
        risk_level: r.risk_level || 'low',
        flags: r.flags || [],
        behavior_signals: r.behavior_signals || {},
        last_updated: r.last_updated || r.updatedAt || r.createdAt,
      }));
    }
  } catch (err) {
    // Non-fatal: do not block the profile response if risk lookup fails
    console.warn('WalletRisk lookup failed', err);
  }
  res.status(200).json(out);
}
