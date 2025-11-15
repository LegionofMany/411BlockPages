import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Wallet from '../../../lib/walletModel';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

function getAddressFromRequest(req: NextApiRequest): string | null {
  const auth = (req.headers.authorization || '') as string;
  const bearerToken = auth.startsWith('Bearer ') ? auth.slice(7) : auth || undefined;
  const rawCookies = typeof req.headers.cookie === 'string' ? req.headers.cookie : '';
  const cookies = Object.fromEntries(rawCookies.split(';').map(c => {
    const [k, ...rest] = c.trim().split('=');
    return [k, rest.join('=')];
  }).filter(([k]) => k));
  const cookieToken = cookies['token'];
  const token = bearerToken || cookieToken;
  if (!token || !JWT_SECRET) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { address?: string };
    return payload.address || null;
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'PATCH') {
    res.setHeader('Allow', 'POST, PATCH');
    res.status(405).end('Method Not Allowed');
    return;
  }

  await dbConnect();

  const address = getAddressFromRequest(req);
  if (!address) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { chain, exchangeSource, storageType } = req.body || {};
  if (!chain || typeof chain !== 'string') {
    res.status(400).json({ error: 'chain is required' });
    return;
  }

  const update: Record<string, unknown> = {};
  if (typeof exchangeSource === 'string') update.exchangeSource = exchangeSource || undefined;
  if (typeof storageType === 'string') update.storageType = storageType || undefined;

  const wallet = await Wallet.findOneAndUpdate(
    { address: address.toLowerCase(), chain: chain.toLowerCase() },
    { $set: update },
    { new: true, upsert: true },
  ).lean();

  res.status(200).json({ wallet });
}
