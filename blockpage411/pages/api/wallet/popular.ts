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
    // Ensure MongoDB connection before querying
    await dbConnect();
    // Optionally fetch wallet details from MongoDB
  const walletDocs = await Wallet.find({ address: { $in: popularWallets } }) as WalletDoc[];
    // Map to include searchCount and lastRefreshed
    const wallets = walletDocs.map(w => ({
      address: w.address,
      searchCount: w.searchCount || 0,
      lastRefreshed: w.lastRefreshed || w.updatedAt || null,
      popular: w.popular || false,
      transactions: w.transactions || [],
    }));
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
    console.error('Redis or MongoDB error:', error);
    res.status(500).json({ error: 'Failed to fetch popular wallets.' });
  }
}
