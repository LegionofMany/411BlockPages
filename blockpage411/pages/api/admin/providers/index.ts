import type { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth } from '../../../../lib/adminMiddleware';
import dbConnect from 'lib/db';
import Provider from 'lib/providerModel';

async function handler(req: NextApiRequest, res: NextApiResponse){
  await dbConnect();
  const list = await Provider.find({}).sort({ createdAt: -1 }).limit(1000).lean();
  res.status(200).json(list);
}

export default withAdminAuth(handler);
