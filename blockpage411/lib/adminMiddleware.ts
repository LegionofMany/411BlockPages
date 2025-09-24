import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';

const ADMIN_WALLETS = process.env.ADMIN_WALLETS?.split(',').map(a => a.toLowerCase().trim()) || [];
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // max 10 admin actions per minute per admin
const adminRateLimit: Record<string, { count: number; lastReset: number }> = {};

export function withAdminAuth(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const admin = req.headers['x-admin-address']?.toString().toLowerCase();
    if (!admin || !ADMIN_WALLETS.includes(admin)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    // Rate limiting
    const now = Date.now();
    if (!adminRateLimit[admin] || now - adminRateLimit[admin].lastReset > RATE_LIMIT_WINDOW) {
      adminRateLimit[admin] = { count: 1, lastReset: now };
    } else {
      adminRateLimit[admin].count++;
      if (adminRateLimit[admin].count > RATE_LIMIT_MAX) {
        return res.status(429).json({ message: 'Rate limit exceeded' });
      }
    }
    return handler(req, res);
  };
}
