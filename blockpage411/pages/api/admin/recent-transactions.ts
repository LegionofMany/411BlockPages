import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from '../../../lib/db';
import Transaction from '../../../lib/transactionModel';
import { withAdminAuth } from '../../../lib/adminMiddleware';
import { z } from 'zod';

const QuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const parsed = QuerySchema.safeParse(req.query);
      if (!parsed.success) return res.status(400).json({ message: 'Invalid query' });
      const page = Math.max(1, parseInt(parsed.data.page || '1', 10));
      const limit = Math.min(200, Math.max(10, parseInt(parsed.data.limit || '50', 10)));
      await dbConnect();
      const total = await Transaction.countDocuments({});
      const txs = await Transaction.find({}).sort({ date: -1 }).skip((page - 1) * limit).limit(limit);
      return res.status(200).json({ txs, page, limit, total });
    } catch (err) {
      return res.status(500).json({ message: 'Failed to fetch transactions', error: (err as Error).message });
    }
  }
  res.setHeader("Allow", ["GET"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default withAdminAuth(handler);
