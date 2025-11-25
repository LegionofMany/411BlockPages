import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import Provider from 'lib/providerModel';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

async function fetchTopExchanges(limit = 100) {
  const url = `${COINGECKO_BASE}/exchanges?per_page=${limit}&page=1`;
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`CoinGecko error: ${res.status}`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map((ex: any, idx: number) => ({
    name: String(ex.name || ''),
    aliases: [String(ex.id || '').toUpperCase()].filter(Boolean),
    type: 'CEX',
    website: typeof ex.url === 'string' ? ex.url : (typeof ex.homepage === 'string' ? ex.homepage : undefined),
    market_cap: typeof ex.trade_volume_24h_btc === 'number' ? ex.trade_volume_24h_btc : undefined,
    rank: typeof ex.trust_score_rank === 'number' ? ex.trust_score_rank : idx + 1,
  })).filter((ex: any) => ex.name);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

  try {
    await dbConnect();
    const exchanges = await fetchTopExchanges(100);

    for (const ex of exchanges) {
      const hostname = ex.website ? new URL(ex.website).hostname : undefined;
      const aliases: string[] = ex.aliases || [];
      if (hostname) aliases.push(hostname);

      await Provider.findOneAndUpdate(
        { name: ex.name },
        {
          $set: {
            type: 'CEX',
            website: ex.website,
            market_cap: ex.market_cap,
            rank: ex.rank,
            status: 'seeded',
            seeded: true,
          },
          $addToSet: { aliases: { $each: aliases.filter(Boolean) } },
        },
        { upsert: true },
      );
    }

    res.status(200).json({ ok: true, count: exchanges.length });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('Error syncing exchanges', err);
    res.status(500).json({ error: 'Failed to sync exchanges' });
  }
}
