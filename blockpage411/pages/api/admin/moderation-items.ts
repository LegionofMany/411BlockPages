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
      const items: Array<Record<string, unknown>> = [];
      wallets.forEach(w => {
        // Ratings flagged for moderation
        (w.ratings || []).forEach((r: unknown) => {
          const rr = r as { flagged?: boolean; _id?: unknown; text?: string; user?: string; date?: unknown };
          if (rr.flagged) {
            items.push({
              id: rr._id,
              type: "rating",
              content: rr.text,
              user: rr.user,
              date: rr.date,
              wallet: w.address,
              chain: w.chain,
              flagged: true
            });
          }
        });
        // Wallet flags (as comments/messages)
        (w.flags || []).forEach((f: unknown) => {
          const ff = f as { _id?: unknown; reason?: string; user?: string; date?: unknown };
          items.push({
            id: ff._id,
            type: "comment",
            content: ff.reason,
            user: ff.user,
            date: ff.date,
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
