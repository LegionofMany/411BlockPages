import type { NextApiRequest, NextApiResponse } from 'next';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import dbConnect from 'lib/db';
import User from 'lib/userModel';
import Wallet from 'lib/walletModel';
import { resolveWalletInput } from 'services/resolveWalletInput';

const JWT_SECRET = process.env.JWT_SECRET as string;

type UserProfile = import('../../../lib/types').UserProfile;

function generateNonce() {
  return randomBytes(16).toString('hex');
}

// Intentionally lenient: draft saves should not be blocked by strict validation.
const DraftProfileSchema = z.object({
  displayName: z.string().max(64).nullable().optional(),
  avatarUrl: z.string().max(2048).nullable().optional(),
  nftAvatarUrl: z.string().max(2048).nullable().optional(),
  udDomain: z.string().max(255).nullable().optional(),
  directoryOptIn: z.boolean().nullable().optional(),
  bio: z.string().max(2000).nullable().optional(),
  telegram: z.string().max(255).nullable().optional(),
  twitter: z.string().max(255).nullable().optional(),
  discord: z.string().max(255).nullable().optional(),
  linkedin: z.string().max(255).nullable().optional(),
  website: z.string().max(2048).nullable().optional(),
  instagram: z.string().max(255).nullable().optional(),
  facebook: z.string().max(255).nullable().optional(),
  whatsapp: z.string().max(255).nullable().optional(),
  phoneApps: z.union([z.array(z.string()), z.string()]).nullable().optional(),
  // email is stored on the User doc; not used for login.
  email: z.string().max(320).nullable().optional(),
  featuredCharityId: z.string().max(128).nullable().optional(),
  activeEventId: z.string().max(128).nullable().optional(),
  donationLink: z.string().max(2048).nullable().optional(),
  donationWidgetEmbed: z
    .object({
      widgetId: z.string().max(128).optional(),
      charityId: z.string().max(128).optional(),
    })
    .nullable()
    .optional(),
  donationRequests: z.any().optional(),
});

function getActorAddress(req: NextApiRequest): string | null {
  const token = req.cookies?.token;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const addr = payload && typeof payload === 'object' ? String(payload.address || '') : '';
    return addr ? addr.toLowerCase() : null;
  } catch {
    return null;
  }
}

const KYC_LOCKED_FIELDS = new Set<string>(['telegram', 'twitter', 'discord', 'website', 'phoneApps', 'email']);

