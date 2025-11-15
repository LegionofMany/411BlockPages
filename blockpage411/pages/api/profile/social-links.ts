import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import User from 'lib/userModel';
import Wallet from 'lib/walletModel';
import jwt from 'jsonwebtoken';
import { computeTrustScore } from 'services/trustScoreService';

interface JwtPayload { address: string }

const JWT_SECRET = process.env.JWT_SECRET as string;

function getUserAddressFromReq(req: NextApiRequest): string | null {
  const token = req.cookies.token;
  if (!token || !JWT_SECRET) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return payload.address;
  } catch {
    return null;
  }
}

function sanitizeHandle(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined;
  const v = input.trim();
  if (!v) return undefined;
  if (v.length > 200) return undefined;
  if (v.includes('<') || v.includes('>')) return undefined;
  return v;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const address = getUserAddressFromReq(req);
  if (!address) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  await dbConnect();
  const user = await User.findOne({ address });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (req.method === 'GET') {
    const social = (user as any).socialLinks || {};
    res.status(200).json({
      twitter: social.twitter || user.twitter || undefined,
      instagram: social.instagram || user.instagram || undefined,
      facebook: social.facebook || user.facebook || undefined,
      telegram: social.telegram || user.telegram || undefined,
      whatsapp: social.whatsapp || user.whatsapp || undefined,
      discord: social.discord || user.discord || undefined,
      verified: social.verified || {},
      trustScore: social.trustScore || 0,
    });
    return;
  }

  if (req.method !== 'POST' && req.method !== 'PATCH') {
    res.setHeader('Allow', 'GET, POST, PATCH');
    res.status(405).end('Method Not Allowed');
    return;
  }

  const body = req.body || {};
  const social = (user as any).socialLinks || {};

  const nextSocial: any = { ...social };
  const fields = ['twitter', 'instagram', 'facebook', 'telegram', 'whatsapp', 'discord'] as const;
  for (const field of fields) {
    if (field in body) {
      nextSocial[field] = sanitizeHandle(body[field]) || undefined;
    }
  }

  (user as any).socialLinks = nextSocial;

  // recompute trustScore based on verified links and wallet flags
  const verified = nextSocial.verified as Map<string, boolean> | Record<string, boolean> | undefined;
  let verifiedLinksCount = 0;
  if (verified) {
    const entries = verified instanceof Map ? Array.from(verified.entries()) : Object.entries(verified);
    verifiedLinksCount = entries.filter(([, v]) => !!v).length;
  }

  let flagsCount = 0;
  try {
    const walletDoc = await Wallet.findOne({ address: address.toLowerCase(), chain: 'eth' }).lean() as any;
    if (walletDoc?.flagsCount != null) flagsCount = walletDoc.flagsCount;
    else if (Array.isArray(walletDoc?.flags)) flagsCount = walletDoc.flags.length;
  } catch {
    // ignore
  }

  const trustScore = computeTrustScore({ verifiedLinksCount, flagsCount });
  (user as any).socialLinks.trustScore = trustScore;

  await user.save();

  res.status(200).json({
    ...nextSocial,
    trustScore,
  });
}
