import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Charity from '../../../models/Charity';
import { getCache, setCache } from '../../../lib/redisCache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  if (req.method === 'GET') {
    const q = String(req.query.q || '').trim();
    const filter: Record<string, unknown> = {};
    if (q) {
      filter.name = { $regex: q, $options: 'i' };
      const list = await Charity.find(filter).limit(100).lean();
      res.status(200).json({ results: list });
      return;
    }

    // no query — attempt to serve from cache
    try {
      const cached = await getCache('charities:all') as unknown[] | null;
      if (cached && Array.isArray(cached)) {
        res.status(200).json({ results: cached });
        return;
      }
    } catch {
      // ignore cache errors
    }

    const list = await Charity.find(filter).limit(1000).lean();
    // best-effort cache the result for 1 hour
    try { await setCache('charities:all', list, 3600); } catch {}
    res.status(200).json({ results: list });
    return;
  }
  res.setHeader('Allow', 'GET');
  res.status(405).end('Method Not Allowed');
}
