import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import Provider from 'lib/providerModel';
import { withAdminAuth } from '../../../../../lib/adminMiddleware';

async function handler(req: NextApiRequest, res: NextApiResponse){
  if (req.method !== 'PATCH') return res.status(405).json({ message: 'Method not allowed' });
  const { id } = req.query as { id?: string | string[] };
  const idStr = Array.isArray(id) ? id[0] : id;
  await dbConnect();
  const p = await Provider.findById(idStr);
  if (!p) return res.status(404).json({ message: 'Not found' });
  p.status = 'approved';
  p.seeded = true;
  await p.save();
  res.status(200).json(p);
}

export default withAdminAuth(handler);
