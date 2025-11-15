import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Charity from '../../../models/Charity';
import { getCache, setCache } from '../../../lib/redisCache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  const id = String(req.query.id || '').trim();
  if (!id) return res.status(400).json({ error: 'Missing id' });

  // Try to find by Mongo _id, givingBlockId, or name
  // try cache first
  try {
    const cached = await getCache(`charity:${id}`) as Record<string, unknown> | null;
    if (cached) return res.status(200).json({ charity: cached });
  } catch {
    // ignore cache errors
  }

  const byId = await Charity.findOne({ $or: [{ _id: id }, { givingBlockId: id }, { name: id }] }).lean();
  if (!byId) return res.status(404).json({ error: 'Not found' });
  try { await setCache(`charity:${id}`, byId, 3600); } catch {}
  return res.status(200).json({ charity: byId });
}
