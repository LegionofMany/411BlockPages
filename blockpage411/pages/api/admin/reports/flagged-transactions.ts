import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../lib/db';
import Transaction from '../../../../lib/transactionModel';
import { withAdminAuth } from '../../../../lib/adminMiddleware';

type Flag = { reason: string; user: string; date?: string | Date };
type TxRow = {
  txid: string;
  chain: string;
  address: string;
  from?: string;
  to?: string;
  value?: string;
  date?: Date | string;
  type?: string;
  flags?: Flag[];
};

// GET /api/admin/reports/flagged-transactions?format=csv
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  await dbConnect();
  const flaggedTxs = await Transaction.find({ flagged: true }, '-_id txid chain address from to value date type flags').lean<TxRow[]>();
  const format = String(req.query.format || '').toLowerCase();
  if (format === 'csv' || req.headers.accept === 'text/csv') {
    const rows: (string | number)[][] = [
      ['TxID','Chain','Address','From','To','Value','Date','# Flags','Flag Details'],
      ...flaggedTxs.map(tx => [
        tx.txid, tx.chain, tx.address, tx.from || '-', tx.to || '-', tx.value || '-', tx.date ? new Date(tx.date).toLocaleString() : '-', (tx.flags || []).length,
        (tx.flags || []).map(f => `${f.user}: ${f.reason} (${f.date ? new Date(f.date).toLocaleString() : '-'})`).join('; ')
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="flagged_transactions.csv"');
    return res.status(200).send(csv);
  }
  res.status(200).json({ flaggedTxs });
}

export default withAdminAuth(handler);
