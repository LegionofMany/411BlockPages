import type { NextApiRequest } from 'next';
import jwt from 'jsonwebtoken';
import * as cookie from 'cookie';
import { getAddress } from 'ethers';

function normalizeAddress(addr: string): string {
  try {
    return getAddress(addr);
  } catch {
    return (addr || '').toLowerCase().trim();
  }
}

function getAdminAllowList(): string[] {
  const raw = process.env.ADMIN_WALLETS || process.env.NEXT_PUBLIC_ADMIN_WALLETS || '';
  return raw
    .split(',')
    .map((s) => normalizeAddress(s))
    .filter(Boolean)
    .map((s) => s.toLowerCase());
}

export function isAdminRequest(req: NextApiRequest): boolean {
  const adminList = getAdminAllowList();

  // Development escape hatch only: allow header-based admin checks for local tooling.
  // In production, headers are spoofable and must never grant admin access.
  if (process.env.NODE_ENV === 'development') {
    const adminHeader = (req.headers['x-admin-wallet'] || req.headers['x-admin-address']) as string | undefined;
    if (adminHeader) {
      const normalized = normalizeAddress(adminHeader).toLowerCase();
      if (normalized && adminList.includes(normalized)) return true;
    }
  }

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
        const addr = p['address'];
        if (addr && typeof addr === 'string') {
          const normalized = normalizeAddress(addr).toLowerCase();
          if (normalized && adminList.includes(normalized)) return true;
        }
      }
    } catch {
      // invalid token => not admin
    }
  }
  return false;
}
