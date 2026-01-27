import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from 'lib/db';
import TxRating from 'lib/txRatingModel';
import { fetchEvmTxByHash } from 'lib/evmTxLookup';
import { normalizeEvmChainId } from 'lib/evmChains';

type JwtPayload = { address: string };

const JWT_SECRET = process.env.JWT_SECRET as string;

function getViewerAddress(req: NextApiRequest): string | null {
  const token = req.cookies.token;
  if (!token || !JWT_SECRET) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const addr = String(payload?.address || '').toLowerCase();
    return addr ? addr : null;
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === 'GET') {
    const chainRaw = Array.isArray(req.query.chain) ? req.query.chain[0] : req.query.chain;
    const txHashRaw = Array.isArray(req.query.txHash) ? req.query.txHash[0] : req.query.txHash;

    const chain = normalizeEvmChainId(String(chainRaw || '').trim());
    const txHash = String(txHashRaw || '').trim().toLowerCase();

    if (!chain || !txHash) return res.status(400).json({ message: 'chain and txHash required' });

    const ratings = await TxRating.find({ chain, txHash }).sort({ createdAt: -1 }).limit(100).lean();
    const count = ratings.length;
    const avgScore = count ? ratings.reduce((sum: number, r: any) => sum + Number(r.score || 0), 0) / count : 0;

    return res.status(200).json({
      chain,
      txHash,
      avgScore,
      count,
      ratings: ratings.map((r: any) => ({
        rater: r.rater,
        score: r.score,
        text: r.text,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    });
  }

  if (req.method === 'POST') {
    const viewer = getViewerAddress(req);
    if (!viewer) return res.status(401).json({ message: 'Not authenticated' });

    const chain = normalizeEvmChainId(String(req.body?.chain || '').trim());
    const txHash = String(req.body?.txHash || '').trim().toLowerCase();
    const score = Number(req.body?.score);
    const text = typeof req.body?.text === 'string' ? req.body.text : '';

    if (!chain || !txHash || !Number.isFinite(score) || score < 1 || score > 5) {
      return res.status(400).json({ message: 'chain, txHash, and score(1..5) required' });
    }

    // Ownership rule: you can only rate transactions you sent (from == connected wallet).
    const tx = await fetchEvmTxByHash(chain, txHash);
    if (!tx) return res.status(404).json({ message: 'Transaction not found on this chain' });

    const from = String(tx.from || '').toLowerCase();
    if (!from || from !== viewer) {
      return res.status(403).json({ message: 'You can only rate transactions sent from your connected wallet' });
    }

    const to = tx.to ? String(tx.to).toLowerCase() : undefined;
    const amountNative = typeof (tx as any)?.valueEther === 'string' ? String((tx as any).valueEther) : '';

    const doc = await TxRating.findOneAndUpdate(
      { chain, txHash, rater: viewer },
      {
        $set: {
          chain,
          txHash,
          rater: viewer,
          from,
          to,
          amountNative,
          score,
          text: String(text || '').slice(0, 2000),
        },
      },
      { upsert: true, new: true },
    ).lean();

    return res.status(200).json({ ok: true, rating: doc });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
