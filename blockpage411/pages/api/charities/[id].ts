import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Charity from '../../../models/Charity';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  const id = String(req.query.id || '').trim();
  if (!id) return res.status(400).json({ error: 'Missing id' });

  // Try to find by Mongo _id, givingBlockId, or name
  const byId = await Charity.findOne({ $or: [{ _id: id }, { givingBlockId: id }, { name: id }] }).lean();
  if (!byId) return res.status(404).json({ error: 'Not found' });
  return res.status(200).json({ charity: byId });
}
