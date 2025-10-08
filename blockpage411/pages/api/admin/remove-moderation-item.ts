import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from '../../../lib/db';
import Wallet from '../../../lib/walletModel';
import { withAdminAuth } from '../../../lib/adminMiddleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "DELETE") {
    try {
      await dbConnect();
      const { id } = req.body;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ success: false, message: 'Missing or invalid id' });
      }
      // Try to remove from ratings
      const walletWithRating = await Wallet.findOne({ "ratings._id": id });
      if (walletWithRating) {
        await Wallet.updateOne(
          { _id: walletWithRating._id },
          { $pull: { ratings: { _id: id } } }
        );
        return res.status(200).json({ success: true });
      }
      // Try to remove from flags
      const walletWithFlag = await Wallet.findOne({ "flags._id": id });
      if (walletWithFlag) {
        await Wallet.updateOne(
          { _id: walletWithFlag._id },
          { $pull: { flags: { _id: id } } }
        );
        return res.status(200).json({ success: true });
      }
      return res.status(404).json({ success: false, message: "Item not found" });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to remove moderation item', error: (err as Error).message });
    }
  }
  res.setHeader("Allow", ["DELETE"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default withAdminAuth(handler);
