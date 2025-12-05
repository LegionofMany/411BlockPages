import type { NextApiRequest } from 'next';
import jwt from 'jsonwebtoken';
import * as cookie from 'cookie';

export function isAdminRequest(req: NextApiRequest): boolean {
  // Accept either header name for compatibility with various callers
  const adminHeader = (req.headers['x-admin-wallet'] || req.headers['x-admin-address']) as string | undefined;
  const adminList = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  if (adminHeader && adminList.includes(adminHeader.toLowerCase())) return true;

  // Check Authorization header (Bearer token)
  const auth = (req.headers.authorization || '') as string;
  const bearerToken = auth.startsWith('Bearer ') ? auth.slice(7) : auth || undefined;

  // Also accept a JWT stored in cookies (common for browser sessions).
  // Parse the raw Cookie header (avoid using `any` or relying on framework-augmented types).
  const rawCookies = typeof req.headers.cookie === 'string' ? req.headers.cookie : '';
  const parsedCookies = rawCookies && typeof cookie.parse === 'function'
    ? cookie.parse(rawCookies)
    : ({} as Record<string, string>);
  const cookieToken = parsedCookies['token'] as string | undefined;
  const token = bearerToken || cookieToken;
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || '') as unknown;
      if (typeof payload === 'object' && payload !== null) {
        const p = payload as Record<string, unknown>;
        if (p['admin'] === true) return true;
        const addr = p['address'];
        if (addr && typeof addr === 'string' && adminList.includes(addr.toLowerCase())) return true;
      }
    } catch {
      // invalid token => not admin
    }
  }
  return false;
}
