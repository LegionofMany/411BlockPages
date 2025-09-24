import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/db';
import AdminAction from '../../lib/adminActionModel';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  // Only allow access if admin (simple check: x-admin-address header must be present)
  const admin = req.headers['x-admin-address']?.toString().toLowerCase();
  if (!admin) return res.status(403).json({ message: 'Not authorized' });
  const actions = await AdminAction.find({}).sort({ timestamp: -1 }).limit(50);
  res.status(200).json({ actions });
}
