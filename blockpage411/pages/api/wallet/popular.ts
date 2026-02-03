import type { NextApiRequest, NextApiResponse } from 'next';
import redis from '../../../lib/redis';
import Wallet from '../../../lib/walletModel';
type WalletDoc = {
  address: string;
  searchCount?: number;
  lastRefreshed?: Date | string | null;
  updatedAt?: Date | string | null;
  popular?: boolean;
  transactions?: unknown[];
};
import dbConnect from '../../../lib/db';

// Simple in-memory cache to reduce load on hot endpoints in dev
const CACHE_TTL_MS = 30_000; // 30s
let cachedPopular: { value: unknown; expiresAt: number } | null = null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // return cached response when fresh
  if (cachedPopular && Date.now() < cachedPopular.expiresAt) {
    return res.status(200).json(cachedPopular.value);
  }
  try {
    // Get popular wallets from Redis sorted set (guard for stubbed Redis in dev)
    let popularWallets: string[] = [];
    // type guard for zrevrange availability on the redis client
    function hasZRevRange(obj: unknown): obj is { zrevrange: (...args: unknown[]) => Promise<string[]> | string[] } {
      return typeof obj === 'object' && obj !== null && typeof (obj as { [k: string]: unknown })['zrevrange'] === 'function';
    }
    if (hasZRevRange(redis)) {
      popularWallets = await redis.zrevrange('popular_wallets', 0, 19) as string[];
    }

    // If Redis is disabled/empty, avoid hitting MongoDB at all for this hot landing-page endpoint.
    // (This prevents noisy 500s in dev when DB is temporarily unavailable.)
    if (!popularWallets || popularWallets.length === 0) {
      const payload = { wallets: [] as Array<{ address: string; searchCount: number; lastRefreshed: string | null; popular: boolean }> };
      try {
        cachedPopular = { value: payload, expiresAt: Date.now() + CACHE_TTL_MS };
      } catch {
        // ignore
      }
      return res.status(200).json(payload);
    }

    // Best-effort MongoDB enrich. If DB fails, still return a safe payload.
    let walletDocs: WalletDoc[] = [];
    try {
      await dbConnect();
      // Use lean() so unknown fields (if present in Mongo) come through, even if not in the schema.
      walletDocs = await Wallet.find({ address: { $in: popularWallets } }).lean() as any;
    } catch (e) {
      console.warn('POPULAR WALLETS: Mongo unavailable; returning addresses only.', (e as any)?.message || e);
      const payload = {
        wallets: popularWallets.map((a) => ({
          address: a,
          searchCount: 0,
          lastRefreshed: null,
          popular: true,
        })),
      };
      try {
        cachedPopular = { value: payload, expiresAt: Date.now() + CACHE_TTL_MS };
      } catch {
        // ignore
      }
      return res.status(200).json(payload);
    }

    const docByAddress = new Map<string, WalletDoc>();
    for (const w of walletDocs) docByAddress.set(String(w.address || '').toLowerCase(), w);

    // Preserve the Redis ordering.
    const wallets = popularWallets.map((addr) => {
      const w = docByAddress.get(String(addr).toLowerCase());
      return {
        address: addr,
        searchCount: (w as any)?.searchCount || 0,
        lastRefreshed: ((w as any)?.lastRefreshed || (w as any)?.updatedAt || null) as any,
        popular: Boolean((w as any)?.popular ?? true),
      };
    });
    const payload = { wallets };
    // populate cache
    try {
      cachedPopular = { value: payload, expiresAt: Date.now() + CACHE_TTL_MS };
    } catch (e) {
      // ignore cache set errors in weird environments
      console.warn('Failed to set in-memory cache for popular wallets', e);
    }
    res.status(200).json(payload);
  } catch (error) {
    // Never hard-fail this endpoint; the home page should remain usable.
    console.warn('POPULAR WALLETS: degraded response due to error:', (error as any)?.message || error);
    const payload = { wallets: [] };
    try {
      cachedPopular = { value: payload, expiresAt: Date.now() + CACHE_TTL_MS };
    } catch {
      // ignore
    }
    res.status(200).json(payload);
  }
}
