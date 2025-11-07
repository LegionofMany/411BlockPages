import type { NextApiRequest, NextApiResponse } from 'next';

// Ably integration removed — return 410 Gone so callers know to use the new
// client-side WebSocket approach (see the LiveTransactions component).
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(410).json({ error: 'Ably integration removed. Use client-side WebSocket (components/LiveTransactions) for live transactions.' });
}
