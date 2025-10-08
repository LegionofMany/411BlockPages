import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Transaction from '../../../lib/transactionModel';
import { withAdminAuth } from '../../../lib/adminMiddleware';

// GET /api/admin/flagged-transactions
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  await dbConnect();
  const flaggedTxs = await Transaction.find({ flagged: true }, '-_id txid chain address from to value date type flags');
  res.status(200).json({ flaggedTxs });
}

export default withAdminAuth(handler);
