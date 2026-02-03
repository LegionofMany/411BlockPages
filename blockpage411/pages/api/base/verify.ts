import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from 'lib/db';
import User from 'lib/userModel';
import { verifyMessage } from 'ethers';

const JWT_SECRET = process.env.JWT_SECRET as string;

function getUserAddressFromReq(req: NextApiRequest): string | null {
  const token = req.cookies?.token;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { address?: string };
    return payload?.address ? String(payload.address).toLowerCase() : null;
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const actor = getUserAddressFromReq(req);
  if (!actor) return res.status(401).json({ message: 'Not authenticated' });

  const { address, message, signature } = (req.body || {}) as {
    address?: string;
    message?: string;
    signature?: string;
  };

  if (!address || !message || !signature) {
    return res.status(400).json({ message: 'address, message and signature required' });
  }

  let recovered: string;
  try {
    recovered = verifyMessage(message, signature);
  } catch {
    return res.status(400).json({ message: 'Invalid signature' });
  }

  if (recovered.toLowerCase() !== String(address).toLowerCase()) {
    return res.status(400).json({ message: 'Signature does not match address' });
  }

  // Only allow verifying the currently authenticated wallet.
  if (String(address).toLowerCase() !== actor) {
    return res.status(403).json({ message: 'Can only verify your own wallet' });
  }

  await dbConnect();
  const user = await User.findOne({ address: actor });
  if (!user) return res.status(404).json({ message: 'User not found' });

  (user as any).baseVerifiedAt = new Date();
  (user as any).baseVerifiedAddress = actor;
  await user.save();

  return res.status(200).json({ success: true, baseVerifiedAt: (user as any).baseVerifiedAt });
}