function parseUdCandidates(raw: unknown): string[] {
  if (raw == null) return [];
  const s = String(raw).trim();
  if (!s) return [];

  // Accept common paste formats like:
  // - "yourname.crypto"
  // - "https://ud.me/yourname.crypto"
  // - multiple lines/commas
  const tokens = s
    .split(/[\n,\t\r ]+/g)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => {
      const v = t.replace(/^@/, '');
      try {
        if (/^https?:\/\//i.test(v)) {
          const u = new URL(v);
          const last = u.pathname.split('/').filter(Boolean).slice(-1)[0] || '';
          return (last || '').trim();
        }
      } catch {
        // ignore
      }
      // if user pasted like ud.me/<domain> without scheme
      const m = v.match(/ud\.me\/(.+)$/i);
      if (m && m[1]) return String(m[1]).split(/[?#]/)[0].trim();
      return v;
    })
    .filter(Boolean);

  // de-dupe while preserving order
  const out: string[] = [];
  const seen = new Set<string>();
  for (const t of tokens) {
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).json({ message: 'Method not allowed' });

  const actor = getActorAddress(req);
  if (!actor) return res.status(401).json({ message: 'Not authenticated' });

  try {
    const parsed = DraftProfileSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
    }

    await dbConnect();

    const now = new Date();
    let user = await User.findOne({ address: actor });
    if (!user) {
      user = await User.create({
        address: actor,
        nonce: generateNonce(),
        nonceCreatedAt: now,
        createdAt: now,
        updatedAt: now,
        profileUpdateHistory: [],
      });
    }

    // Rate limit: max 5 profile updates per day (draft autosave can be noisy, but we keep existing limit).
    user.profileUpdateHistory = (user.profileUpdateHistory || []).filter(
      (d: Date) => now.getTime() - new Date(d).getTime() < 24 * 60 * 60 * 1000
    );
    if (user.profileUpdateHistory.length >= 5) {
      return res.status(429).json({ message: 'Profile update limit reached (5 per day)' });
    }

    const body: any = parsed.data;

    // UD ownership verification: if udDomain is provided, ensure it resolves to this wallet.
    if (Object.prototype.hasOwnProperty.call(body, 'udDomain')) {
      const rawUd = body.udDomain;
      const trimmed = rawUd == null ? '' : String(rawUd).trim();
      if (!trimmed) {
        // allow clearing
        body.udDomain = '';
      } else {
        const candidates = parseUdCandidates(rawUd);
        let verified: string | null = null;
        for (const c of candidates) {
          try {
            const resolved = await resolveWalletInput(c);
            if (resolved?.address && resolved.address.toLowerCase() === actor.toLowerCase()) {
              verified = c.toLowerCase();
              break;
            }
          } catch {
            // ignore per-candidate
          }
        }
        if (!verified) {
          return res.status(400).json({ message: 'UD domain does not resolve to your wallet. Paste your UD domain (e.g. name.crypto) that points to your wallet.' });
        }
        body.udDomain = verified;
      }
    }

    // KYC lock: once verified, freeze sensitive fields.
    if (user.kycStatus === 'verified') {
      for (const key of Object.keys(body)) {
        if (KYC_LOCKED_FIELDS.has(key) && body[key] !== undefined) {
          return res.status(403).json({ message: `Cannot update ${key} after KYC verification` });
        }
      }
    }

    const setObj: Record<string, any> = {};
    const unsetObj: Record<string, any> = {};

    for (const [key, rawVal] of Object.entries(body)) {
      if (rawVal === undefined) continue;

      // Normalize phoneApps.
      let val: any = rawVal;
      if (key === 'phoneApps') {
        if (typeof val === 'string') {
          val = val
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        }
      }

      const shouldClear =
        val === null ||
        (typeof val === 'string' && val.trim() === '') ||
        (key === 'donationWidgetEmbed' && typeof val === 'object' && val && !val.widgetId && !val.charityId);

      if (shouldClear) {
        unsetObj[key] = 1;
        continue;
      }

      setObj[key] = val;
    }

    setObj.updatedAt = now;
    user.profileUpdateHistory.push(now);

    const updateDoc: any = { $set: setObj };
    if (Object.keys(unsetObj).length) updateDoc.$unset = unsetObj;

    const updated = await User.findOneAndUpdate({ address: actor }, updateDoc, { new: true });

    // Best-effort mirror for Wallet socials.
    try {
      const walletUpdate: any = {};
      if (setObj.displayName) walletUpdate['socials.displayName'] = setObj.displayName;
      if (setObj.avatarUrl || setObj.nftAvatarUrl) walletUpdate['socials.avatarUrl'] = setObj.avatarUrl || setObj.nftAvatarUrl;
      if (setObj.bio) walletUpdate['socials.bio'] = setObj.bio;
      if (Object.keys(walletUpdate).length > 0) {
        await Wallet.updateMany({ address: actor }, { $set: walletUpdate });
      }
    } catch {
      // non-fatal
    }

    return res.status(200).json({ success: true, profile: updated || user });
  } catch (err: any) {
    const code = typeof err?.code === 'string' ? err.code : undefined;

    // Mongoose/mongo errors we can safely classify.
    const name = typeof err?.name === 'string' ? err.name : undefined;
    if (name === 'CastError') {
      return res.status(400).json({
        success: false,
        code: 'MONGOOSE_CAST_ERROR',
        message: 'Invalid value for one or more fields.',
        field: typeof err?.path === 'string' ? err.path : undefined,
      });
    }
    if (name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        code: 'MONGOOSE_VALIDATION_ERROR',
        message: 'Validation failed for one or more fields.',
        errors: err?.errors
          ? Object.values(err.errors).map((e: any) => ({
              path: typeof e?.path === 'string' ? e.path : undefined,
              message: typeof e?.message === 'string' ? e.message : undefined,
              kind: typeof e?.kind === 'string' ? e.kind : undefined,
            }))
          : undefined,
      });
    }

    // dbConnect() throws typed errors we can safely surface.
    if (code === 'MONGODB_URI_MISSING' || code === 'MONGODB_DISABLED' || code === 'MONGODB_CONNECT_FAILED') {
      return res.status(503).json({
        success: false,
        code,
        message:
          code === 'MONGODB_URI_MISSING'
            ? 'Server is missing MONGODB_URI configuration.'
            : code === 'MONGODB_DISABLED'
              ? 'Server has MongoDB disabled via environment settings.'
              : 'Server could not connect to MongoDB.',
      });
    }

    console.error('PATCH /api/profile failed', {
      actor,
      message: err?.message,
      name: err?.name,
      code,
    });

    return res.status(500).json({
      success: false,
      code: 'PROFILE_PATCH_FAILED',
      message: 'Internal server error while saving profile.',
    });
  }
}
