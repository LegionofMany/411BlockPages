import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Charity from '../../../models/Charity';
import { getCache, setCache } from '../../../lib/redisCache';
import mongoose from 'mongoose';

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

  const orClauses: Record<string, unknown>[] = [
    { givingBlockId: id },
    { charityId: id },
    { name: id },
  ];
  if (mongoose.Types.ObjectId.isValid(id)) {
    orClauses.unshift({ _id: id });
  }

  const byId = await Charity.findOne({ $or: orClauses }).lean();
  if (!byId) return res.status(404).json({ error: 'Not found' });
  // cache individual charity lookups for ~15 minutes
  try { await setCache(`charity:${id}`, byId, 900); } catch {}
  return res.status(200).json({ charity: byId });
}
