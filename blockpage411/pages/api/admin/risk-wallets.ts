import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import Wallet from 'lib/walletModel';
import { withAdminAuth } from '../../../lib/adminMiddleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect();

    if (req.method === 'GET') {
      const threshold = typeof req.query.minScore === 'string' ? parseInt(req.query.minScore, 10) : 60;
      const wallets = await Wallet.find(
        { riskScore: { $gte: threshold } },
        '-_id address chain riskScore riskCategory blacklisted suspicious trustScore'
      )
        .sort({ riskScore: -1 })
        .limit(100)
        .lean();

      return res.status(200).json({ wallets });
    }

    if (req.method === 'PATCH') {
      const { address, chain, riskScore, riskCategory } = req.body as {
        address?: string;
        chain?: string;
        riskScore?: number;
        riskCategory?: string;
      };

      if (!address || !chain) {
        return res.status(400).json({ message: 'address and chain are required' });
      }

      const update: Record<string, unknown> = {};
      const noteParts: string[] = [];

      if (typeof riskScore === 'number' && !Number.isNaN(riskScore)) {
        update.riskScore = Math.max(0, Math.min(100, riskScore));
        noteParts.push(`admin override score=${update.riskScore}`);
      }
      if (typeof riskCategory === 'string' && riskCategory) {
        update.riskCategory = riskCategory;
        noteParts.push(`category=${riskCategory}`);
      }

      const wallet = await Wallet.findOneAndUpdate(
        { address, chain },
        {
          $set: update,
          $push:
            noteParts.length > 0
              ? {
                  riskHistory: {
                    date: new Date(),
                    score: update.riskScore,
                    category: update.riskCategory,
                    note: noteParts.join(' '),
                  },
                }
              : undefined,
        },
        { new: true, upsert: false }
      ).lean() as unknown as {
        address?: string;
        chain?: string;
        riskScore?: number;
        riskCategory?: string;
      } | null;

      if (!wallet) {
        return res.status(404).json({ message: 'Wallet not found' });
      }

      return res.status(200).json({
        address: wallet.address,
        chain: wallet.chain,
        riskScore: wallet.riskScore,
        riskCategory: wallet.riskCategory,
      });
    }

    res.setHeader('Allow', ['GET', 'PATCH']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to handle risk wallets request', error: (err as Error).message });
  }
}

export default withAdminAuth(handler);
