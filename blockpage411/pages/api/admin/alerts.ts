import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Alert from '../../../lib/alertModel';
import { isAdminRequest } from '../../../lib/admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdminRequest(req)) return res.status(403).json({ error: 'forbidden' });
  await dbConnect();
  const limit = Math.min(100, Number(req.query.limit || 50));
  const alerts = await Alert.find().sort({ createdAt: -1 }).limit(limit).lean();
  return res.status(200).json({ alerts });
}
