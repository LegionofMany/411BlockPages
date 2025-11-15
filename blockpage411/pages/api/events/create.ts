import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Event from '../../../models/Event';
import User from '../../../lib/userModel';
import jwt from 'jsonwebtoken';
import { isAddress } from 'ethers';
import { eventCreateSchema } from '../../../lib/validation/schemas';
import redisRateLimit from '../../../lib/redisRateLimit';

const JWT_SECRET = process.env.JWT_SECRET as string;

function getUserIdFromRequest(req: NextApiRequest): string | null {
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
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

  await dbConnect();

  const allowed = await redisRateLimit(req, res, { windowSec: 60, max: 10, keyPrefix: 'rl:events:create:' });
  if (!allowed) return;

  const address = getUserIdFromRequest(req);
  if (!address) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const user = await User.findOne({ address }).lean();
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  let parsed;
  try {
    parsed = eventCreateSchema.parse(req.body || {});
  } catch (err: any) {
    res.status(400).json({ error: 'Invalid payload', details: err?.errors ?? String(err) });
    return;
  }

  const { title, description, goalAmount, deadline, recipientWallet, givingBlockCharityId } = parsed;

  const deadlineDate = new Date(deadline);
  const now = new Date();
  const maxDeadline = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  if (!(deadlineDate > now && deadlineDate <= maxDeadline)) {
    res.status(400).json({ error: 'Deadline must be within 90 days from now' });
    return;
  }

  // Basic validation: try treating it as an EVM address; if fails, just ensure non-empty string
  if (!isAddress(recipientWallet as string)) {
    // allow non-EVM addresses but enforce minimal length
    if ((recipientWallet as string).length < 8) {
      res.status(400).json({ error: 'recipientWallet looks invalid' });
      return;
    }
  }

  const event = await Event.create({
    title: title.trim(),
    description: description.trim(),
    goalAmount: goalAmount,
    deadline: deadlineDate,
    recipientWallet: recipientWallet.trim(),
    creatorUserId: (user as any)._id,
    givingBlockCharityId: givingBlockCharityId || undefined,
  });

  res.status(201).json({ event });
}
