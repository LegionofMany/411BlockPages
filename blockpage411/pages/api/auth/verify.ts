import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import User from 'lib/userModel';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import { verifyMessage } from 'ethers';

const JWT_SECRET = process.env.JWT_SECRET as string;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('AUTH VERIFY: method', req.method, 'body', req.body);
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const { address, signature } = req.body;
  if (!address || !signature) {
    return res.status(400).json({ message: 'Address and signature required' });
  }
  await dbConnect();
  const user = await User.findOne({ address });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  // Check nonce expiry (5 min)
  const now = new Date();
  if (now.getTime() - new Date(user.nonceCreatedAt).getTime() > 5 * 60 * 1000) {
    return res.status(400).json({ message: 'Nonce expired' });
  }
  const message = `Login nonce: ${user.nonce}`;
  let recovered;
  try {
    recovered = verifyMessage(message, signature);
  } catch {
    return res.status(400).json({ message: 'Invalid signature' });
  }
  if (recovered.toLowerCase() !== address.toLowerCase()) {
    return res.status(400).json({ message: 'Signature does not match address' });
  }
  // Issue JWT
  const token = jwt.sign({ address }, JWT_SECRET, { expiresIn: '1d' });
  const isProd = process.env.NODE_ENV === 'production';
  // Use cookie.serialize to ensure correct formatting across browsers
  const serialized = serialize('token', token, {
    httpOnly: true,
    path: '/',
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 60 * 60 * 24, // 1 day
  });
  console.log('AUTH VERIFY: setting cookie', serialized);
  res.setHeader('Set-Cookie', serialized);
  res.status(200).json({ success: true });
}
