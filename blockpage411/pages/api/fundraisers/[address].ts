import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import Fundraiser from 'models/Fundraiser';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { address } = req.query;
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  if (!address || typeof address !== 'string') return res.status(400).json({ message: 'Address required' });
  await dbConnect();
  const now = new Date();
  const docs = await Fundraiser.find({ walletAddress: address.toString(), active: true, $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }] }).lean();
  res.status(200).json({ fundraisers: docs });
}
