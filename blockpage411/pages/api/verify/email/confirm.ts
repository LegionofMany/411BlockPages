import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import EmailVerification from 'lib/emailVerificationModel';
import User from 'lib/userModel';
import Wallet from 'lib/walletModel';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const token = (req.query.token as string) || (req.body && (req.body.token as string));
  if (!token) return res.status(400).json({ message: 'Missing token' });
  await dbConnect();
  const rec = await EmailVerification.findOne({ token });
  if (!rec) return res.status(404).json({ message: 'Invalid or expired token' });
  if (rec.expiresAt.getTime() < Date.now()) {
    await EmailVerification.deleteOne({ _id: rec._id }).catch(()=>{});
    return res.status(400).json({ message: 'Token expired' });
  }

  try {
    await User.findOneAndUpdate({ address: rec.address }, { $set: { email: rec.email, emailVerified: true } }).exec();
    await Wallet.findOneAndUpdate({ address: rec.address }, { $set: { 'kycDetails.email': rec.email, 'kycDetails.emailVerified': true } }).exec();
  } catch (err) {
    console.warn('Error marking email verified', err);
  }
  await EmailVerification.deleteOne({ _id: rec._id }).catch(()=>{});
  // If GET, redirect to profile page with success message; otherwise return JSON
  if (req.method === 'GET') {
    const appUrl = process.env.APP_URL || '/';
    const redirect = `${appUrl}/profile?emailVerified=true`;
    res.writeHead(302, { Location: redirect });
    res.end();
    return;
  }
  res.status(200).json({ success: true });
}
