import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import Fundraiser from 'models/Fundraiser';
import Pledge from 'models/Pledge';
import rateLimit from '../../../lib/rateLimit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  if (!rateLimit(req, res)) return; // simple rate limiting
  const body = req.body as unknown;
  const payload = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const fundraiserId = String(payload.fundraiserId ?? '');
  const externalId = String(payload.externalId ?? '');
  const amount = Number(payload.amount ?? 0);
  const currency = String(payload.currency ?? 'USD');
  const donor = payload.donor ? String(payload.donor) : undefined;
  const raw: unknown = payload.raw ?? null;
  if (!fundraiserId || !externalId || !amount) return res.status(400).json({ message: 'Missing required fields' });
  await dbConnect();
  // ensure fundraiser is accepting donations
  const fundraiser = await Fundraiser.findOne({ id: fundraiserId }).lean();
  if (!fundraiser) return res.status(404).json({ message: 'Fundraiser not found' });
  const fActive = (fundraiser as Record<string, unknown>)['active'];
  const fStatus = (fundraiser as Record<string, unknown>)['status'];
  if (fActive === false || (typeof fStatus === 'string' && fStatus !== 'approved')) {
    return res.status(400).json({ message: 'Fundraiser not accepting donations' });
  }
  // idempotent insert
  try {
    const pledge = await Pledge.create({ fundraiserId, externalId, amount: Number(amount), currency: (currency || 'USD').toUpperCase(), donor: donor ?? '', raw });
    // if created, increment fundraiser raised amount
  const f = await Fundraiser.findOne({ id: fundraiserId });
  if (!f) return res.status(404).json({ message: 'Fundraiser not found' });
  f.raised = (Number((f as unknown as { raised?: number }).raised) || 0) + Number(amount);
  // push recent donor entry and keep last 10
  const donorEntry = donor ? `${donor}:${amount}` : `Anonymous:${amount}`;
  f.recentDonors = Array.isArray(f.recentDonors) ? [...f.recentDonors.slice(-9), donorEntry] : [donorEntry];
  await f.save();
    return res.status(200).json({ success: true, pledge });
  } catch (err) {
    // duplicate key -> already recorded
    const e = err as { code?: number } | undefined;
    if (e && e.code === 11000) {
      return res.status(200).json({ success: true, message: 'Already recorded' });
    }
    return res.status(500).json({ message: 'Server error', error: String(err) });
  }
}
