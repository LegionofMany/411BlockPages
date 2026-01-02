import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import jwt from 'jsonwebtoken';
import EmailVerification from 'lib/emailVerificationModel';
import User from 'lib/userModel';
import Wallet from 'lib/walletModel';
import getTransporter from 'lib/mailer';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET as string;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  let payload: any;
  try { payload = jwt.verify(token, JWT_SECRET); } catch { return res.status(401).json({ message: 'Invalid token' }); }
  const address = payload?.address;
  if (!address) return res.status(401).json({ message: 'Invalid token payload' });
  await dbConnect();
  const user = await User.findOne({ address });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const { email } = req.body as { email?: string };
  const targetEmail = email || (user as any).email;
  if (!targetEmail) return res.status(400).json({ message: 'No email provided' });

  // generate token
  const tokenStr = crypto.randomBytes(20).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  await EmailVerification.create({ address, email: targetEmail, token: tokenStr, expiresAt });

  // update user/email on record (mark unverified until confirmation)
  user.email = targetEmail;
  (user as any).emailVerified = false;
  await user.save();
  try { await Wallet.findOneAndUpdate({ address }, { $set: { 'kycDetails.email': targetEmail, 'kycDetails.emailVerified': false } }).exec(); } catch {}

  // send email with confirmation link
  try {
    const transporter = getTransporter();
    const from = process.env.MAIL_FROM || process.env.SMTP_USER;
    const appUrl = process.env.APP_URL || 'https://www.blockpages411.com';
    const verifyUrl = `${appUrl}/api/verify/email/confirm?token=${tokenStr}`;
    const mail = {
      from,
      to: targetEmail,
      subject: 'Confirm your email for Blockpages411',
      text: `Click to confirm: ${verifyUrl}`,
      html: `<p>Click the link below to confirm your email for Blockpages411:</p><p><a href="${verifyUrl}">Confirm email</a></p><p>This link expires in 24 hours.</p>`,
    } as any;
    await (transporter as any).sendMail(mail);
  } catch (err) {
    console.warn('Failed sending verification email', err);
  }

  res.status(200).json({ success: true, message: 'Verification email sent' });
}
