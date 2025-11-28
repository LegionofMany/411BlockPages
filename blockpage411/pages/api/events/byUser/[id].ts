import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../lib/db';
import Event from '../../../../models/Event';
import User from '../../../../lib/userModel';
import jwt from 'jsonwebtoken';
import { isValidObjectId } from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).end('Method Not Allowed');
    return;
  }

  await dbConnect();

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'User id required' });
    return;
  }

  // Support special id === 'me' to return events for the authenticated user
  let userId: string = id;
  if (id === 'me') {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const JWT_SECRET = process.env.JWT_SECRET as string;
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const userAddress = typeof payload === 'object' && payload !== null ? payload.address : undefined;
    if (!userAddress) return res.status(401).json({ error: 'Invalid token payload' });
    const user = await User.findOne({ address: userAddress }).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    userId = String((user as any)._id);
  }

  if (!isValidObjectId(userId)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  const now = new Date();
  try {
    const [active, completed] = await Promise.all([
      Event.find({ creatorUserId: userId, deadline: { $gt: now } }).sort({ deadline: 1 }).lean(),
      Event.find({ creatorUserId: userId, deadline: { $lte: now } }).sort({ deadline: -1 }).lean(),
    ]);

    res.status(200).json({ active, completed });
  } catch (err: any) {
    // Return a friendly error instead of Mongoose CastError stack
    console.error('Error fetching events by user', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
}
