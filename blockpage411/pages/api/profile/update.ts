import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import User from 'lib/userModel';
import Wallet from 'lib/walletModel';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { resolveWalletInput } from 'services/resolveWalletInput';

const JWT_SECRET = process.env.JWT_SECRET as string;

const ProfileUpdateSchema = z.object({
  walletAddress: z.string().min(1),
  displayName: z.string().max(64).optional(),
  avatarUrl: z.string().url().optional(),
  nftAvatarUrl: z.string().url().optional(),
  udDomain: z.string().max(255).optional(),
  directoryOptIn: z.boolean().optional(),
  bio: z.string().max(500).optional(),
  telegram: z.string().optional(),
  twitter: z.string().optional(),
  discord: z.string().optional(),
  website: z.string().url().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  whatsapp: z.string().optional(),
  phoneApps: z.preprocess((val) => {
    if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
    return val;
  }, z.array(z.string()).optional()),
  email: z.string().email().optional(),
  featuredCharityId: z.string().optional(),
  donationLink: z.string().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT' && req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  let payload: any;
  try { payload = jwt.verify(token, JWT_SECRET); } catch { return res.status(401).json({ message: 'Invalid token' }); }
  const actor = payload && typeof payload === 'object' ? payload.address : undefined;
  if (!actor) return res.status(401).json({ message: 'Invalid token payload' });

  const body = req.body || {};
  const parsed = ProfileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid request', errors: parsed.error.format() });
  }

  const walletAddress = parsed.data.walletAddress.toLowerCase();
  if (walletAddress !== actor.toLowerCase()) return res.status(403).json({ message: 'Can only update your own profile' });

  const update = { ...parsed.data } as any;
  delete update.walletAddress;

  // UD domain validation + ownership verification (best-effort, but must match if provided)
  if (typeof update.udDomain === 'string') {
    const raw = update.udDomain.trim();
    if (!raw) {
      update.udDomain = undefined;
    } else {
      const lower = raw.toLowerCase();
      const isUd = /\.(crypto|nft|x|wallet|dao|blockchain|bitcoin|888)$/i.test(lower);
      if (!isUd) {
        return res.status(400).json({ message: 'Invalid UD domain. Supported TLDs: .crypto .nft .x .wallet .dao .blockchain .bitcoin .888' });
      }
      try {
        const resolved = await resolveWalletInput(lower);
        if (!resolved || !resolved.address) {
          return res.status(400).json({ message: 'Unable to resolve UD domain to an address.' });
        }
        if (String(resolved.address).toLowerCase() !== walletAddress.toLowerCase()) {
          return res.status(400).json({ message: 'UD domain does not resolve to your wallet. Please verify ownership and try again.' });
        }
        update.udDomain = lower;
      } catch {
        return res.status(400).json({ message: 'Unable to verify UD domain right now. Please try again later.' });
      }
    }
  }

  update.updatedAt = new Date();

  await dbConnect();
  // rate limit: max 5 updates per 24h
  let user = await User.findOne({ address: walletAddress });
  const now = new Date();
  if (user) {
    user.profileUpdateHistory = user.profileUpdateHistory || [];
    user.profileUpdateHistory = user.profileUpdateHistory.filter((d: Date) => now.getTime() - new Date(d).getTime() < 24 * 60 * 60 * 1000);
    if (user.profileUpdateHistory.length >= 5) return res.status(429).json({ message: 'Profile update limit reached (5 per day)' });
    user.profileUpdateHistory.push(now);
    // apply updates via findOneAndUpdate to avoid race
    const setObj: any = { ...update, updatedAt: now, profileUpdateHistory: user.profileUpdateHistory };
    const updated = await User.findOneAndUpdate({ address: walletAddress }, { $set: setObj }, { new: true });
    user = (updated as any) || user;
  } else {
    // create new user document with minimal required fields
    const createObj: any = { address: walletAddress, nonce: '', nonceCreatedAt: now, profileUpdateHistory: [now], ...update, createdAt: now, updatedAt: now };
    user = await User.create(createObj);
  }

  // If the incoming update contains a new avatarUrl, and the user had a previous uploaded avatar
  // stored under our uploads folder, remove the old file to avoid orphaned files.
  try {
    if (update.avatarUrl && user && (user as any).avatarUrl && (user as any).avatarUrl !== update.avatarUrl) {
      const prevUrl: string = (user as any).avatarUrl;
      // We only remove files that were uploaded to our avatars folder: /uploads/avatars/<filename>
      const match = prevUrl.match(/\/uploads\/avatars\/(.+)$/);
      if (match && match[1]) {
        const prevFilename = path.basename(match[1]);
        const prevPath = path.join(process.cwd(), 'public', 'uploads', 'avatars', prevFilename);
        if (fs.existsSync(prevPath)) {
          try { fs.unlinkSync(prevPath); } catch (e) { console.warn('Failed to remove previous avatar', prevPath, e); }
        }
      }
    }
  } catch (err) {
    // non-fatal
    console.warn('avatar cleanup failed', err && (err as Error).message ? (err as Error).message : err);
  }

  // mirror key profile fields to Wallet.socials where appropriate
  try {
    const walletUpdate: any = {};
    if (update.displayName) walletUpdate['socials.displayName'] = update.displayName;
    if (update.avatarUrl || update.nftAvatarUrl) walletUpdate['socials.avatarUrl'] = update.avatarUrl || update.nftAvatarUrl;
    if (update.bio) walletUpdate['socials.bio'] = update.bio;
    if (Object.keys(walletUpdate).length > 0) {
      // prefer returning the promise; some test mocks may not provide .exec()
      const q = Wallet.updateMany({ address: walletAddress }, { $set: walletUpdate });
      if (typeof (q as any).exec === 'function') await (q as any).exec(); else await q;
    }
  } catch (err) {
    // ignore wallet mirror failures
    console.warn('profile:update wallet mirror failed', err && (err as Error).message ? (err as Error).message : err);
  }

  res.status(200).json({ success: true, profile: user });
}
