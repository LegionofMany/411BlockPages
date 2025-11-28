import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';

const rawAdminEnv = process.env.ADMIN_WALLETS || process.env.NEXT_PUBLIC_ADMIN_WALLETS || '';
const ADMIN_WALLETS = rawAdminEnv.split(',').map(a => a.toLowerCase().trim()).filter(Boolean);
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // max 10 admin actions per minute per admin
const adminRateLimit: Record<string, { count: number; lastReset: number }> = {};

// Defensive admin wrapper: performs auth, rate-limiting, env validation,
// and ensures any unhandled errors in handlers are caught and logged.
export function withAdminAuth(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Validate admin env configuration early
    if (!ADMIN_WALLETS || ADMIN_WALLETS.length === 0) {
      console.error('[withAdminAuth] ADMIN_WALLETS not configured. Set ADMIN_WALLETS or NEXT_PUBLIC_ADMIN_WALLETS');
      return res.status(500).json({ error: 'server_misconfigured', message: 'admin wallets not configured' });
    }

    const admin = req.headers['x-admin-address']?.toString().toLowerCase();
    if (!admin || !ADMIN_WALLETS.includes(admin)) {
      console.warn('[withAdminAuth] Access denied for', admin, 'allowed:', ADMIN_WALLETS);
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Rate limiting (in-memory). Keep simple but defensive.
    try {
      const now = Date.now();
      if (!adminRateLimit[admin] || now - adminRateLimit[admin].lastReset > RATE_LIMIT_WINDOW) {
        adminRateLimit[admin] = { count: 1, lastReset: now };
      } else {
        adminRateLimit[admin].count++;
        if (adminRateLimit[admin].count > RATE_LIMIT_MAX) {
          return res.status(429).json({ message: 'Rate limit exceeded' });
        }
      }
    } catch (rlErr) {
      console.error('[withAdminAuth] rate limit error', rlErr);
      // Don't block admin access if rate limiter has unexpected issue.
    }

    // Invoke the handler and catch any unhandled exceptions so admin UI
    // receives a consistent JSON error and server logs capture the stack.
    try {
      return await handler(req, res);
    } catch (err: any) {
      console.error('[withAdminAuth] handler error', err);
      const safeMessage = process.env.NODE_ENV === 'development' ? String(err) : 'internal server error';
      // If headers already sent, just log and return
      if (res.headersSent) {
        return;
      }
      return res.status(500).json({ error: 'internal', message: safeMessage });
    }
  };
}
