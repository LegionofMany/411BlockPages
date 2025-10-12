import { getRedisClient } from './redisCache';
import type { NextApiRequest, NextApiResponse } from 'next';

// Sliding window using Redis INCR with expiry
export default async function redisRateLimit(req: NextApiRequest, res: NextApiResponse, opts?: { windowSec?: number; max?: number; keyPrefix?: string }) {
  const client = getRedisClient();
  if (!client) return true; // fallback to permissive
  const windowSec = opts?.windowSec ?? 60;
  const max = opts?.max ?? 20;
  const keyPrefix = opts?.keyPrefix ?? 'rl:';
  const ip = req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || 'anon';
  const key = `${keyPrefix}${ip}`;
  try {
    const v = await client.incr(key);
    if (v === 1) await client.expire(key, windowSec);
    if (v > max) {
      res.status(429).json({ message: 'Too many requests' });
      return false;
    }
    return true;
  } catch {
    return true;
  }
}
