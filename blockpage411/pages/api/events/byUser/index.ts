import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../lib/db';
import Event from '../../../../models/Event';
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

  await dbConnect();

  const now = new Date();

  const [active, completed] = await Promise.all([
    Event.find({ creatorAddress: address, deadline: { $gt: now } }).sort({ deadline: 1 }).lean(),
    Event.find({ creatorAddress: address, deadline: { $lte: now } }).sort({ deadline: -1 }).lean(),
  ]);

  const mapMinimal = (items: any[]) => items.map((ev) => ({ _id: ev._id, title: ev.title }));

  res.status(200).json({
    active: mapMinimal(active),
    completed: mapMinimal(completed),
  });
}
