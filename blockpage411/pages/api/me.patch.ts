import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import User from 'lib/userModel';
import Charity from 'models/Charity';
import Event from 'models/Event';
import { profileUpdateSchema } from 'lib/validation/schemas';
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
  const alwaysAllowed: (keyof import('../../lib/types').UserProfile)[] = ['displayName', 'avatarUrl', 'bio', 'donationRequests', 'featuredCharityId', 'activeEventId', 'donationLink', 'donationWidgetEmbed', 'nftAvatarUrl'];
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
  let body = req.body as Partial<import('../../lib/types').UserProfile>;
  try {
    const parsed = profileUpdateSchema.partial().parse(req.body || {});
    // Normalize phoneApps to array of strings if provided as comma separated string
    if (typeof parsed.phoneApps === 'string') {
      parsed.phoneApps = parsed.phoneApps
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    body = parsed as any;
  } catch (err: any) {
    return res.status(400).json({ message: 'Invalid payload', details: err?.errors ?? String(err) });
  }
  for (const field of alwaysAllowed) {
    if (body[field] !== undefined) {
      // special validation for charity presets
      if (field === 'featuredCharityId') {
        const val = body.featuredCharityId;
        if (val === null || val === '') {
          user.featuredCharityId = undefined as any;
        } else if (typeof val === 'string') {
          const trimmed = val.trim();
          if (!trimmed) {
            user.featuredCharityId = undefined as any;
          } else {
            const charity = await Charity.findOne({ charityId: trimmed }).lean();
            if (!charity) {
              return res.status(400).json({ message: 'featuredCharityId does not match any known charity' });
            }
            user.featuredCharityId = trimmed;
          }
        }
      } else if (field === 'activeEventId') {
        const val = body.activeEventId;
        if (val === null || val === '') {
          user.activeEventId = undefined as any;
        } else if (typeof val === 'string') {
          const trimmed = val.trim();
          if (!trimmed) {
            user.activeEventId = undefined as any;
          } else {
            const event = await Event.findById(trimmed).lean();
            if (!event) {
              return res.status(400).json({ message: 'activeEventId does not match any known event' });
            }
            if (String((event as any).creatorUserId) !== String(user._id)) {
              return res.status(403).json({ message: 'You can only select your own events as activeEventId' });
            }
            user.activeEventId = trimmed as any;
          }
        }
      } else if (field === 'donationLink') {
        const val = body.donationLink;
        if (val === null || val === '') {
          user.donationLink = undefined as any;
        } else if (typeof val === 'string' && val.startsWith('https://')) {
          user.donationLink = val;
        } else {
          return res.status(400).json({ message: 'donationLink must be a https URL' });
        }
      } else if (field === 'donationWidgetEmbed') {
        const cfg = body.donationWidgetEmbed as { widgetId?: string; charityId?: string } | undefined;
        if (!cfg || (!cfg.widgetId && !cfg.charityId)) {
          user.donationWidgetEmbed = undefined as any;
        } else if (typeof cfg === 'object') {
          user.donationWidgetEmbed = {
            widgetId: cfg.widgetId || undefined,
            charityId: cfg.charityId || undefined,
          } as any;
        }
      } else {
        user[field] = body[field] as any;
      }
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
