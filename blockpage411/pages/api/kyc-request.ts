import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import User from 'lib/userModel';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  address: string;
}

const JWT_SECRET = process.env.JWT_SECRET as string;

// POST endpoint to request KYC
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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
  // Only allow if not already pending/verified
  if (user.kycStatus === 'pending' || user.kycStatus === 'verified') {
    return res.status(400).json({ message: 'KYC already requested or verified' });
  }
  user.kycStatus = 'pending';
  user.kycRequestedAt = new Date();
  await user.save();
  // Stub: In production, call Sumsub API and get a KYC session URL
  res.status(200).json({ success: true, kycStatus: user.kycStatus, kycUrl: 'https://sumsub.com/demo-kyc' });
}
