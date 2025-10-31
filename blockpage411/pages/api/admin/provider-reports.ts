import type { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth } from '../../../lib/adminMiddleware';
import dbConnect from 'lib/db';
import Report from 'lib/reportModel';

export default withAdminAuth(async function handler(req: NextApiRequest, res: NextApiResponse){
  const { providerId } = req.query;
  if (!providerId) return res.status(400).json({ message: 'providerId required' });
  await dbConnect();
  const list = await Report.find({ providerId }).sort({ createdAt: -1 }).limit(200).lean();
  res.status(200).json(list || []);
});
