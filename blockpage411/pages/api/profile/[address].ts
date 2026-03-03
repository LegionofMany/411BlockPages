import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import User from 'lib/userModel';
import WalletRisk from 'lib/walletriskmodel';

function looksLikeMetadataUrl(url: string): boolean {
  const u = url.trim().toLowerCase();
  if (!u) return false;
  // Common NFT metadata patterns
  if (u.endsWith('.json')) return true;
  if (u.includes('/metadata/') && u.includes('.json')) return true;
  if (u.includes('metadata') && u.includes('.json')) return true;
  return false;
}

function looksLikeImageUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  const u = url.trim();
  if (!u) return false;
  const lc = u.toLowerCase();
  if (looksLikeMetadataUrl(lc)) return false;
  if (lc.startsWith('data:image/')) return true;
  if (lc.startsWith('/uploads/avatars/') || lc.startsWith('/api/avatar/') || lc.startsWith('/avatars/')) return true;
  // If it has a typical image extension, accept.
  if (/\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i.test(lc)) return true;
  // Otherwise, accept common CDN-hosted images (Cloudinary URLs often end with an image extension,
  // but allow it as a best-effort when not clearly metadata).
  if (lc.startsWith('http://') || lc.startsWith('https://')) return true;
  return false;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  const { address } = req.query as { address?: string };
  if (!address) return res.status(400).json({ message: 'Address required' });
  const norm = String(address).toLowerCase();
  await dbConnect();
  const user = (await User.findOne({ address: norm }).lean()) as any;
  // Return a stable shape even when no profile exists.
  // This avoids noisy 404s in the client for wallets that haven't created a profile yet.
  const out: any = user
    ? {
        address: user.address,
        displayName: user.displayName,
        // Prefer uploaded avatarUrl, only fall back to nftAvatarUrl when it looks like an actual image.
        avatarUrl: (() => {
          const a = user.avatarUrl;
          const n = user.nftAvatarUrl;
          if (looksLikeImageUrl(a)) return a;
          if (looksLikeImageUrl(n)) return n;
          return null;
        })(),
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
        exists: true,
      }
    : {
        address: norm,
        displayName: null,
        avatarUrl: null,
        udDomain: null,
        directoryOptIn: false,
        bio: null,
        socialLinks: {},
        featuredCharityId: null,
        updatedAt: null,
        exists: false,
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
