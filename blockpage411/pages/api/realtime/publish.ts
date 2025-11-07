import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(410).json({ error: 'Ably integration removed. Use client-side WebSocket (components/LiveTransactions) for live transactions.' });
}
