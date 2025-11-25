import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from '../../lib/db';
import Report from '../../lib/reportModel';
import Provider from '../../lib/providerModel';
import rateLimit from '../../lib/rateLimit';

const JWT_SECRET = process.env.JWT_SECRET as string;

function getUserFromRequest(req: NextApiRequest): { address: string } | null {
  const cookieHeader = req.headers.cookie || '';
  const tokenMatch = cookieHeader.split(';').find((c) => c.trim().startsWith('token='));
  if (!tokenMatch || !JWT_SECRET) return null;
  const token = tokenMatch.trim().slice('token='.length);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { address: string };
    return { address: decoded.address };
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!rateLimit(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { providerId, suspectAddress, chain, evidence } = req.body || {};

  const addr = (suspectAddress || '').toString().trim();
  const ch = (chain || '').toString().trim() || 'ethereum';

  if (!addr) {
    return res.status(400).json({ message: 'suspectAddress is required' });
  }
  if (!ch) {
    return res.status(400).json({ message: 'chain is required' });
  }

  await dbConnect();

  let providerDoc: any = null;
  if (providerId) {
    providerDoc = await Provider.findById(providerId);
    if (!providerDoc) {
      return res.status(400).json({ message: 'Invalid providerId' });
    }
  }

  const report = await Report.create({
    reporterUserId: user.address.toLowerCase(),
    reporterWalletId: null,
    providerId: providerDoc ? providerDoc._id : undefined,
    suspectAddress: addr,
    chain: ch,
    evidence: Array.isArray(evidence) ? evidence.slice(0, 10) : [],
  });

  if (providerDoc) {
    try {
      await Provider.updateOne(
        { _id: providerDoc._id },
        {
          $inc: { reportsCount: 1 },
          $addToSet: { uniqueReporters: user.address.toLowerCase() },
        },
      );
    } catch {
      // best-effort stats update
    }
  }

  return res.status(201).json(report.toObject());
}
