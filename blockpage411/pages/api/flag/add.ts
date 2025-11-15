import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import Wallet from 'lib/walletModel';
import Flag from 'models/Flag';
import jwt from 'jsonwebtoken';
import { isAddress } from 'ethers';
import { computeTrustScore } from 'services/trustScoreService';
import redisRateLimit from 'lib/redisRateLimit';
import { flagCreateSchema } from 'lib/validation/schemas';

const JWT_SECRET = process.env.JWT_SECRET as string;

interface JwtPayload { address: string }

function getUserAddress(req: NextApiRequest): string | null {
  const token = req.cookies.token;
  if (!token || !JWT_SECRET) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return payload.address;
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

  const userAddress = getUserAddress(req);
  if (!userAddress) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const allowed = await redisRateLimit(req, res, { windowSec: 60, max: 10, keyPrefix: 'rl:flag:add:' });
  if (!allowed) return;

  let parsed;
  try {
    parsed = flagCreateSchema.parse(req.body || {});
  } catch (err: any) {
    res.status(400).json({ error: 'Invalid payload', details: err?.errors ?? String(err) });
    return;
  }

  const { walletAddress, chain, reason } = parsed;

  // allow non-EVM but validate basic format for EVM chains
  if (['eth', 'ethereum', 'bsc', 'polygon'].includes(chain.toLowerCase())) {
    if (!isAddress(walletAddress)) {
      res.status(400).json({ error: 'Invalid EVM wallet address' });
      return;
    }
  }

  await dbConnect();

  const normalizedAddress = walletAddress.toLowerCase();
  const normalizedChain = chain.toLowerCase();

  // create a flag document for audit trail
  await Flag.create({
    walletAddress: normalizedAddress,
    chain: normalizedChain,
    flaggerAddress: userAddress.toLowerCase(),
    reason,
  });

  // recompute flagsCount from Flag documents for this wallet
  const flagsCount = await Flag.countDocuments({ walletAddress: normalizedAddress, chain: normalizedChain });

  const HEAVY_FLAG_THRESHOLD = Number(process.env.HEAVY_FLAG_THRESHOLD || '10');
  const isBlacklisted = flagsCount >= HEAVY_FLAG_THRESHOLD;

  const wallet = await Wallet.findOneAndUpdate(
    { address: normalizedAddress, chain: normalizedChain },
    {
      $set: {
        flagsCount,
        lastFlagger: userAddress.toLowerCase(),
        blacklisted: isBlacklisted,
      },
      $setOnInsert: { address: normalizedAddress, chain: normalizedChain },
    },
    { new: true, upsert: true },
  );

  // compute a simple trustScore for this wallet combining flags (no social links here)
  const trustScore = computeTrustScore({ verifiedLinksCount: 0, flagsCount });

  res.status(200).json({
    walletAddress: wallet.address,
    chain: wallet.chain,
    flagsCount,
    lastFlagger: wallet.lastFlagger,
    isBlacklisted,
    trustScore,
  });
}
