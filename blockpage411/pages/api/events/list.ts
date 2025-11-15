import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Event from '../../../models/Event';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).end('Method Not Allowed');
    return;
  }

  await dbConnect();

  const page = parseInt(String(req.query.page || '1'), 10) || 1;
  const limit = Math.min(parseInt(String(req.query.limit || '20'), 10) || 20, 100);
  const skip = (page - 1) * limit;

  const charityId = req.query.charityId ? String(req.query.charityId) : undefined;
  const creatorUserId = req.query.creatorUserId ? String(req.query.creatorUserId) : undefined;
  const activeOnly = String(req.query.activeOnly || '').toLowerCase() === 'true';

  const filter: Record<string, unknown> = {};
  if (charityId) {
    filter.givingBlockCharityId = charityId;
  }
  if (creatorUserId) {
    filter.creatorUserId = creatorUserId;
  }
  if (activeOnly) {
    filter.deadline = { $gt: new Date() };
  }

  const [items, total] = await Promise.all([
    Event.find(filter).sort({ deadline: 1 }).skip(skip).limit(limit).lean(),
    Event.countDocuments(filter),
  ]);

  res.status(200).json({
    page,
    limit,
    total,
    results: items,
  });
}
