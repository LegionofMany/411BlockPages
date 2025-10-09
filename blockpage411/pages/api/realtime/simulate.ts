import type { NextApiRequest, NextApiResponse } from 'next';
import { publishToAbly } from '../../../lib/ably';

function randomHex(len: number) {
  return '0x' + [...Array(len)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const tx = {
    hash: randomHex(64).slice(2),
    from: randomHex(40).slice(2),
    to: randomHex(40).slice(2),
    value: Number((Math.random() * 5).toFixed(6)),
    timestamp: new Date().toISOString(),
  };
  try {
    await publishToAbly('transactions', 'tx', tx);
    res.status(200).json({ ok: true, tx });
  } catch (err) {
    console.error('simulate publish error', err);
    res.status(500).json({ error: 'publish failed' });
  }
}
