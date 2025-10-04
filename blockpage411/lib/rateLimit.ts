// lib/rateLimit.ts
// Simple rate limiting middleware for Next.js API routes
import type { NextApiRequest, NextApiResponse } from 'next';

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20; // max requests per window
const ipCache: Record<string, { count: number; timestamp: number }> = {};

export default function rateLimit(req: NextApiRequest, res: NextApiResponse) {
  const ip = req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || '';
  const now = Date.now();
  if (!ipCache[ip] || now - ipCache[ip].timestamp > RATE_LIMIT_WINDOW) {
    ipCache[ip] = { count: 1, timestamp: now };
  } else {
    ipCache[ip].count++;
    if (ipCache[ip].count > RATE_LIMIT_MAX) {
      res.status(429).json({ message: 'Too many requests' });
      return false;
    }
  }
  return true;
}
