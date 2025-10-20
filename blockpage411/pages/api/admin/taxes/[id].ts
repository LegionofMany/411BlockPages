import type { NextApiRequest, NextApiResponse } from 'next';
import Fundraiser from '../../../../models/Fundraiser';
import { isAdminRequest } from '../../../../lib/admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdminRequest(req)) return res.status(403).json({ error: 'forbidden' });
  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'missing id' });
  try {
    const f = await Fundraiser.findOne({ id }).lean();
    if (!f) return res.status(404).json({ error: 'not found' });
    // return the requested id (from the route) and safely read tax fields
    const taxRate = (f && typeof (f as Record<string, unknown>).taxRate === 'number') ? (f as Record<string, unknown>).taxRate as number : 0;
    const taxCollected = (f && typeof (f as Record<string, unknown>).taxCollected === 'number') ? (f as Record<string, unknown>).taxCollected as number : 0;
    return res.status(200).json({ id, taxRate, taxCollected });
  } catch (err) {
    console.error('admin/taxes error', err);
    return res.status(500).json({ error: 'internal' });
  }
}
