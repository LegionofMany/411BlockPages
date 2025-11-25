import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import Provider from 'lib/providerModel';
import { getCache, setCache } from 'lib/redisCache';

const CACHE_KEY = 'exchanges:list:v1';
const CACHE_TTL_SECONDS = 3600; // 1 hour

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).end('Method Not Allowed');
    return;
  }

  try {
    const cached = await getCache(CACHE_KEY);
    if (cached) {
      res.status(200).json(cached);
      return;
    }

    await dbConnect();

    const providers = await Provider.find({ type: 'CEX', status: { $in: ['seeded', 'approved'] } })
      .sort({ rank: 1, name: 1 })
      .select('name aliases website rank -_id')
      .lean();

    const payload = {
      exchanges: providers.map((p: any) => ({
        name: p.name,
        aliases: p.aliases || [],
        website: p.website || '',
        rank: p.rank || null,
      })),
    };

    await setCache(CACHE_KEY, payload, CACHE_TTL_SECONDS);

    res.status(200).json(payload);
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('Error fetching exchanges', err);
    res.status(500).json({ error: 'Failed to fetch exchanges' });
  }
}
