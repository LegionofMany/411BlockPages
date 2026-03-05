import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/db';
import AdminAction from '../../lib/adminActionModel';
import { withAdminAuth } from '../../lib/adminMiddleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  const actions = await AdminAction.find({}).sort({ timestamp: -1 }).limit(50);
  res.status(200).json({ actions });
}

export default withAdminAuth(handler);
