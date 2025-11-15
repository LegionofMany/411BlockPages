import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import User from '../../../lib/userModel';
import { withAdminAuth } from '../../../lib/adminMiddleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  await dbConnect();
  const users = await User.find({ pendingSocialVerifications: { $exists: true, $ne: [] } }).lean();
  res.status(200).json({ users: users.map(u => ({ address: u.address, pendingSocialVerifications: u.pendingSocialVerifications })) });
}

export default withAdminAuth(handler);
