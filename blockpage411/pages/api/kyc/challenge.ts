import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import dbConnect from 'lib/db';
import User from 'lib/userModel';

const JWT_SECRET = process.env.JWT_SECRET as string;

function getActorAddressFromReq(req: NextApiRequest): string | null {
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

function buildKycMessage(opts: { address: string; nonce: string; issuedAtIso: string }) {
  const { address, nonce, issuedAtIso } = opts;
  return [
    'BlockPages411 KYC Verification',
    `Address: ${address}`,
    `Nonce: ${nonce}`,
    `IssuedAt: ${issuedAtIso}`,
  ].join('\n');
}

// Returns a short-lived message the user must sign to mark KYC verified.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const actor = getActorAddressFromReq(req);
  if (!actor) return res.status(401).json({ message: 'Not authenticated' });

  await dbConnect();
  const user = await User.findOne({ address: actor });
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user.kycStatus === 'verified') {
    return res.status(200).json({ success: true, kycStatus: 'verified', message: 'Already verified' });
  }

  const nonce = crypto.randomBytes(16).toString('hex');
  const issuedAt = new Date();
  const issuedAtIso = issuedAt.toISOString();

  (user as any).kycChallengeNonce = nonce;
  (user as any).kycChallengeIssuedAt = issuedAt;
  await user.save();

  const message = buildKycMessage({ address: actor, nonce, issuedAtIso });
  return res.status(200).json({ success: true, message, issuedAt: issuedAtIso });
}
