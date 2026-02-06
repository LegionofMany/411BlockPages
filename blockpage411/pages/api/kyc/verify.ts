import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from 'lib/db';
import User from 'lib/userModel';
import Wallet from 'lib/walletModel';
import { verifySignature } from 'utils/verifySignature';

const JWT_SECRET = process.env.JWT_SECRET as string;
const CHALLENGE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const actor = getActorAddressFromReq(req);
  if (!actor) return res.status(401).json({ message: 'Not authenticated' });

  const signature = String((req.body as any)?.signature || '').trim();
  if (!signature) return res.status(400).json({ message: 'Missing signature' });

  await dbConnect();
  const user = await User.findOne({ address: actor });
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user.kycStatus === 'verified') {
    return res.status(200).json({ success: true, kycStatus: 'verified', message: 'Already verified' });
  }

  const nonce = String((user as any).kycChallengeNonce || '');
  const issuedAt = (user as any).kycChallengeIssuedAt ? new Date((user as any).kycChallengeIssuedAt) : null;
  if (!nonce || !issuedAt) {
    return res.status(400).json({ message: 'KYC challenge missing. Request a new challenge.' });
  }

  const ageMs = Date.now() - issuedAt.getTime();
  if (ageMs > CHALLENGE_MAX_AGE_MS) {
    return res.status(400).json({ message: 'KYC challenge expired. Request a new challenge.' });
  }

  const issuedAtIso = issuedAt.toISOString();
  const message = buildKycMessage({ address: actor, nonce, issuedAtIso });

  const ok = await verifySignature(actor, message, signature);
  if (!ok) return res.status(400).json({ message: 'Invalid signature' });

  user.kycStatus = 'verified';
  user.kycVerifiedAt = new Date();
  (user as any).kycSignature = signature;
  (user as any).kycChallengeNonce = undefined;
  (user as any).kycChallengeIssuedAt = undefined;
  await user.save();

  // Best-effort: mirror to any Wallet docs for this address.
  try {
    await Wallet.updateMany({ address: actor }, { $set: { kycStatus: 'verified', 'kycDetails.reviewedAt': user.kycVerifiedAt } });
  } catch {
    // non-fatal
  }

  return res.status(200).json({ success: true, kycStatus: 'verified', verifiedAt: user.kycVerifiedAt });
}
