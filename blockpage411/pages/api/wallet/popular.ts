import type { NextApiRequest, NextApiResponse } from 'next';
import redis from '../../../lib/redis';
import Wallet from '../../../lib/walletModel';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get popular wallets from Redis sorted set
    const popularWallets = await redis.zrevrange('popular_wallets', 0, 19);
    // Optionally fetch wallet details from MongoDB
    const walletDocs = await Wallet.find({ address: { $in: popularWallets } });
    // Map to include searchCount and lastRefreshed
    const wallets = walletDocs.map(w => ({
      address: w.address,
      searchCount: w.searchCount || 0,
      lastRefreshed: w.lastRefreshed || w.updatedAt || null,
      popular: w.popular || false,
      transactions: w.transactions || [],
    }));
    res.status(200).json({ wallets });
  } catch (error) {
    console.error('Redis or MongoDB error:', error);
    res.status(500).json({ error: 'Failed to fetch popular wallets.' });
  }
}
