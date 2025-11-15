import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../lib/db';
import Event from '../../../../models/Event';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).end('Method Not Allowed');
    return;
  }

  await dbConnect();

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'User id required' });
    return;
  }

  const now = new Date();

  const [active, completed] = await Promise.all([
    Event.find({ creatorUserId: id, deadline: { $gt: now } }).sort({ deadline: 1 }).lean(),
    Event.find({ creatorUserId: id, deadline: { $lte: now } }).sort({ deadline: -1 }).lean(),
  ]);

  res.status(200).json({ active, completed });
}
