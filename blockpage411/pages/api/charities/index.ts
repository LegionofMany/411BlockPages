import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Charity from '../../../models/Charity';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  if (req.method === 'GET') {
    const q = String(req.query.q || '').trim();
    const filter: any = {};
    if (q) filter.name = { $regex: q, $options: 'i' };
    const list = await Charity.find(filter).limit(100).lean();
    res.status(200).json({ results: list });
    return;
  }
  res.setHeader('Allow', 'GET');
  res.status(405).end('Method Not Allowed');
}
