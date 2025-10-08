import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from '../../../lib/db';
import Wallet from '../../../lib/walletModel';
import { withAdminAuth } from '../../../lib/adminMiddleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      await dbConnect();
      // Find all flagged ratings and flagged wallet flags
      const wallets = await Wallet.find({
        $or: [
          { "ratings.flagged": true },
          { "flags.0": { $exists: true } }
        ]
      });
      const items: any[] = [];
      wallets.forEach(w => {
        // Ratings flagged for moderation
        (w.ratings || []).forEach((r: any) => {
          if (r.flagged) {
            items.push({
              id: r._id,
              type: "rating",
              content: r.text,
              user: r.user,
              date: r.date,
              wallet: w.address,
              chain: w.chain,
              flagged: true
            });
          }
        });
        // Wallet flags (as comments/messages)
        (w.flags || []).forEach((f: any) => {
          items.push({
            id: f._id,
            type: "comment",
            content: f.reason,
            user: f.user,
            date: f.date,
            wallet: w.address,
            chain: w.chain,
            flagged: true
          });
        });
      });
      return res.status(200).json({ items });
    } catch (err) {
      return res.status(500).json({ message: 'Failed to fetch moderation items', error: (err as Error).message });
    }
  }
  res.setHeader("Allow", ["GET"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default withAdminAuth(handler);
