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
  displayName: z.string().max(64).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  nftAvatarUrl: z.string().url().nullable().optional(),
  udDomain: z.string().max(255).nullable().optional(),
  directoryOptIn: z.boolean().nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  telegram: z.string().nullable().optional(),
  twitter: z.string().nullable().optional(),
  discord: z.string().nullable().optional(),
  linkedin: z.string().nullable().optional(),
  website: z.string().url().nullable().optional(),
  instagram: z.string().nullable().optional(),
  facebook: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  phoneApps: z.preprocess((val) => {
    if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
    return val;
  }, z.array(z.string()).nullable().optional()),
  email: z.string().email().nullable().optional(),
  featuredCharityId: z.string().nullable().optional(),
  donationLink: z.string().nullable().optional(),
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

  update.updatedAt = new Date();

  await dbConnect();
  let user = await User.findOne({ address: walletAddress });
  const now = new Date();

  const kycLockedFields = new Set(['telegram', 'twitter', 'discord', 'website', 'phoneApps', 'email']);

  if (user) {
    user.profileUpdateHistory = user.profileUpdateHistory || [];
    user.profileUpdateHistory = user.profileUpdateHistory.filter((d: Date) => now.getTime() - new Date(d).getTime() < 24 * 60 * 60 * 1000);
    if (user.profileUpdateHistory.length >= 5) return res.status(429).json({ message: 'Profile update limit reached (5 per day)' });
    user.profileUpdateHistory.push(now);

    // KYC lock: once verified, freeze sensitive fields.
    if ((user as any).kycStatus === 'verified') {
      for (const key of Object.keys(update)) {
        if (kycLockedFields.has(key) && update[key] !== undefined) {
          return res.status(403).json({ message: `Cannot update ${key} after KYC verification` });
        }
      }
    }

    // Apply updates without clobbering unrelated fields.
    const $set: any = { updatedAt: now, profileUpdateHistory: user.profileUpdateHistory };
    const $unset: any = {};

    for (const [key, rawVal] of Object.entries(update)) {
      if (rawVal === undefined) continue;
      const shouldClear = rawVal === null || (typeof rawVal === 'string' && rawVal.trim() === '');
      if (shouldClear) {
        $unset[key] = 1;
      } else {
        $set[key] = rawVal;
      }
    }

    const updateDoc: any = { $set };
    if (Object.keys($unset).length) updateDoc.$unset = $unset;

    const updated = await User.findOneAndUpdate({ address: walletAddress }, updateDoc, { new: true });
    user = (updated as any) || user;
  } else {
    // Create new user document with minimal required fields
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
