import type { NextApiRequest } from 'next';
import jwt from 'jsonwebtoken';

export function isAdminRequest(req: NextApiRequest): boolean {
  const adminHeader = req.headers['x-admin-wallet'] as string | undefined;
  const adminList = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  if (adminHeader && adminList.includes(adminHeader.toLowerCase())) return true;

  const auth = (req.headers.authorization || '') as string;
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth || undefined;
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
