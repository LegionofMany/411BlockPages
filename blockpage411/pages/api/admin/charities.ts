import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Charity from '../../../models/Charity';
import { withAdminAuth } from '../../../lib/adminMiddleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id, hidden } = req.body as { id?: string; hidden?: boolean };
  if (!id || typeof hidden !== 'boolean') {
    return res.status(400).json({ error: 'id and hidden are required' });
  }

  await dbConnect();

  const updated = await Charity.findByIdAndUpdate(
    id,
    { $set: { hidden } },
    { new: true },
  ).lean();

  if (!updated) {
    return res.status(404).json({ error: 'Charity not found' });
  }

  return res.status(200).json({ charity: updated });
}

export default withAdminAuth(handler);
