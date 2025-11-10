import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Charity from '../../../models/Charity';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  const { id } = req.query;
  if (req.method === 'GET') {
    const c = await Charity.findOne({ _id: id }).lean();
    if (!c) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json(c);
  }
  res.setHeader('Allow', 'GET');
  res.status(405).end('Method Not Allowed');
}
