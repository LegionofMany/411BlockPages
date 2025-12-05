import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import { withAdminAuth } from '../../../lib/adminMiddleware';
import Charity from '../../../models/Charity';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === 'PATCH') {
    const { id, hidden } = req.body as { id?: string; hidden?: boolean };
    if (!id || typeof hidden !== 'boolean') {
      return res.status(400).json({ error: 'id and hidden are required' });
    }

    const doc = await Charity.findByIdAndUpdate(
      id,
      { $set: { hidden } },
      { new: true }
    ).lean();

    if (!doc) {
      return res.status(404).json({ error: 'Charity not found' });
    }

    return res.status(200).json({ charity: doc });
  }

  res.setHeader('Allow', 'PATCH');
  return res.status(405).end('Method Not Allowed');
}

export default withAdminAuth(handler);
