import type { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth } from '../../../lib/adminMiddleware';
import type { NextApiHandler } from 'next';
import { publishToAbly } from '../../../lib/ably';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { channel = 'transactions', event = 'tx', data } = req.body;
  try {
    await publishToAbly(channel, event, data);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('admin publish error', err);
    res.status(500).json({ error: 'publish failed' });
  }
}

export default withAdminAuth(handler as unknown as NextApiHandler);
