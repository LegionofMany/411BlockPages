import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import User from 'lib/userModel';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  address: string;
}

const JWT_SECRET = process.env.JWT_SECRET as string;

// POST endpoint to request KYC (admin-verified flow)
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
  // If already requested/verified, return an informative response
  if (user.kycStatus === 'pending') {
    return res.status(200).json({ success: true, kycStatus: 'pending', message: 'KYC already requested — waiting for admin review' });
  }
  if (user.kycStatus === 'verified') {
    return res.status(200).json({ success: true, kycStatus: 'verified', message: 'Already verified' });
  }

  // Mark as pending and persist — admin will verify manually using /admin/kyc
  user.kycStatus = 'pending';
  user.kycRequestedAt = new Date();
  await user.save();

  // Create audit log and notify admins
  try {
    const AuditLog = require('../../lib/auditLogModel').default;
    await AuditLog.create({
      type: 'kyc.request',
      actor: user.address,
      target: user.address,
      action: 'request',
      meta: { requestedAt: user.kycRequestedAt },
    });
  } catch (e) {
    console.warn('Failed to write audit log for KYC request', e);
  }
  try {
    const { notifyAdmin } = require('../../lib/notify');
    notifyAdmin(`KYC requested for ${user.address}`, { address: user.address, requestedAt: user.kycRequestedAt });
  } catch (e) {
    console.warn('notifyAdmin error', e);
  }

  res.status(200).json({ success: true, kycStatus: user.kycStatus, message: 'KYC requested — an admin will review and verify.' });
}
