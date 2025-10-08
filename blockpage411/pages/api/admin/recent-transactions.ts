import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from '../../../lib/db';
import Transaction from '../../../lib/transactionModel';
import { withAdminAuth } from '../../../lib/adminMiddleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      await dbConnect();
      // Get the most recent 100 transactions, sorted by date descending
      const txs = await Transaction.find({}).sort({ date: -1 }).limit(100);
      return res.status(200).json({ txs });
    } catch (err) {
      return res.status(500).json({ message: 'Failed to fetch transactions', error: (err as Error).message });
    }
  }
  res.setHeader("Allow", ["GET"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default withAdminAuth(handler);
