import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  // Lightweight sample stats payload used by the LiveStats component.
  // In production this would query a database or metrics service.
  const payload = {
    flagged: 1245,
    ratings: 37812,
    chains: 12,
    lastUpdated: new Date().toISOString(),
  };

  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
  res.status(200).json(payload);
}
