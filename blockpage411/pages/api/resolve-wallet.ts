import type { NextApiRequest, NextApiResponse } from 'next';
import { resolveWalletInput } from 'services/resolveWalletInput';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const qRaw = Array.isArray(req.query.q) ? req.query.q[0] : req.query.q;
  const q = String(qRaw || '').trim();
  if (!q) return res.status(400).json({ message: 'Missing q' });

  try {
    const resolved = await resolveWalletInput(q);
    if (!resolved) return res.status(404).json({ message: 'Unable to resolve input' });
    return res.status(200).json(resolved);
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || 'Resolution error' });
  }
}
