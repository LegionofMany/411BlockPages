import type { NextApiRequest, NextApiResponse } from 'next';
import redisRateLimit from 'lib/redisRateLimit';
import { getCache, setCache } from 'lib/redisCache';
import { fetchUserNFTs } from 'services/nfts';

const ALLOWED_CHAINS = new Set(['ethereum', 'base', 'polygon', 'arbitrum', 'optimism']);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { chain, address } = req.query;

  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  if (!chain || typeof chain !== 'string' || !address || typeof address !== 'string') {
    return res.status(400).json({ message: 'Chain and address required' });
  }

  const chainStr = chain.toLowerCase();
  if (!ALLOWED_CHAINS.has(chainStr)) return res.status(400).json({ message: 'Unsupported chain' });

  // rate limit per-IP
  try {
    const ok = await redisRateLimit(req, res, { windowSec: 60, max: 30 });
    if (!ok) return;
  } catch {
    // permissive if limiter fails
  }

  const addr = address.toLowerCase();
  const cacheKey = `nfts:${chainStr}:${addr}:v1`;

  try {
    const cached = (await getCache(cacheKey)) as any;
    if (cached) {
      try {
        res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=900');
      } catch {}
      return res.status(200).json(cached);
    }
  } catch {
    // ignore cache failures
  }

  const items = await fetchUserNFTs(addr, { chain: chainStr });
  const payload = { chain: chainStr, address: addr, count: items.length, items };

  try {
    await setCache(cacheKey, payload, 10 * 60);
  } catch {
    // ignore
  }

  try {
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=900');
  } catch {}

  return res.status(200).json(payload);
}
