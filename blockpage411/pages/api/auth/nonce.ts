import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import User from 'lib/userModel';
import { randomBytes } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const { address } = req.body;
  if (!address) {
    return res.status(400).json({ message: 'Address required' });
  }
  await dbConnect();
  const nonce = randomBytes(16).toString('hex');
  const now = new Date();
  let user = await User.findOne({ address });
  if (!user) {
    user = await User.create({ address, nonce, nonceCreatedAt: now });
  } else {
    user.nonce = nonce;
    user.nonceCreatedAt = now;
    await user.save();
  }
  res.status(200).json({ nonce });
}
