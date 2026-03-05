import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import jwt from 'jsonwebtoken';
import * as cookie from 'cookie';
import { getAddress } from 'ethers';

const JWT_SECRET = process.env.JWT_SECRET as string | undefined;

function normalizeAddress(addr: string): string {
  try {
    return getAddress(addr);
  } catch {
    return (addr || '').toLowerCase().trim();
  }
}

function getAdminAllowList(): string[] {
  // Prefer server-only env. Fall back to NEXT_PUBLIC_ADMIN_WALLETS only for backwards compat.
  const rawAdminEnv = process.env.ADMIN_WALLETS || process.env.NEXT_PUBLIC_ADMIN_WALLETS || '';
  return rawAdminEnv
    .split(',')
    .map((a) => normalizeAddress(a))
    .filter(Boolean)
    .map((a) => a.toLowerCase());
}

function getTokenFromRequest(req: NextApiRequest): string | undefined {
  const auth = String(req.headers.authorization || '');
  if (auth.startsWith('Bearer ')) return auth.slice(7);

  const cookieToken = (req.cookies as Record<string, string> | undefined)?.token;
  if (cookieToken) return cookieToken;

  const rawCookies = typeof req.headers.cookie === 'string' ? req.headers.cookie : '';
  if (!rawCookies) return undefined;
  try {
    const parsed = cookie.parse(rawCookies);
    return parsed.token;
  } catch {
    return undefined;
  }
}

function getAddressFromJwt(req: NextApiRequest): string | null {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  if (!JWT_SECRET) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as unknown;
    if (payload && typeof payload === 'object') {
      const p = payload as Record<string, unknown>;
      const addr = p.address;
      if (typeof addr === 'string' && addr.trim()) return normalizeAddress(addr);
    }
  } catch {
    // invalid token
  }
  return null;
}

export function getVerifiedAdminAddress(req: NextApiRequest): string | null {
  const v = (req as unknown as { __bp_adminAddress?: string | null }).__bp_adminAddress;
  if (typeof v === 'string' && v) return v;
  return null;
}
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // max 10 admin actions per minute per admin
const adminRateLimit: Record<string, { count: number; lastReset: number }> = {};

// Defensive admin wrapper: performs auth, rate-limiting, env validation,
// and ensures any unhandled errors in handlers are caught and logged.
export function withAdminAuth(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const ADMIN_WALLETS = getAdminAllowList();

    // Validate admin env configuration early
    if (!ADMIN_WALLETS || ADMIN_WALLETS.length === 0) {
      console.error('[withAdminAuth] ADMIN_WALLETS not configured. Set ADMIN_WALLETS (preferred)');
      return res.status(500).json({ error: 'server_misconfigured', message: 'admin wallets not configured' });
    }

    if (!JWT_SECRET) {
      console.error('[withAdminAuth] JWT_SECRET not configured. Admin auth requires JWT verification.');
      return res.status(500).json({ error: 'server_misconfigured', message: 'missing JWT_SECRET' });
    }

    const actor = getAddressFromJwt(req);
    if (!actor) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const actorLower = actor.toLowerCase();
    if (!ADMIN_WALLETS.includes(actorLower)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Optional guardrail: if caller provided an admin header, it must match the verified JWT address.
    const headerAdminRaw = (req.headers['x-admin-address'] || req.headers['x-admin-wallet'])?.toString();
    if (headerAdminRaw) {
      const headerAdmin = normalizeAddress(headerAdminRaw).toLowerCase();
      if (headerAdmin && headerAdmin !== actorLower) {
        return res.status(403).json({ message: 'Admin header does not match authenticated wallet' });
      }
    }

    // Attach verified admin identity for audit logs.
    (req as unknown as { __bp_adminAddress?: string }).__bp_adminAddress = actor;

    // Rate limiting (in-memory). Keep simple but defensive.
    try {
      const now = Date.now();
      if (!adminRateLimit[actorLower] || now - adminRateLimit[actorLower].lastReset > RATE_LIMIT_WINDOW) {
        adminRateLimit[actorLower] = { count: 1, lastReset: now };
      } else {
        adminRateLimit[actorLower].count++;
        if (adminRateLimit[actorLower].count > RATE_LIMIT_MAX) {
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
