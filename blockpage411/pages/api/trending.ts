import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/db';
import Wallet from '../../lib/walletModel';
import Charity from '../../models/Charity';
import Event from '../../models/Event';
import redis from '../../lib/redis';

type TrendingWallet = {
  address: string;
  chain: string;
  ens?: string;
  riskScore: number;
  flagsCount: number;
  searchCount?: number;
};

type TrendingCharity = {
  id: string;
  name: string;
  logo?: string;
  tags?: string[];
};

type TrendingEvent = {
  id: string;
  title: string;
  goalAmount: number;
  deadline: string;
};

export type TrendingResponse = {
  wallets: TrendingWallet[];
  mostSearchedWallets: TrendingWallet[];
  mostFlaggedWallets: TrendingWallet[];
  charities: TrendingCharity[];
  events: TrendingEvent[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const [walletsRaw, charitiesRaw, eventsRaw] = await Promise.all([
      Wallet.find({ suspicious: true })
        .sort({ flagsCount: -1, lastTxWithinHours: 1 })
        .limit(12)
        .lean(),
      Charity.find({ hidden: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      Event.find({ deadline: { $gte: new Date() } })
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
    ]);

    let searchCounts: Record<string, number> = {};
    try {
      // pull top searched wallets from Redis sorted set if available
      const key = 'popular_wallets';
      const hasZRevRange = (obj: unknown): obj is { zrevrange: (...args: unknown[]) => Promise<string[]> | string[] } => {
        return typeof obj === 'object' && obj !== null && typeof (obj as { [k: string]: unknown })['zrevrange'] === 'function';
      };
      if (hasZRevRange(redis)) {
        const raw = await (redis as any).zrevrange(key, 0, 49, 'WITHSCORES');
        if (Array.isArray(raw)) {
          for (let i = 0; i < raw.length; i += 2) {
            const addr = String(raw[i]);
            const score = Number(raw[i + 1] ?? 0);
            if (addr) searchCounts[addr.toLowerCase()] = score;
          }
        }
      }
    } catch (e) {
      // Redis is optional; ignore failures and fall back to DB only
      console.warn('Trending: failed to read search counts from Redis', e);
    }

    const wallets: TrendingWallet[] = (walletsRaw || []).map((w: any) => {
      const addrKey = String(w.address || '').toLowerCase();
      const searchCount = typeof searchCounts[addrKey] === 'number' ? searchCounts[addrKey] : undefined;
      return {
        address: w.address,
        chain: w.chain,
        ens: w.ens,
        riskScore: typeof w.riskScore === 'number' ? w.riskScore : 0,
        flagsCount: typeof w.flagsCount === 'number' ? w.flagsCount : 0,
        searchCount,
      };
    });

    const charities: TrendingCharity[] = (charitiesRaw || []).map((c: any) => ({
      id: String(c._id),
      name: c.name,
      logo: c.logo,
      tags: Array.isArray(c.tags) ? c.tags : [],
    }));

    const events: TrendingEvent[] = (eventsRaw || []).map((e: any) => ({
      id: String(e._id),
      title: e.title,
      goalAmount: e.goalAmount,
      deadline: e.deadline ? new Date(e.deadline).toISOString() : '',
    }));

    const mostSearchedWallets: TrendingWallet[] = [...wallets]
      .filter((w) => typeof w.searchCount === 'number')
      .sort((a, b) => (b.searchCount || 0) - (a.searchCount || 0))
      .slice(0, 6);

    const mostFlaggedWallets: TrendingWallet[] = [...wallets]
      .sort((a, b) => b.flagsCount - a.flagsCount)
      .slice(0, 6);

    const payload: TrendingResponse = {
      wallets,
      mostSearchedWallets,
      mostFlaggedWallets,
      charities,
      events,
    };

    return res.status(200).json(payload);
  } catch (error) {
    console.error('Failed to build trending payload', error);
    return res.status(500).json({ error: 'Failed to fetch trending data' });
  }
}
