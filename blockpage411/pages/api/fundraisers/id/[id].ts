import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import Fundraiser from 'models/Fundraiser';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ message: 'id required' });
  await dbConnect();
  const f = await Fundraiser.findOne({ id }).lean();
  if (!f) return res.status(404).json({ message: 'Not found' });
  res.status(200).json({ fundraiser: f });
}
