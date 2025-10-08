import type { NextApiRequest, NextApiResponse } from 'next';

// In-memory fallback for demo
let txs = [
  { txid: "tx1", chain: "ETH", address: "0xabc", from: "0xfrom1", to: "0xto1", value: "1.23", date: new Date().toISOString(), flagged: false },
  { txid: "tx2", chain: "BTC", address: "1btc", from: "1from", to: "1to", value: "0.5", date: new Date().toISOString(), flagged: false },
];

import dbConnect from '../../../lib/db';
import Transaction from '../../../lib/transactionModel';
import { withAdminAuth } from '../../../lib/adminMiddleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const { txid, chain, address } = req.body;
      if (!txid || !chain || !address) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }
      await dbConnect();
      const tx = await Transaction.findOne({ txid, chain, address });
      if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });
      tx.flagged = true;
      await tx.save();
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to flag transaction', error: (err as Error).message });
    }
  }
  res.setHeader("Allow", ["POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default withAdminAuth(handler);
