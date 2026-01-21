import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import User from 'lib/userModel';
import { resolveWalletInput } from 'services/resolveWalletInput';
import { isAddress } from 'viem';

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function safeString(v: unknown, max = 500): string {
  const s = typeof v === 'string' ? v : v == null ? '' : String(v);
  return s.length > max ? s.slice(0, max) : s;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'), 10) || 20));
  const skip = (page - 1) * limit;
  const q = safeString(Array.isArray(req.query.q) ? req.query.q[0] : req.query.q, 200).trim();

  await dbConnect();

  let resolvedAddress: string | null = null;
  if (q) {
    if (isAddress(q)) {
      resolvedAddress = q.toLowerCase();
    } else {
      try {
        const resolved = await resolveWalletInput(q);
        if (resolved?.address) resolvedAddress = String(resolved.address).toLowerCase();
      } catch {
        // ignore resolution failures
      }
    }
  }

  const filter: any = { directoryOptIn: true };

  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    const or: any[] = [];

    if (resolvedAddress) or.push({ address: resolvedAddress });

    or.push(
      { displayName: { $regex: rx } },
      { udDomain: { $regex: rx } },
      { bio: { $regex: rx } },
      { website: { $regex: rx } },
      { telegram: { $regex: rx } },
      { twitter: { $regex: rx } },
      { discord: { $regex: rx } },
      { 'socialLinks.twitter': { $regex: rx } },
      { 'socialLinks.telegram': { $regex: rx } },
      { 'socialLinks.discord': { $regex: rx } },
      { phoneApps: { $elemMatch: { $regex: rx } } },
    );

    filter.$or = or;
  }

  const projection = {
    address: 1,
    displayName: 1,
    avatarUrl: 1,
    nftAvatarUrl: 1,
    udDomain: 1,
    bio: 1,
    website: 1,
    twitter: 1,
    telegram: 1,
    discord: 1,
    phoneApps: 1,
    socialLinks: 1,
    directoryOptIn: 1,
    updatedAt: 1,
  };

  const [items, total] = await Promise.all([
    (User as any).find(filter, projection).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    (User as any).countDocuments(filter),
  ]);

  const results = (Array.isArray(items) ? items : []).map((u: any) => ({
    address: safeString(u?.address, 64).toLowerCase(),
    displayName: safeString(u?.displayName, 64) || null,
    avatarUrl: safeString(u?.avatarUrl || u?.nftAvatarUrl || '', 500) || null,
    udDomain: safeString(u?.udDomain, 255) || null,
    bio: safeString(u?.bio, 500) || null,
    website: safeString(u?.website, 500) || null,
    twitter: safeString(u?.socialLinks?.twitter || u?.twitter, 120) || null,
    telegram: safeString(u?.socialLinks?.telegram || u?.telegram, 120) || null,
    discord: safeString(u?.socialLinks?.discord || u?.discord, 120) || null,
    phoneApps: Array.isArray(u?.phoneApps) ? u.phoneApps.map((p: any) => safeString(p, 40)).slice(0, 8) : [],
    updatedAt: u?.updatedAt || null,
  }));

  return res.status(200).json({
    page,
    limit,
    total,
    results,
    resolvedAddress,
  });
}
