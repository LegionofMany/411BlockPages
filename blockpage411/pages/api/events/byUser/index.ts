import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../lib/db';
import Event from '../../../../models/Event';
import User from '../../../../lib/userModel';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

function getUserAddressFromRequest(req: NextApiRequest): string | null {
  const auth = (req.headers.authorization || '') as string;
  const bearerToken = auth.startsWith('Bearer ') ? auth.slice(7) : auth || undefined;
  const rawCookies = typeof req.headers.cookie === 'string' ? req.headers.cookie : '';
  const cookies = Object.fromEntries(
    rawCookies
      .split(';')
      .map((c) => {
        const [k, ...rest] = c.trim().split('=');
        return [k, rest.join('=')];
      })
      .filter(([k]) => k)
  );
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
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).end('Method Not Allowed');
    return;
  }

  const address = getUserAddressFromRequest(req);
  if (!address) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    await dbConnect();
  } catch (err) {
    // If DB isn't configured (local dev), return empty lists instead of 500
    console.warn('dbConnect failed in /api/events/byuser:', err);
    res.status(200).json({ active: [], completed: [] });
    return;
  }

  const now = new Date();

  // Find the user so we can query by creatorUserId (canonical field)
  const user = await User.findOne({ address }).lean();
  if (!user) {
    return res.status(200).json({ active: [], completed: [] });
  }

  // Support both legacy creatorAddress and new creatorUserId fields
  const userId = String((user as any)._id);

  const [active, completed] = await Promise.all([
    Event.find({
      $or: [
        { creatorUserId: userId, deadline: { $gt: now } },
        // @ts-ignore legacy field may exist on some documents
        { creatorAddress: address, deadline: { $gt: now } },
      ],
    })
      .sort({ deadline: 1 })
      .lean(),
    Event.find({
      $or: [
        { creatorUserId: userId, deadline: { $lte: now } },
        // @ts-ignore legacy field may exist on some documents
        { creatorAddress: address, deadline: { $lte: now } },
      ],
    })
      .sort({ deadline: -1 })
      .lean(),
  ]);

  // Return full event documents so callers (profile, settings) can render
  // descriptions, deadlines, goals, etc.
  res.status(200).json({
    active,
    completed,
  });
}
