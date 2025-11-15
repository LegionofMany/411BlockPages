import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Charity from '../../../models/Charity';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).end('Method Not Allowed');
    return;
  }

  await dbConnect();

  const page = parseInt(String(req.query.page || '1'), 10) || 1;
  const limit = Math.min(parseInt(String(req.query.limit || '20'), 10) || 20, 100);
  const category = req.query.category ? String(req.query.category) : undefined;

  const filter: Record<string, unknown> = {};
  if (category) {
    filter.categories = { $in: [category] };
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Charity.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    Charity.countDocuments(filter),
  ]);

  res.status(200).json({
    page,
    limit,
    total,
    results: items.map((c) => ({
      charityId: c.charityId || c.givingBlockId,
      name: c.name,
      description: c.description,
      logo: c.logo,
      donationAddress: c.donationAddress || c.wallet,
      categories: c.categories,
    })),
  });
}
