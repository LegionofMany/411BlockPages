import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Transaction from '../../../lib/transactionModel';
import { withAdminAuth } from '../../../lib/adminMiddleware';

// PATCH /api/admin/dismiss-transaction-flag
// Body: { txid, chain, address, flagIndex }
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).json({ message: 'Method not allowed' });
  const { txid, chain, address, flagIndex } = req.body;
  if (!txid || !chain || !address || flagIndex === undefined) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  await dbConnect();
  const tx = await Transaction.findOne({ txid, chain, address });
  if (!tx) return res.status(404).json({ message: 'Transaction not found' });
  if (!Array.isArray(tx.flags) || tx.flags.length <= flagIndex) {
    return res.status(400).json({ message: 'Invalid flag index' });
  }
  tx.flags.splice(flagIndex, 1);
  if (tx.flags.length === 0) tx.flagged = false;
  await tx.save();
  res.status(200).json({ success: true, flags: tx.flags });
}

export default withAdminAuth(handler);
